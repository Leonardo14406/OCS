import { NextResponse, type NextRequest } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { AdminRole, UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { MOCK_MINISTRIES, MOCK_CATEGORIES } from "@/lib/mock-data"

// POST /api/admin/seed-taxonomy
//
// Super-admin-only endpoint to seed Ministry and ComplaintCategory data from
// existing mock data. Safe to call multiple times; it uses upserts.
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

    // Seed ministries based on MOCK_MINISTRIES
    for (const ministry of MOCK_MINISTRIES) {
      await db.ministry.upsert({
        where: { code: ministry.code },
        update: {
          name: ministry.name,
          description: ministry.description,
        },
        create: {
          id: ministry.id,
          code: ministry.code,
          name: ministry.name,
          description: ministry.description,
        },
      })
    }

    // Seed complaint categories
    for (const category of MOCK_CATEGORIES) {
      await db.complaintCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
        },
        create: {
          id: category.id,
          name: category.name,
          description: category.description,
        },
      })
    }

    // Seed join table ComplaintCategoryOnMinistry based on the
    // ComplaintCategory.ministries array of ministry IDs from mock data.
    for (const category of MOCK_CATEGORIES) {
      for (const ministryId of category.ministries) {
        await db.complaintCategoryOnMinistry.upsert({
          where: {
            categoryId_ministryId: {
              categoryId: category.id,
              ministryId,
            },
          },
          update: {},
          create: {
            categoryId: category.id,
            ministryId,
          },
        })
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[admin/seed-taxonomy] error", error)
    return NextResponse.json({ error: "Failed to seed taxonomy" }, { status: 500 })
  }
}
