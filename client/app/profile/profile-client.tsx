"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react"
import type { ComplaintStatus } from "@prisma/client"

interface ProfileAccount {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  createdAt: string | Date
  complaintsCount: number
}

interface ProfilePageClientProps {
  account: ProfileAccount
}

interface ProfileComplaint {
  id: string
  subject: string
  description: string
  category: string
  status: ComplaintStatus
  submittedAt: string | Date
  assignedOfficer?: string | null
}

export default function ProfilePageClient({ account }: ProfilePageClientProps) {
  const user = {
    id: account.id,
    fullName: account.fullName ?? "",
    email: account.email ?? "",
    phone: account.phone ?? "",
    address: account.address ?? "",
    city: account.city ?? "",
    state: account.state ?? "",
    postalCode: account.postalCode ?? "",
    createdAt: account.createdAt,
    complaintsCount: account.complaintsCount ?? 0,
  }

  const [complaints, setComplaints] = useState<ProfileComplaint[]>([])

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const res = await fetch("/api/profile/complaints")
        if (!res.ok) return
        const data = await res.json()
        setComplaints(data)
      } catch {
        // Ignore errors; UI will show empty state.
      }
    }

    loadComplaints()
  }, [])

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusCount = (status: string) => {
    return complaints.filter((c) => c.status === status).length
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information and view your complaint history.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">Citizen</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Address</p>
                        <p className="font-medium">
                          {user.address}
                          <br />
                          {user.city}, {user.state} {user.postalCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Member Since</p>
                        <p className="font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/profile/edit">Edit Profile</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Statistics Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Complaint Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Complaints</span>
                    <span className="text-2xl font-bold">{complaints.length}</span>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Under Review</span>
                      <span className="font-medium">{getStatusCount("under_review")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Investigating</span>
                      <span className="font-medium">{getStatusCount("investigating")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Resolved</span>
                      <span className="font-medium">{getStatusCount("resolved")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Complaints List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Complaints</CardTitle>
                      <CardDescription>View and track all your submitted complaints</CardDescription>
                    </div>
                    <Button asChild>
                      <Link href="/submit">
                        <FileText className="mr-2 h-4 w-4" />
                        New Complaint
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {complaints.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">You haven't filed any complaints yet</p>
                      <Button asChild>
                        <Link href="/submit">File Your First Complaint</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {complaints.map((complaint) => (
                        <Card key={complaint.id} className="hover:border-primary/50 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm font-medium">{complaint.id}</span>
                                  <StatusBadge status={complaint.status} />
                                </div>
                                <CardTitle className="text-lg truncate">{complaint.subject}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-1">{complaint.description}</CardDescription>
                              </div>
                              <Button asChild variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
                                <Link href={`/track?id=${complaint.id}`}>View Details</Link>
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Submitted {formatDate(complaint.submittedAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{complaint.category}</span>
                              </div>
                              {complaint.assignedOfficer && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>Officer: {complaint.assignedOfficer}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


