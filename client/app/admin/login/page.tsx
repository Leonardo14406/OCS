/*
 * ADMIN LOGIN PAGE
 *
 * Uses Kinde authentication for real login. 
 * Admins and officers are created in the admin panel and synced with Kinde.
 * When an admin/officer logs in via Kinde, their role is preserved from the database.
 */

"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scale, Shield, Loader2, LogIn } from "lucide-react"
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>Ombudsman Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in with your authorized admin or officer account. Your role and permissions
            are managed by your system administrator.
          </p>

          <LoginLink
            postLoginRedirectURL="/api/auth/official-redirect"
            className="w-full"
          >
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => setIsLoading(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Sign In with SSO
                </>
              )}
            </Button>
          </LoginLink>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Secure Authentication
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Not an admin? <a href="/" className="underline hover:text-primary">Return to citizen portal</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
