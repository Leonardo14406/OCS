/*
 * Complaint Tracking Page
 *
 * PRODUCTION REQUIREMENTS:
 * - Replace mock data fetching with real API endpoint
 * - Implement proper authentication for non-anonymous complaints
 * - Add real-time status updates (WebSocket or polling)
 * - Implement secure complaint ID validation
 * - Add document download functionality for evidence/reports
 * - Enable email/SMS notifications for status changes
 * - Add print/export functionality for complaint details
 */

"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Search, Loader2, AlertCircle, Calendar, FileText, User, Building } from "lucide-react"
import type { ComplaintStatus } from "@prisma/client"

interface TrackedComplaint {
  id: string
  trackingNumber?: string
  complainantName: string
  email: string
  phone: string
  isAnonymous: boolean
  ministry: string
  category: string
  subject: string
  description: string
  incidentDate?: string | Date | null
  status: ComplaintStatus
  submittedAt: string | Date
  assignedOfficer?: string | null
}

export default function TrackComplaintPage() {
  const searchParams = useSearchParams()
  const [complaintId, setComplaintId] = useState(searchParams.get("id") || "")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [complaint, setComplaint] = useState<TrackedComplaint | null>(null)

  useEffect(() => {
    const idFromUrl = searchParams.get("id")
    if (idFromUrl) {
      handleTrack(idFromUrl)
    }
  }, [])

  const handleTrack = async (id?: string) => {
    const raw = (id || complaintId).trim()

    if (!raw) {
      setError("Please enter a complaint ID or tracking number")
      return
    }

    setError("")
    setIsSearching(true)
    setComplaint(null)

    try {
      let res: Response
      const value = raw.toUpperCase()

      if (value.startsWith("CMP-")) {
        // Authenticated tracking by complaint ID
        res = await fetch(`/api/complaints/${encodeURIComponent(value)}`)
      } else {
        // Public tracking by private tracking number
        const params = new URLSearchParams({ trackingNumber: raw })
        res = await fetch(`/api/public/complaints/track?${params.toString()}`)
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Complaint not found")
        return
      }

      const data = (await res.json()) as TrackedComplaint
      setComplaint(data)
    } catch {
      setError("Failed to look up complaint. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">Track Your Complaint</h1>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Enter your complaint ID to view the current status and investigation progress.
            </p>
          </div>

          {/* Search Box */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Complaint Lookup</CardTitle>
              <CardDescription>
                Use your complaint ID (e.g., CMP-2024-001) or private tracking number to view your complaint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleTrack()
                }}
                className="space-y-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="complaintId" className="sr-only">
                      Complaint ID or tracking number
                    </Label>
                    <Input
                      id="complaintId"
                      value={complaintId}
                      onChange={(e) => setComplaintId(e.target.value)}
                      placeholder="CMP-2024-XXX or tracking number"
                      className="font-mono"
                    />
                  </div>
                  <Button type="submit" size="lg" disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Track Complaint
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Complaint Details */}
          {complaint && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Complaint {complaint.id}
                        <StatusBadge status={complaint.status} />
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Submitted on {formatDate(complaint.submittedAt)}
                      </CardDescription>
                    </div>
                    {complaint.assignedOfficer && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Assigned Officer</p>
                        <p className="font-medium">{complaint.assignedOfficer}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ministry</p>
                        <p className="font-medium">{complaint.ministry}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{complaint.category}</p>
                      </div>
                    </div>
                    {!complaint.isAnonymous && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Complainant</p>
                          <p className="font-medium">{complaint.complainantName}</p>
                        </div>
                      </div>
                    )}
                    {complaint.incidentDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Incident Date</p>
                          <p className="font-medium">{formatDate(complaint.incidentDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Subject</h4>
                    <p className="text-sm text-muted-foreground">{complaint.subject}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{complaint.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Investigation Timeline</CardTitle>
                  <CardDescription>
                    Timeline details will be available in a future update.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No timeline events are shown here yet.
                  </p>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Need help?</strong> If you have questions about your complaint or need to provide additional
                  information, contact us at <strong>support@ombudsman.gov</strong> or call{" "}
                  <strong>1-800-OMBUD-01</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
