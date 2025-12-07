/*
 * ENHANCED OFFICER LOGIN PAGE - WITH KINDE AUTO-SYNC
 * 
 * This login page automatically creates Kinde accounts for existing database users
 * and then redirects to normal Kinde authentication flow.
 */

"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"

export default function EnhancedOfficerLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const [syncMessage, setSyncMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    setSyncStatus("syncing")
    setSyncMessage("Checking user and syncing with Kinde...")

    try {
      // Step 1: Check if user exists in database and sync with Kinde
      const syncResponse = await fetch("/api/auth/login-with-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          redirectTo: "/api/auth/official-redirect",
        }),
      })

      const syncData = await syncResponse.json()

      if (!syncResponse.ok) {
        if (syncData.code === "USER_NOT_FOUND") {
          setError("Your email is not registered in the system. Please contact an administrator.")
        } else {
          setError(syncData.error || "Failed to sync with authentication system.")
        }
        setSyncStatus("error")
        return
      }

      // Step 2: User is now synced, proceed with Kinde login.
      // After Kinde login, our /api/auth/official-redirect endpoint will
      // inspect the database role and send officers to /officer and admins
      // to /admin. Citizens will be denied.
      setSyncStatus("synced")
      setSyncMessage("User synced successfully. Redirecting to login...")

      // Redirect to Kinde login page and on success go through our
      // server-side role-based redirect.
      router.push("/api/auth/login?post_login_redirect_url=/api/auth/official-redirect")

    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login. Please try again.")
      setSyncStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Officer Portal</CardTitle>
          <CardDescription>Sign in to access the investigation dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="officer@ombudsman.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {syncStatus === "syncing" && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>{syncMessage}</AlertDescription>
              </Alert>
            )}

            {syncStatus === "synced" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{syncMessage}</AlertDescription>
              </Alert>
            )}

            {syncStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{syncMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {syncStatus === "syncing" ? "Syncing..." : "Sign In"}
            </Button>

            <div className="text-center">
              <LoginLink postLoginRedirectURL="/api/auth/official-redirect">
                <Button 
                  variant="link" 
                  className="text-sm" 
                  type="button"
                  disabled={isLoading}
                >
                  Already have Kinde account? Sign in directly
                </Button>
              </LoginLink>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Button variant="outline" className="text-sm" type="button">
              Forgot password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
