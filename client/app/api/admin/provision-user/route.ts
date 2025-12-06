import { NextResponse, type NextRequest } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { AdminRole, OfficerRole, UserRole } from "@prisma/client"
import { db } from "@/lib/db"

/**
 * POST /api/admin/provision-user
 *
 * Super admin-only endpoint that creates a user in Kinde (via Management API)
 * and then provisions / links the corresponding Account record in our
 * database. This ensures both systems stay in sync via kindeUserId.
 *
 * Expected JSON body:
 * {
 *   "email": string,
 *   "givenName"?: string,
 *   "familyName"?: string,
 *   "fullName"?: string,
 *   "role": "citizen" | "officer" | "admin",
 *   "officerRole"?: "investigator" | "senior_investigator" | "supervisor",
 *   "department"?: string,
 *   "employeeId"?: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentAccount = await db.account.findUnique({
      where: { kindeUserId: kindeUser.id },
    })

    if (!currentAccount || currentAccount.role !== UserRole.admin || currentAccount.adminRole !== AdminRole.super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      email,
      givenName,
      familyName,
      fullName,
      role,
      officerRole,
      department,
      employeeId,
    } = body as {
      email?: string
      givenName?: string
      familyName?: string
      fullName?: string
      role?: "citizen" | "officer" | "admin"
      officerRole?: "investigator" | "senior_investigator" | "supervisor"
      department?: string
      employeeId?: string
    }

    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 })
    }

    if (!["citizen", "officer", "admin"].includes(role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 })
    }

    if (role === "officer" && !officerRole) {
      return NextResponse.json({ error: "officerRole is required when role is 'officer'" }, { status: 400 })
    }

    const issuerUrl = process.env.KINDE_ISSUER_URL
    const clientId = process.env.KINDE_CLIENT_ID
    const clientSecret = process.env.KINDE_CLIENT_SECRET
    const audience = process.env.KINDE_AUDIENCE

    if (!issuerUrl || !clientId || !clientSecret || !audience) {
      return NextResponse.json(
        {
          error:
            "Kinde Management API env vars missing. Please set KINDE_ISSUER_URL, KINDE_MGMT_CLIENT_ID, KINDE_MGMT_CLIENT_SECRET, KINDE_MGMT_AUDIENCE.",
        },
        { status: 500 },
      )
    }

    // 1) Get a Management API access token via client credentials
    const tokenRes = await fetch(`${issuerUrl.replace(/\/$/, "")}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience,
      }),
    })

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text().catch(() => "")
      return NextResponse.json(
        { error: "Failed to obtain Kinde management token", details: errorBody || undefined },
        { status: 502 },
      )
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string }
    const accessToken = tokenJson.access_token

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access_token in Kinde token response" }, { status: 502 })
    }

    // 2) Create the user in Kinde via Management API
    const userRes = await fetch(`${issuerUrl.replace(/\/$/, "")}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email,
        given_name: givenName,
        family_name: familyName,
      }),
    })

    if (!userRes.ok) {
      const errorBody = await userRes.text().catch(() => "")
      return NextResponse.json(
        { error: "Failed to create user in Kinde", details: errorBody || undefined },
        { status: 502 },
      )
    }

    const createdKindeUser = (await userRes.json()) as { id?: string; email?: string }
    const kindeUserId = createdKindeUser.id

    if (!kindeUserId) {
      return NextResponse.json({ error: "Kinde user creation response missing id" }, { status: 502 })
    }

    // 3) Upsert internal Account and link to this Kinde user
    const existing = await db.account.findFirst({
      where: { email },
    })

    const now = new Date()

    // Ensure officers get a generated employeeId on the server side if one
    // does not already exist.
    let resolvedEmployeeId = existing?.employeeId ?? employeeId ?? null

    if (!resolvedEmployeeId && role === "officer") {
      const count = await db.account.count({ where: { role: UserRole.officer } })
      resolvedEmployeeId = `EMP-${now.getFullYear()}-${String(count + 1).padStart(3, "0")}`
    }

    const baseData: any = {
      fullName: fullName || `${givenName ?? ""} ${familyName ?? ""}`.trim() || email,
      email,
      department: department ?? existing?.department,
      employeeId: resolvedEmployeeId,
      isActive: true,
      kindeUserId,
    }

    let accountData: any = { ...baseData }

    if (role === "citizen") {
      accountData = {
        ...baseData,
        role: UserRole.citizen,
        adminRole: null,
        officerRole: null,
      }
    } else if (role === "admin") {
      accountData = {
        ...baseData,
        role: UserRole.admin,
        adminRole: existing?.adminRole ?? AdminRole.admin,
        officerRole: null,
      }
    } else if (role === "officer") {
      const resolvedOfficerRole: OfficerRole =
        (officerRole as OfficerRole | undefined) ?? existing?.officerRole ?? OfficerRole.investigator

      accountData = {
        ...baseData,
        role: UserRole.officer,
        officerRole: resolvedOfficerRole,
        adminRole: null,
      }
    }

    const account = existing
      ? await db.account.update({ where: { id: existing.id }, data: accountData })
      : await db.account.create({ data: accountData })

    return NextResponse.json(
      {
        kindeUser: createdKindeUser,
        account,
      },
      { status: existing ? 200 : 201 },
    )
  } catch (error) {
    console.error("[provision-user] unexpected error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
