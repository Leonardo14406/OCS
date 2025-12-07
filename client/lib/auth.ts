import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { AdminRole, OfficerRole, UserRole } from "@prisma/client"
import { db } from "./db"

async function updateKindeUserRole(kindeUserId: string, role: UserRole): Promise<boolean> {
  const issuerUrl = process.env.KINDE_ISSUER_URL
  const clientId = process.env.KINDE_CLIENT_ID
  const clientSecret = process.env.KINDE_CLIENT_SECRET

  // Debug: Log credential availability (without sensitive values)
  console.log("🔍 Kinde Credentials Check:")
  console.log("  KINDE_ISSUER_URL:", issuerUrl ? "✅ Set" : "❌ Missing")
  console.log("  KINDE_CLIENT_ID:", clientId ? `✅ Set (${clientId.substring(0, 8)}...)` : "❌ Missing")
  console.log("  KINDE_CLIENT_SECRET:", clientSecret ? "✅ Set (hidden)" : "❌ Missing")

  // If core env vars are missing, skip the update (not critical for auth flow)
  if (!issuerUrl || !clientId || !clientSecret) {
    console.warn("Kinde Management API env vars missing - skipping role update in Kinde")
    return false
  }

  // Build token request body
  const tokenBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  })

  // Get Management API access token
  const tokenRes = await fetch(`${issuerUrl.replace(/\/$/, "")}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody,
  })

  if (!tokenRes.ok) {
    throw new Error("Failed to obtain Kinde management token")
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenJson.access_token

  if (!accessToken) {
    throw new Error("Missing access_token in Kinde token response")
  }

  // Update user role in Kinde
  const updateRes = await fetch(`${issuerUrl.replace(/\/$/, "")}/api/v1/users/${kindeUserId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      properties: {
        org_role: role
      }
    }),
  })

  if (!updateRes.ok) {
    const errorBody = await updateRes.text().catch(() => "")
    console.error(`Failed to update Kinde user role: ${errorBody}`)
    return false
  }
  
  return true
}

