/*
 * ADMIN LOGIN PAGE (DUMMY SCREEN)
 *
 * Real-world replacements needed:
 * 1. Implement real authentication system
 * 2. Add password hashing and secure storage
 * 3. Implement session management
 * 4. Add two-factor authentication
 * 5. Add rate limiting and brute force protection
 * 6. Connect to admin user database
 */

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scale, Shield } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState({ username: "", password: "" })

  // TODO: Replace with real authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - accepts any credentials
    console.log("[Mock Auth] Admin login attempt:", credentials.username)
    router.push("/admin")
  }

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
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="admin"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full gap-2">
              <Shield className="h-4 w-4" />
              Sign In
            </Button>

            <p className="text-xs text-center text-muted-foreground">Demo: Enter any credentials to proceed</p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
