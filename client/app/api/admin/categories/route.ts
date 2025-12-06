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

// GET: list all complaint categories
export async function GET() {
  const categories = await db.complaintCategory.findMany({
    orderBy: { name: "asc" },
  })

  return NextResponse.json(categories)
}

// POST: super admin creates a new complaint category, optionally linked to
// one or more ministries (by ministry IDs).
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth.error) {
    return NextResponse.json(auth.error.body, { status: auth.error.status })
  }

  const body = await req.json()
  const { name, description, ministries } = body as {
    name?: string
    description?: string
    ministries?: string[]
  }

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  try {
    const category = await db.complaintCategory.create({
      data: {
        name,
        description: description ?? "",
      },
    })

    if (Array.isArray(ministries) && ministries.length > 0) {
      for (const ministryId of ministries) {
        await db.complaintCategoryOnMinistry.create({
          data: {
            categoryId: category.id,
            ministryId,
          },
        })
      }
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("[admin/categories] create error", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
