"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { Scale, LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

export function AdminHeader() {
  const pathname = usePathname()
  const { user } = useKindeBrowserClient()

  const displayName = (() => {
    if (!user) return "Admin User"
    const name = `${user.given_name ?? ""} ${user.family_name ?? ""}`.trim()
    return name || (user.email as string | undefined) || "Admin User"
  })()

  const initials = (() => {
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "SA"
    )
  })()

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/oversight", label: "Oversight", icon: FileText },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Ombudsman Admin</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">Super Admin</div>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <LogoutLink>
              <Button variant="ghost" size="icon" title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </LogoutLink>
          </div>
        </div>
      </div>
    </header>
  )
}
