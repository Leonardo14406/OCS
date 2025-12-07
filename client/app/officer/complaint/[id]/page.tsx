/*
 * COMPLAINT DETAIL VIEW - OFFICER DASHBOARD
 *
 * Real-world replacements needed:
 * 1. Replace mock complaint data with real database query by ID
 * 2. Implement real investigation note persistence to database
 * 3. Replace status update mock with real API endpoint
 * 4. Connect AI summary to actual AI service (OpenAI, Claude, etc.)
 * 5. Implement real file storage for evidence viewing/downloading
 * 6. Add audit logging for all officer actions
 * 7. Implement real-time collaboration (show when other officers are viewing)
 * 8. Add email notifications when requesting more info from citizen
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { OfficerHeader } from "@/components/officer-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { EvidenceViewer } from "@/components/evidence-viewer"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Complaint, InvestigationNote } from "@/lib/types"
import {
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Save,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { useWebSocket } from "@/hooks/useWebSocket"

export default function ComplaintDetailPage() {
  const params = useParams()
  const complaintId = params.id as string

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [notes, setNotes] = useState<InvestigationNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // AI streaming state (from WebSocket agent)
  const { isConnected, sendMessage, messages, error: wsError } = useWebSocket()
  const [aiStreamText, setAiStreamText] = useState("")
  const [isAiStreaming, setIsAiStreaming] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const hasRequestedSummaryRef = useRef(false)

  // Investigation form state
  const [newNote, setNewNote] = useState("")
  const [isInternalNote, setIsInternalNote] = useState(true)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState("")
  const [statusNote, setStatusNote] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [complaintRes, notesRes] = await Promise.all([
          fetch(`/api/officer/complaints/${complaintId}`, { cache: "no-store" }),
          fetch(`/api/officer/complaints/${complaintId}/notes`, { cache: "no-store" }),
        ])

        if (!complaintRes.ok) {
          setComplaint(null)
          setNotes([])
        } else {
          const complaintData = (await complaintRes.json()) as Complaint
          setComplaint(complaintData)

          if (notesRes.ok) {
            const notesData = (await notesRes.json()) as InvestigationNote[]
            setNotes(notesData)
          } else {
            setNotes([])
          }
        }
      } catch {
        setComplaint(null)
        setNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [complaintId])

  const handleAddNote = async () => {
    if (!newNote.trim() || !complaint) return

    setIsSavingNote(true)
    try {
      const res = await fetch(`/api/officer/complaints/${complaint.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, isInternal: isInternalNote }),
      })

      if (res.ok) {
        const created = (await res.json()) as InvestigationNote
        setNotes((prev) => [created, ...prev])
        setNewNote("")
      }
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!statusUpdate || !statusNote.trim() || !complaint) return

    try {
      const res = await fetch(`/api/officer/complaints/${complaint.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusUpdate, note: statusNote }),
      })

      if (res.ok) {
        const data = await res.json()
        const updatedComplaint = data.complaint as Complaint
        setComplaint(updatedComplaint)
      }
    } finally {
      setStatusUpdate("")
      setStatusNote("")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <OfficerHeader />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <OfficerHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Complaint Not Found</h1>
          <p className="text-muted-foreground">The complaint ID you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  }

  return (
    <div className="min-h-screen bg-background">
      <OfficerHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-muted-foreground">{complaint.id}</span>
            <StatusBadge status={complaint.status} />
            <Badge className={priorityColors[complaint.priority]} variant="secondary">
              {complaint.priority} priority
            </Badge>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">{complaint.subject}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Submitted {format(complaint.submittedAt, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>{complaint.ministry}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span>{complaint.category}</span>
            </div>
            {complaint.assignedOfficer && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Assigned to: {complaint.assignedOfficer}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* AI Insights (streamed via WebSocket, not wrapped in a Card) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">AI Insights for This Complaint</h2>
                </div>
                {isAiStreaming && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating summary…</span>
                  </div>
                )}
              </div>

              {aiError && (
                <p className="text-xs text-destructive">{aiError}</p>
              )}

              <div
                className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {aiStreamText
                  ? aiStreamText
                  : isConnected
                  ? "AI is generating a summary and recommended actions for this complaint. This may take a few moments…"
                  : "Connecting to AI assistant…"}
              </div>
            </section>

            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <CardTitle>Complaint Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold">Full Description:</h4>
                  <p className="leading-relaxed text-pretty">{complaint.description}</p>
                </div>

                {complaint.incidentDate && (
                  <div>
                    <h4 className="mb-1 font-semibold">Incident Date:</h4>
                    <p className="text-sm text-muted-foreground">{format(complaint.incidentDate, "MMMM d, yyyy")}</p>
                  </div>
                )}

                {complaint.tags.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {complaint.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complainant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Complainant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {complaint.isAnonymous ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Anonymous Complaint</AlertTitle>
                    <AlertDescription>
                      This complaint was submitted anonymously. Contact information is not available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{complaint.complainantName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{complaint.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{complaint.phone}</span>
                    </div>
                    {complaint.address && (
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{complaint.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence Files */}
            <EvidenceViewer evidence={complaint.evidence} />

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaint.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        {idx < complaint.statusHistory.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="mb-1 flex items-center gap-2">
                          <StatusBadge status={entry.status} />
                          <span className="text-xs text-muted-foreground">
                            {format(entry.timestamp, "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{entry.note}</p>
                        {entry.updatedBy && <p className="mt-1 text-xs text-muted-foreground">By: {entry.updatedBy}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Investigation Tools */}
          <div className="space-y-6">
            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>Change the complaint status and add a note</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Note</Label>
                  <Textarea
                    placeholder="Explain the status change..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button className="w-full" onClick={handleStatusUpdate} disabled={!statusUpdate || !statusNote.trim()}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </CardContent>
            </Card>

            {/* Investigation Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Investigation Notes
                </CardTitle>
                <CardDescription>Add notes and updates about your investigation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea
                    placeholder="Enter investigation note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="internal-toggle" className="text-sm">
                    Internal Note (not visible to citizen)
                  </Label>
                  <Switch id="internal-toggle" checked={isInternalNote} onCheckedChange={setIsInternalNote} />
                </div>

                <Button className="w-full" onClick={handleAddNote} disabled={!newNote.trim() || isSavingNote}>
                  {isSavingNote ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Note
                    </>
                  )}
                </Button>

                <Separator />

                {/* Notes List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Previous Notes ({notes.length})</h4>
                  {notes.length > 0 ? (
                    <div className="max-h-96 space-y-3 overflow-y-auto">
                      {notes
                        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                        .map((note) => (
                          <div key={note.id} className="rounded-lg border bg-card p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-medium">{note.officerName}</span>
                              {note.isInternal && (
                                <Badge variant="secondary" className="text-xs">
                                  Internal
                                </Badge>
                              )}
                            </div>
                            <p className="mb-2 text-sm leading-relaxed">{note.note}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(note.createdAt, "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes yet. Add the first one above.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Mail className="mr-2 h-4 w-4" />
                  Request More Information
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Escalate to Supervisor
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive bg-transparent">
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as Dismissed
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
