import { NextResponse, type NextRequest } from "next/server"
import { syncDatabaseUserWithKinde, handleLoginWithAutoSync } from "@/lib/auth"

/**
 * POST /api/auth/login-with-sync
 * 
 * Handles login with automatic Kinde user creation for existing database users
 * 
 * Expected JSON body:
 * {
 *   "email": string,
 *   "redirectTo"?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, redirectTo } = body as {
      email?: string
      redirectTo?: string
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists in database and sync with Kinde if needed
    const syncResult = await syncDatabaseUserWithKinde(email)

    if (!syncResult.success) {
      if (syncResult.error === 'User not found in database') {
        return NextResponse.json({ 
          error: "User not found in database. Please contact an administrator.",
          code: "USER_NOT_FOUND"
        }, { status: 404 })
      }

      return NextResponse.json({ 
        error: `Sync failed: ${syncResult.error}`,
        code: "SYNC_FAILED"
      }, { status: 500 })
    }

    // If user was just created in Kinde, return success
    if (syncResult.message === 'User successfully synced with Kinde') {
      return NextResponse.json({
        success: true,
        message: "User created in Kinde successfully. Please proceed with normal login.",
        kindeUserId: syncResult.kindeUserId,
        user: syncResult.user,
        redirectTo: redirectTo || "/",
        requiresKindeLogin: true
      })
    }

    // User was already synced
    return NextResponse.json({
      success: true,
      message: "User already exists in Kinde. Please proceed with normal login.",
      user: syncResult.user,
      redirectTo: redirectTo || "/",
      requiresKindeLogin: true
    })

  } catch (error) {
    console.error("[login-with-sync] error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }, { status: 500 })
  }
}

/**
 * GET /api/auth/login-with-sync
 * 
 * Check sync status for a user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    const syncResult = await syncDatabaseUserWithKinde(email)

    return NextResponse.json({
      email,
      syncResult
    })

  } catch (error) {
    console.error("[login-with-sync] GET error:", error)
    return NextResponse.json({ 
      error: "Internal server error"
    }, { status: 500 })
  }
}
