"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LayoutDashboard, FileText, TrendingUp, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MOCK_CURRENT_OFFICER } from "@/lib/mock-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"

export function OfficerHeader() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: "/officer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/officer/queue", label: "Complaint Queue", icon: FileText },
    { href: "/officer/patterns", label: "AI Patterns", icon: TrendingUp },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/officer" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Officer Portal</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} asChild variant={isActive(link.href) ? "default" : "ghost"} size="sm">
              <Link href={link.href} className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}

          <div className="ml-4 flex items-center gap-2 border-l pl-4">
            <ThemeToggle />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-sm">
                {MOCK_CURRENT_OFFICER.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col lg:flex">
              <span className="text-sm font-medium leading-tight">{MOCK_CURRENT_OFFICER.fullName}</span>
              <span className="text-xs text-muted-foreground">{MOCK_CURRENT_OFFICER.department}</span>
            </div>
            <LogoutLink>
              <Button variant="ghost" size="icon" className="ml-2">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </LogoutLink>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="mt-6 flex items-center gap-3 border-b pb-4">
              <Avatar>
                <AvatarFallback>
                  {MOCK_CURRENT_OFFICER.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{MOCK_CURRENT_OFFICER.fullName}</span>
                <span className="text-sm text-muted-foreground">{MOCK_CURRENT_OFFICER.department}</span>
              </div>
            </div>
            <nav className="mt-6 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive(link.href) ? "default" : "ghost"}
                  className="justify-start"
                >
                  <Link href={link.href} className="flex items-center gap-2">
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                </Button>
              ))}
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>
              <LogoutLink>
                <Button variant="ghost" className="mt-2 justify-start text-destructive">
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              </LogoutLink>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
