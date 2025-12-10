/*
 * COMPLAINT OVERSIGHT PAGE
 *
 * Connected to real API endpoint:
 * - GET /api/admin/complaints for fetching all complaints
 */

"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Complaint } from "@/lib/types"
import { Search, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface ComplaintsResponse {
  complaints: Complaint[]
  total: number
  limit: number
  offset: number
}

export default function ComplaintOversightPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [total, setTotal] = useState(0)

  // Fetch complaints from real API
  useEffect(() => {
    let cancelled = false

    const loadComplaints = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter !== "all") params.set("status", statusFilter)
        if (priorityFilter !== "all") params.set("priority", priorityFilter)
        if (searchQuery) params.set("search", searchQuery)

        const res = await fetch(`/api/admin/complaints?${params.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch complaints")

        const data = (await res.json()) as ComplaintsResponse
        if (!cancelled) {
          setComplaints(data.complaints)
          setTotal(data.total)
        }
      } catch (error) {
        console.error("Error loading complaints:", error)
        if (!cancelled) {
          setComplaints([])
          setTotal(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Debounce search queries
    const timeoutId = setTimeout(loadComplaints, searchQuery ? 300 : 0)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [statusFilter, priorityFilter, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complaint Oversight</h1>
          <p className="text-muted-foreground">Monitor and manage all complaints across the system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
            <CardDescription>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading complaints...
                </span>
              ) : (
                `${complaints.length} of ${total} complaints`
              )}
            </CardDescription>

            <div className="flex flex-col md:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, subject, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Ministry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned Officer</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No complaints found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-mono text-sm">{complaint.id}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{complaint.subject}</div>
                        <div className="text-sm text-muted-foreground truncate">{complaint.complainantName}</div>
                      </TableCell>
                      <TableCell className="text-sm">{complaint.ministry.replace("Ministry of ", "")}</TableCell>
                      <TableCell>
                        <StatusBadge status={complaint.status} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            complaint.priority === "urgent"
                              ? "destructive"
                              : complaint.priority === "high"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {complaint.assignedOfficer || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(complaint.submittedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
