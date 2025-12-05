import { NextResponse, type NextRequest } from "next/server"
import { AdminRole, UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

async function requireSuperAdmin() {
  const { getUser } = getKindeServerSession()
  const kindeUser = await getUser()

  if (!kindeUser || !kindeUser.id) {
    return { error: { status: 401, body: { error: "Unauthorized" } } }
  }

  const currentAccount = await db.account.findUnique({
    where: { kindeUserId: kindeUser.id },
  })

  if (!currentAccount || currentAccount.role !== UserRole.admin || currentAccount.adminRole !== AdminRole.super_admin) {
    return { error: { status: 403, body: { error: "Forbidden" } } }
  }

  return { account: currentAccount }
}

// GET: list all ministries
export async function GET() {
  const ministries = await db.ministry.findMany({
    orderBy: { name: "asc" },
  })

  return NextResponse.json(ministries)
}

// POST: super admin creates a new ministry
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth.error) {
    return NextResponse.json(auth.error.body, { status: auth.error.status })
  }

  const body = await req.json()
  const { name, code, description } = body as {
    name?: string
    code?: string
    description?: string
  }

  if (!name || !code) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 })
  }

  try {
    const ministry = await db.ministry.create({
      data: {
        name,
        code,
        description: description ?? "",
      },
    })

    return NextResponse.json(ministry, { status: 201 })
  } catch (error) {
    console.error("[admin/ministries] create error", error)
    return NextResponse.json({ error: "Failed to create ministry" }, { status: 500 })
  }
}
