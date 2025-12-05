/*
 * OFFICER DASHBOARD - OVERVIEW PAGE
 *
 * Real-world replacements needed:
 * 1. Replace MOCK_CURRENT_OFFICER with actual authenticated officer data from session
 * 2. Implement real authentication check - redirect to login if not authenticated
 * 3. Replace mock statistics with real API calls to get officer metrics
 * 4. Replace EXTENDED_MOCK_COMPLAINTS with real database queries
 * 5. Add real-time updates for complaint counts using WebSocket or polling
 */

import { OfficerHeader } from "@/components/officer-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComplaintListItem } from "@/components/complaint-list-item"
import { MOCK_CURRENT_OFFICER, EXTENDED_MOCK_COMPLAINTS } from "@/lib/mock-data"
import { FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function OfficerDashboard() {
  // TODO: Replace with real authentication check
  const officer = MOCK_CURRENT_OFFICER

  // TODO: Replace with real API calls
  const myComplaints = EXTENDED_MOCK_COMPLAINTS.filter((c) => c.assignedOfficer === officer.fullName)
  const recentComplaints = myComplaints.slice(0, 5)

  const stats = [
    {
      title: "Assigned to Me",
      value: officer.assignedComplaints,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Resolved (Total)",
      value: officer.resolvedComplaints,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Under Investigation",
      value: myComplaints.filter((c) => c.status === "investigating").length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "High Priority",
      value: myComplaints.filter((c) => c.priority === "high" || c.priority === "urgent").length,
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
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">Welcome back, {officer.fullName}</h1>
          <p className="text-muted-foreground">
            {officer.department} • {officer.role.replace("_", " ").toUpperCase()}
          </p>
        </div>

        {/* Statistics Grid */}
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
                <CardDescription>Cases currently assigned to you</CardDescription>
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
            {recentComplaints.length > 0 ? (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <ComplaintListItem key={complaint.id} complaint={complaint} viewMode="officer" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">No complaints currently assigned to you.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
