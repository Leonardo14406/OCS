import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
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

// DELETE: remove a ministry by id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin()
  if (auth.error) {
    return NextResponse.json(auth.error.body, { status: auth.error.status })
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: "Ministry ID is required" }, { status: 400 })
  }

  try {
    await db.ministry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/ministries] delete error", error)
    return NextResponse.json({ error: "Failed to delete ministry" }, { status: 500 })
  }
}
