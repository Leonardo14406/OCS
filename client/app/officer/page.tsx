"use client"

/*
 * OFFICER DASHBOARD - OVERVIEW PAGE
 * Uses real profile data from /api/profile and recent complaints from
 * /api/officer/recent-complaints.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { OfficerHeader } from "@/components/officer-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComplaintListItem } from "@/components/complaint-list-item"
import type { Complaint } from "@/lib/types"
import { FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react"

type OfficerProfile = {
  fullName?: string | null
  department?: string | null
  role?: string | null
  officerRole?: string | null
}

export default function OfficerDashboard() {
  const [profile, setProfile] = useState<OfficerProfile | null>(null)
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadProfileAndComplaints = async () => {
      try {
        // Load profile (name, department, role)
        const profileRes = await fetch("/api/profile", { cache: "no-store" })
        if (profileRes.ok) {
          const data = (await profileRes.json()) as OfficerProfile
          if (!cancelled) setProfile(data)
        }

        // Load first 3 recent complaints for this officer
        const complaintsRes = await fetch("/api/officer/recent-complaints", { cache: "no-store" })
        if (complaintsRes.ok) {
          const data = (await complaintsRes.json()) as Complaint[]
          if (!cancelled) setRecentComplaints(data)
        } else if (!cancelled) {
          setRecentComplaints([])
        }
      } catch {
        if (!cancelled) {
          setRecentComplaints([])
        }
      } finally {
        if (!cancelled) setIsLoadingComplaints(false)
      }
    }

    loadProfileAndComplaints()

    return () => {
      cancelled = true
    }
  }, [])

  const officerName = profile?.fullName ?? "Officer"
  const roleLabel = profile?.officerRole
    ? profile.officerRole.replace("_", " ").toUpperCase()
    : (profile?.role ?? "officer").toString().toUpperCase()

  const stats = [
    {
      title: "Assigned to Me (recent)",
      value: recentComplaints.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Resolved (recent)",
      value: recentComplaints.filter((c) => c.status === "resolved").length,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Under Investigation (recent)",
      value: recentComplaints.filter((c) => c.status === "investigating").length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "High Priority (recent)",
      value: recentComplaints.filter((c) => c.priority === "high" || c.priority === "urgent").length,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <OfficerHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">Welcome back, {officerName}</h1>
          <p className="text-muted-foreground">
            {profile?.department ?? "Assigned Ministry"} • {roleLabel}
          </p>
        </div>

        {/* Statistics Grid (based on recent complaints for now) */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Complaints */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Recent Complaints</CardTitle>
                <CardDescription>First three most recent cases assigned to you</CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href="/officer/queue" className="flex items-center gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingComplaints ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">Loading your recent complaints...</p>
              </div>
            ) : recentComplaints.length > 0 ? (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <ComplaintListItem key={complaint.id} complaint={complaint} viewMode="officer" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">
                  You have no recent complaints assigned to you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
