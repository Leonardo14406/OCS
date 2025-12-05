import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { AdminRole, UserRole } from "@prisma/client"
import { db } from "./db"

export async function getCurrentAccount() {
  const { getUser } = getKindeServerSession()
  const kindeUser = await getUser()

  if (!kindeUser) return null

  const kindeUserId = kindeUser.id
  if (!kindeUserId) return null

  // Look up existing account by Kinde user id
  let account = await db.account.findUnique({
    where: { kindeUserId },
  })

  const now = new Date()

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "superadmin@yourdomain.com").toLowerCase()

  if (!account) {
    const email = kindeUser.email ?? `no-email-${kindeUserId}@example.com`
    const fullName =
      `${kindeUser.given_name ?? ""} ${kindeUser.family_name ?? ""}`.trim() || email || "Citizen"

    // If an internal account already exists for this email (e.g. created by a
    // super admin in the admin panel), attach this Kinde user to that
    // existing Account instead of creating a duplicate.
    const existingByEmail = await db.account.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    })

    if (existingByEmail) {
      account = await db.account.update({
        where: { id: existingByEmail.id },
        data: {
          kindeUserId,
          fullName,
          email,
          avatar: (kindeUser.picture as string | null) ?? existingByEmail.avatar,
          lastLoginAt: now,
        },
      })

      return account
    }

    const isBootstrapSuperAdmin = email.toLowerCase() === superAdminEmail

    let hasSuperAdmin = false
    if (isBootstrapSuperAdmin) {
      hasSuperAdmin = !!(await db.account.findFirst({
        where: { adminRole: AdminRole.super_admin },
      }))
    }

    if (isBootstrapSuperAdmin && !hasSuperAdmin) {
      account = await db.account.create({
        data: {
          role: UserRole.admin,
          adminRole: AdminRole.super_admin,
          fullName,
          email,
          avatar: (kindeUser.picture as string | null) ?? null,
          kindeUserId,
          kindePermissions: [],
          isActive: true,
          preferredLanguage: "en",
          createdAt: now,
          lastLoginAt: now,
        },
      })
    } else {
      // Default: create a citizen account on first login
      account = await db.account.create({
        data: {
          role: UserRole.citizen,
          fullName,
          email,
          avatar: (kindeUser.picture as string | null) ?? null,
          kindeUserId,
          kindePermissions: [],
          isActive: true,
          preferredLanguage: "en",
          createdAt: now,
          lastLoginAt: now,
        },
      })

      // Auto-claim anonymous complaints on first login for citizens
      await claimAnonymousComplaintsForAccount(account.id, account.email, account.phone ?? undefined)
    }
  } else {
    // Update last login timestamp and basic profile info
    const email = kindeUser.email ?? account.email ?? `no-email-${kindeUserId}@example.com`
    const fullName =
      `${kindeUser.given_name ?? ""} ${kindeUser.family_name ?? ""}`.trim() ||
      account.fullName ||
      email ||
      "Citizen"

    account = await db.account.update({
      where: { id: account.id },
      data: {
        fullName,
        email,
        avatar: (kindeUser.picture as string | null) ?? account.avatar,
        lastLoginAt: now,
      },
    })

    // If this existing account matches the SUPER_ADMIN_EMAIL and there is no
    // super admin yet, promote it to admin / super_admin.
    if (email.toLowerCase() === superAdminEmail) {
      const hasSuperAdmin = !!(await db.account.findFirst({
        where: { adminRole: AdminRole.super_admin },
      }))

      if (!hasSuperAdmin) {
        account = await db.account.update({
          where: { id: account.id },
          data: {
            role: UserRole.admin,
            adminRole: AdminRole.super_admin,
          },
        })
      }
    }
  }

  return account
}

async function claimAnonymousComplaintsForAccount(
  accountId: string,
  email?: string | null,
  phone?: string | null,
) {
  if (!email && !phone) return

  await db.complaint.updateMany({
    where: {
      complainantId: null,
      isAnonymous: true,
      OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined,
      ].filter(Boolean) as any,
    },
    data: {
      complainantId: accountId,
      // We keep isAnonymous as true to respect the citizen's original choice.
    },
  })
}


