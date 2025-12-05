import { NextResponse, type NextRequest } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { AdminRole, UserRole, OfficerRole } from "@prisma/client"
import { db } from "@/lib/db"

// GET: list non-citizen accounts (officers & admins)
export async function GET() {
  const accounts = await db.account.findMany({
    where: {
      NOT: { role: UserRole.citizen },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(accounts)
}

// POST: super-admin creates an internal user (officer or admin) by email
export async function POST(req: NextRequest) {
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
  const { email, fullName, role, officerRole, department } = body as {
    email?: string
    fullName?: string
    role?: "officer" | "admin"
    officerRole?: "investigator" | "senior_investigator" | "supervisor"
    department?: string
  }

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
  }

  // If an account already exists for this email, just update its role
  const existing = await db.account.findFirst({
    where: { email },
  })

  const now = new Date()

  // Ensure officers get a generated employeeId on the server side so it is
  // unique and consistent across the system.
  let employeeId = existing?.employeeId ?? null

  if (!employeeId && role === "officer") {
    const count = await db.account.count({ where: { role: UserRole.officer } })
    employeeId = `EMP-${now.getFullYear()}-${String(count + 1).padStart(3, "0")}`
  }

  const baseData = {
    fullName: fullName || email,
    email,
    isActive: true,
    department: department ?? existing?.department ?? null,
    employeeId: employeeId ?? existing?.employeeId ?? null,
  }

  if (role === "admin") {
    const data = {
      ...baseData,
      role: UserRole.admin,
      adminRole: existing?.adminRole ?? AdminRole.admin,
    } as const

    const account = existing
      ? await db.account.update({ where: { id: existing.id }, data })
      : await db.account.create({ data })

    return NextResponse.json(account, { status: existing ? 200 : 201 })
  }

  // Officer (with hierarchy sub-role stored in officerRole)
  const resolvedOfficerRole: OfficerRole =
    (officerRole as OfficerRole | undefined) ?? existing?.officerRole ?? OfficerRole.investigator

  const data = {
    ...baseData,
    role: UserRole.officer,
    officerRole: resolvedOfficerRole,
  } as const

  const account = existing
    ? await db.account.update({ where: { id: existing.id }, data })
    : await db.account.create({ data })

  return NextResponse.json(account, { status: existing ? 200 : 201 })
}

// PATCH: super-admin updates roles / activation status of internal users
export async function PATCH(req: NextRequest) {
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
  const { id, email, role, isActive } = body as {
    id?: string
    email?: string
    role?: "officer" | "admin" | "citizen"
    isActive?: boolean
  }

  if (!id && !email) {
    return NextResponse.json({ error: "id or email is required" }, { status: 400 })
  }

  const account = await db.account.findFirst({
    where: {
      OR: [{ id: id ?? "" }, email ? { email } : undefined].filter(Boolean) as any,
    },
  })

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  const data: any = {}

  if (typeof isActive === "boolean") {
    data.isActive = isActive
  }

  if (role) {
    if (role === "citizen") {
      data.role = UserRole.citizen
      data.adminRole = null
      data.officerRole = null
    } else if (role === "admin") {
      data.role = UserRole.admin
      data.adminRole = account.adminRole ?? AdminRole.admin
      data.officerRole = null
    } else if (role === "officer") {
      data.role = UserRole.officer
      data.officerRole = account.officerRole ?? OfficerRole.investigator
      data.adminRole = null
    }
  }

  const updated = await db.account.update({
    where: { id: account.id },
    data,
  })

  return NextResponse.json(updated)
}

