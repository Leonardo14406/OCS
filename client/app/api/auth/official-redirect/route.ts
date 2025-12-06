import { NextResponse } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { UserRole } from "@prisma/client"
import { getCurrentAccount } from "@/lib/auth"

export async function GET() {
  const { getUser } = getKindeServerSession()
  const kindeUser = await getUser()

  if (!kindeUser || !kindeUser.id) {
    return NextResponse.redirect(new URL("/access-denied", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }

  const account = await getCurrentAccount()

  if (!account || account.role === UserRole.citizen || !account.isActive) {
    return NextResponse.redirect(new URL("/access-denied", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }

  if (account.role === UserRole.officer) {
    return NextResponse.redirect(new URL("/officer", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }

  if (account.role === UserRole.admin) {
    return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
  }

  return NextResponse.redirect(new URL("/access-denied", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
}


