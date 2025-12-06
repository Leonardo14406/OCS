"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { RegisterLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, FileText, Search, User, DoorOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Header() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useKindeBrowserClient()

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: "/", label: "Home", icon: null },
    { href: "/submit", label: "Submit Complaint", icon: FileText },
    { href: "/track", label: "Track Complaint", icon: Search },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">O</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Ombudsman Portal</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} asChild variant={isActive(link.href) ? "default" : "ghost"} size="sm">
              <Link href={link.href} className="flex items-center gap-2">
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            </Button>
          ))}

          {/* Profile / Auth actions */}
          {isAuthenticated ? (
            <>
              <Button
                asChild
                variant={isActive("/profile") ? "default" : "outline"}
                size="sm"
                className="ml-2"
              >
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </Button>
              <LogoutLink>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  aria-label="Log out"
                >
                  <DoorOpen className="h-4 w-4" />
                </Button>
              </LogoutLink>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <RegisterLink>
                  <Button variant="outline" size="sm" className="ml-2">
                    <User className="mr-2 h-4 w-4" />
                    <span>Sign up</span>
                  </Button>
                </RegisterLink>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Sign up to view your profile and past complaints you&apos;ve submitted.
              </TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle />
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
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive(link.href) ? "default" : "ghost"}
                  className="justify-start"
                >
                  <Link href={link.href} className="flex items-center gap-2">
                    {link.icon && <link.icon className="h-5 w-5" />}
                    {link.label}
                  </Link>
                </Button>
              ))}

              {/* Profile / Auth actions (mobile) */}
              <div className="mt-4 border-t pt-4 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      asChild
                      variant={isActive("/profile") ? "default" : "ghost"}
                      className="justify-start"
                    >
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                    </Button>
                    <LogoutLink>
                      <Button variant="ghost" className="justify-start gap-2">
                        <DoorOpen className="h-5 w-5" />
                        <span>Log out</span>
                      </Button>
                    </LogoutLink>
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RegisterLink>
                        <Button variant="outline" className="justify-start">
                          <User className="mr-2 h-5 w-5" />
                          <span>Sign up</span>
                        </Button>
                      </RegisterLink>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Sign up to view your profile and past complaints you&apos;ve submitted.
                    </TooltipContent>
                  </Tooltip>
                )}

                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
