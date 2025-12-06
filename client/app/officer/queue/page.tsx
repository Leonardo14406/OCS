/*
 * COMPLAINT QUEUE PAGE - OFFICER DASHBOARD
 *
 * Real-world replacements needed:
 * 1. Replace mock data filtering with real database queries
 * 2. Implement pagination for large complaint lists
 * 3. Add real-time updates when new complaints arrive
 * 4. Implement saved filter presets for officers
 * 5. Add bulk actions (assign multiple, export, etc.)
 * 6. Connect to real ministry and officer databases for filter options
 * 7. Add search functionality with full-text search
 */

"use client"

import { useState, useEffect } from "react"
import { OfficerHeader } from "@/components/officer-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ComplaintListItem } from "@/components/complaint-list-item"
import { MOCK_MINISTRIES } from "@/lib/mock-data"
import type { Complaint } from "@/lib/types"
import { Filter, Loader2, FileX } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ComplaintQueue() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [ministryFilter, setMinistryFilter] = useState("all")
  const [assignmentFilter, setAssignmentFilter] = useState("all")

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)

      try {
        const res = await fetch(`/api/officer/complaints?${params.toString()}`)
        if (!res.ok) {
          setComplaints([])
        } else {
          const data = await res.json()
          setComplaints(data)
        }
      } catch {
        setComplaints([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchComplaints()
  }, [statusFilter, priorityFilter])

  const resetFilters = () => {
    setStatusFilter("all")
    setPriorityFilter("all")
    setMinistryFilter("all")
    setAssignmentFilter("all")
  }

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (ministryFilter !== "all" ? 1 : 0) +
    (assignmentFilter !== "all" ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <OfficerHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">Complaint Queue</h1>
          <p className="text-muted-foreground">Review and manage citizen complaints</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
                {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
              </div>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear All
                </Button>
              )}
            </div>
            <CardDescription>Filter complaints by status, priority, ministry, and assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ministry</label>
                <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ministries</SelectItem>
                    {MOCK_MINISTRIES.map((ministry) => (
                      <SelectItem key={`${ministry.id}-${ministry.name}`} value={ministry.name}>
                        {ministry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assignment</label>
                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Complaints</SelectItem>
                    <SelectItem value="me">Assigned to Me</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Complaints{" "}
              <Badge variant="secondary" className="ml-2">
                {complaints.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading complaints...</p>
              </div>
            ) : complaints.length > 0 ? (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <ComplaintListItem key={complaint.id} complaint={complaint} viewMode="officer" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileX className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-2 text-lg font-medium">No complaints found</p>
                <p className="text-center text-sm text-muted-foreground">
                  Try adjusting your filters to see more results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
