/*
 * COMPLAINT OVERSIGHT PAGE
 *
 * Real-world replacements needed:
 * 1. Replace reassignComplaint with real API endpoint
 * 2. Add real-time complaint status updates
 * 3. Implement server-side pagination and filtering
 * 4. Add bulk operations for multiple complaints
 * 5. Connect to real database queries
 * 6. Add audit logging for reassignments
 */

"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { EXTENDED_MOCK_COMPLAINTS } from "@/lib/mock-data"
import type { Complaint } from "@/lib/types"
import { Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function ComplaintOversightPage() {
  const { toast } = useToast()
  // TODO: Replace with real state management and API
  const [complaints, setComplaints] = useState<Complaint[]>(EXTENDED_MOCK_COMPLAINTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.complainantName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // In this view, super admins can observe which officer a complaint is
  // assigned to, but manual reassignment is disabled to keep assignment
  // automatic and ministry-based.

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
              {filteredComplaints.length} of {complaints.length} complaints
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
                {filteredComplaints.map((complaint) => (
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
                    <TableCell className="text-sm">{format(complaint.submittedAt, "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No complaints found matching your filters</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
