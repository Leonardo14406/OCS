// middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware"
import { NextResponse, type NextRequest } from "next/server" // Now has kindeAuth via declaration

export default withAuth(
  async function middleware(req: NextRequest) {
    const url = req.nextUrl
    const role = (req.kindeAuth?.user?.org_role as string) || "citizen"

    // Protect staff dashboards (/dashboard/*, /officer*, /admin*)
    const isOfficerRoute =
      url.pathname.startsWith("/dashboard/officer") || url.pathname === "/officer" || url.pathname.startsWith("/officer/")
    const isOfficerApiRoute = url.pathname.startsWith("/api/officer/")
    const isAdminRoute =
      url.pathname.startsWith("/dashboard/admin") || url.pathname === "/admin" || url.pathname.startsWith("/admin/")
    const isAdminApiRoute = url.pathname.startsWith("/api/admin/")

    // Officer routes (pages and API) — officers only (admins cannot access)
    if (isOfficerRoute || isOfficerApiRoute) {
      if (role !== "officer") {
        if (isOfficerApiRoute) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }

    // Admin routes (pages and API) — admin only
    if (isAdminRoute || isAdminApiRoute) {
      if (role !== "admin") {
        if (isAdminApiRoute) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }
  },
  {
    publicPaths: [
      "/",
      "/submit",
      "/track",
      "/track/:path*",
      "/profile",
      "/access-denied",
      "/api/auth/official-redirect",
      "/api/complaints",
      "/api/public/:path*",
      "/api/uploadthing",
      "/api/uploadthing/:path*",
    ],
    isReturnToCurrentPage: true,
    loginPage: "/",
    isAuthorized: () => true,
  },
)

export const config = {
  // Exclude Kinde auth routes from middleware so LoginLink/RegisterLink can
  // call /api/auth/login and /api/auth/kindeAuth/callback without being
  // intercepted and redirected back to the homepage.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/auth/).*)",
  ],
}