import { NextResponse } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json({ role: "citizen", isAuthenticated: false })
    }

    const account = await db.account.findUnique({
      where: { kindeUserId: kindeUser.id },
      select: { role: true, isActive: true },
    })

    if (!account || !account.isActive) {
      return NextResponse.json({ role: "citizen", isAuthenticated: true })
    }

    return NextResponse.json({ role: account.role, isAuthenticated: true })
  } catch (e) {
    return NextResponse.json({ role: "citizen", isAuthenticated: false })
  }
}
