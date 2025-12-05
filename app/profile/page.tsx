import { redirect } from "next/navigation"
import { getCurrentAccount } from "@/lib/auth"
import ProfilePageClient from "./profile-client"

export default async function ProfilePage() {
  const account = await getCurrentAccount()

  if (!account) {
    // Not logged in – send them through Kinde's auth flow
    redirect("/api/auth/kindeAuth?start_page=/profile")
  }

  const profileAccount = {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    address: account.address,
    city: account.city,
    state: account.state,
    postalCode: account.postalCode,
    createdAt: account.createdAt,
    complaintsCount: account.complaintsCount,
  }

  return <ProfilePageClient account={profileAccount} />
}