async function createKindeUser(email: string, fullName: string) {
  const issuerUrl = process.env.KINDE_ISSUER_URL
  const clientId = process.env.KINDE_CLIENT_ID
  const clientSecret = process.env.KINDE_CLIENT_SECRET

  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error("Kinde Management API env vars missing - cannot create user in Kinde")
  }

  // Build token request body
  const tokenBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  })

  // Get Management API access token
  const tokenRes = await fetch(`${issuerUrl.replace(/\/$/, "")}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenBody,
  })

  if (!tokenRes.ok) {
    throw new Error("Failed to obtain Kinde management token")
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenJson.access_token

  if (!accessToken) {
    throw new Error("Missing access_token in Kinde token response")
  }

  // Create user in Kinde
  const nameParts = fullName.split(' ')
  const givenName = nameParts[0] || ''
  const familyName = nameParts.slice(1).join(' ') || ''

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
    throw new Error(`Failed to create user in Kinde: ${errorBody}`)
  }

  const createdKindeUser = (await userRes.json()) as { id?: string; email?: string }
  if (!createdKindeUser.id) {
    throw new Error("Kinde user creation response missing id")
  }

  return createdKindeUser
}

function getDefaultKindePermissions(role: UserRole, officerRole?: OfficerRole | null): string[] {
  if (role === UserRole.admin) return ['*']
  
  if (role === UserRole.officer) {
    switch (officerRole) {
      case OfficerRole.senior_investigator:
        return ['complaints:read', 'complaints:assign', 'investigations:write', 'evidence:read', 'reports:read']
      case OfficerRole.investigator:
        return ['complaints:read', 'investigations:write', 'evidence:read', 'notes:write']
      case OfficerRole.supervisor:
        return ['complaints:read', 'complaints:assign', 'investigations:read', 'reports:read', 'team:manage']
      default:
        return ['complaints:read']
    }
  }
  
  if (role === UserRole.citizen) {
    return ['complaints:create', 'complaints:read_own', 'evidence:upload']
  }
  
  return ['complaints:read']
}

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
      // Preserve the existing role - never downgrade admin/officer to citizen
      // If the existing account has admin or officer role, keep it
      const preservedRole = existingByEmail.role === UserRole.admin || existingByEmail.role === UserRole.officer
        ? existingByEmail.role
        : UserRole.citizen

      account = await db.account.update({
        where: { id: existingByEmail.id },
        data: {
          kindeUserId,
          fullName,
          email,
          avatar: (kindeUser.picture as string | null) ?? existingByEmail.avatar,
          lastLoginAt: now,
          // Explicitly preserve role and related fields for admin/officer
          role: preservedRole,
          // Preserve adminRole and officerRole if they exist
          ...(existingByEmail.adminRole && { adminRole: existingByEmail.adminRole }),
          ...(existingByEmail.officerRole && { officerRole: existingByEmail.officerRole }),
        },
      })

      // CRITICAL: Update Kinde's org_role to match database role
      // This is required for middleware to work correctly (middleware can't access Prisma)
      if (preservedRole !== UserRole.citizen) {
        try {
          const updated = await updateKindeUserRole(kindeUserId, preservedRole)
          if (!updated) {
            console.warn(`⚠️  Kinde Management API not configured. User ${email} has role ${preservedRole} in database but Kinde org_role may be incorrect.`)
            console.warn(`   To fix: Set KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET (KINDE_AUDIENCE is optional), or manually set org_role="${preservedRole}" in Kinde dashboard.`)
          }
        } catch (error) {
          // Non-critical error - log but don't break auth flow
          console.warn('Failed to update Kinde role, but continuing:', error)
        }
      }

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

    // Preserve admin/officer roles - never downgrade to citizen
    const preservedRole = account.role === UserRole.admin || account.role === UserRole.officer
      ? account.role
      : UserRole.citizen

    account = await db.account.update({
      where: { id: account.id },
      data: {
        fullName,
        email,
        avatar: (kindeUser.picture as string | null) ?? account.avatar,
        lastLoginAt: now,
        // Explicitly preserve role for admin/officer users
        role: preservedRole,
        // Preserve adminRole and officerRole if they exist
        ...(account.adminRole && { adminRole: account.adminRole }),
        ...(account.officerRole && { officerRole: account.officerRole }),
      },
    })

      // CRITICAL: Update Kinde's org_role to match database role if it's admin/officer
      // This is required for middleware to work correctly (middleware can't access Prisma)
      if (preservedRole !== UserRole.citizen) {
        try {
          const updated = await updateKindeUserRole(kindeUserId, preservedRole)
          if (!updated) {
            console.warn(`⚠️  Kinde Management API not configured. User ${email} has role ${preservedRole} in database but Kinde org_role may be incorrect.`)
            console.warn(`   To fix: Set KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET (KINDE_AUDIENCE is optional), or manually set org_role="${preservedRole}" in Kinde dashboard.`)
          }
        } catch (error) {
          // Non-critical error - log but don't break auth flow
          console.warn('Failed to update Kinde role, but continuing:', error)
        }
      }

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
        
        // Update Kinde role (optional - only if env vars are available)
        try {
          await updateKindeUserRole(kindeUserId, UserRole.admin)
        } catch (error) {
          // Non-critical error - log but don't break auth flow
          console.warn('Failed to update Kinde role for super admin, but continuing:', error)
        }
      }
    }
  }

  return account
}

// NEW FUNCTION: Auto-sync database users with Kinde
export async function syncDatabaseUserWithKinde(email: string) {
  try {
    // Check if user exists in database
    const dbUser = await db.account.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    })

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    // If user already has kindeUserId, they're already synced
    if (dbUser.kindeUserId) {
      return { success: true, message: 'User already synced with Kinde', user: dbUser }
    }

    // Create user in Kinde (only if env vars are available)
    let kindeUser
    try {
      kindeUser = await createKindeUser(dbUser.email, dbUser.fullName)
      
      // Update user with role in Kinde (non-critical if it fails)
      if (!kindeUser.id) {
        throw new Error("Kinde user creation response missing id")
      }
      
      await updateKindeUserRole(kindeUser.id, dbUser.role)
    } catch (error) {
      // If Kinde Management API is not configured, treat this as a best-effort sync.
      // The user exists in the database; on first successful Kinde login,
      // getCurrentAccount will attach the Kinde user to this account by email.
      if (error instanceof Error && error.message.includes("Kinde Management API env vars missing")) {
        return {
          success: true,
          message: "User exists in database; proceed with Kinde login (Management API not configured)",
          user: dbUser,
        }
      }
      throw error
    }

    // Update database with kindeUserId and permissions
    const updatedUser = await db.account.update({
      where: { id: dbUser.id },
      data: {
        kindeUserId: kindeUser.id,
        kindePermissions: getDefaultKindePermissions(dbUser.role, dbUser.officerRole),
        lastLoginAt: new Date(),
      },
    })

    return { 
      success: true, 
      message: 'User successfully synced with Kinde', 
      user: updatedUser,
      kindeUserId: kindeUser.id 
    }

  } catch (error) {
    console.error('Error syncing user with Kinde:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// NEW FUNCTION: Handle login attempt with auto-sync
export async function handleLoginWithAutoSync(email: string, password?: string) {
  try {
    // First, try to sync database user with Kinde if needed
    const syncResult = await syncDatabaseUserWithKinde(email)
    
    if (!syncResult.success && syncResult.error !== 'User not found in database') {
      // Sync failed for reasons other than user not existing
      throw new Error(`Kinde sync failed: ${syncResult.error}`)
    }

    // Proceed with normal Kinde authentication
    const { getUser } = getKindeServerSession()
    const kindeUser = await getUser()

    if (!kindeUser) {
      // If no Kinde user session, redirect to login
      throw new Error('No Kinde session - redirect to login')
    }

    // Get the current account (this will handle any remaining sync)
    const account = await getCurrentAccount()

    if (!account) {
      throw new Error('Failed to retrieve account after authentication')
    }

    return {
      success: true,
      account,
      syncResult
    }

  } catch (error) {
    console.error('Login with auto-sync error:', error)
    throw error
  }
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


