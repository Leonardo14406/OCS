// Mock API functions for Officer Dashboard
// TODO: Replace with real backend service integration

import type { Complaint, Officer, InvestigationNote, ComplaintSummary } from "./types"
import {
  EXTENDED_MOCK_COMPLAINTS,
  MOCK_CURRENT_OFFICER,
  MOCK_INVESTIGATION_NOTES,
  MOCK_COMPLAINT_SUMMARIES,
} from "./mock-data"

// TODO: Replace with real authentication service
export async function mockOfficerLogin(email: string, password: string): Promise<Officer | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock authentication - accept any email/password for demo
  if (email && password) {
    return MOCK_CURRENT_OFFICER
  }

  return null
}

// TODO: Replace with real backend service
export async function mockGetOfficerComplaints(filters?: {
  status?: string
  priority?: string
  ministry?: string
  assignedTo?: string
}): Promise<Complaint[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  let complaints = [...EXTENDED_MOCK_COMPLAINTS]

  if (filters?.status && filters.status !== "all") {
    complaints = complaints.filter((c) => c.status === filters.status)
  }

  if (filters?.priority && filters.priority !== "all") {
    complaints = complaints.filter((c) => c.priority === filters.priority)
  }

  if (filters?.ministry && filters.ministry !== "all") {
    complaints = complaints.filter((c) => c.ministry === filters.ministry)
  }

  if (filters?.assignedTo && filters.assignedTo !== "all") {
    if (filters.assignedTo === "me") {
      complaints = complaints.filter((c) => c.assignedOfficer === MOCK_CURRENT_OFFICER.fullName)
    } else if (filters.assignedTo === "unassigned") {
      complaints = complaints.filter((c) => !c.assignedOfficer)
    }
  }

  return complaints
}

// TODO: Replace with real backend service
export async function mockGetComplaintNotes(complaintId: string): Promise<InvestigationNote[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_INVESTIGATION_NOTES.filter((note) => note.complaintId === complaintId)
}

// TODO: Replace with real backend service
export async function mockAddInvestigationNote(
  complaintId: string,
  note: string,
  isInternal: boolean,
): Promise<InvestigationNote> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  const newNote: InvestigationNote = {
    id: `note-${Date.now()}`,
    complaintId,
    officerId: MOCK_CURRENT_OFFICER.id,
    officerName: MOCK_CURRENT_OFFICER.fullName,
    note,
    isInternal,
    createdAt: new Date(),
  }

  MOCK_INVESTIGATION_NOTES.push(newNote)
  return newNote
}

// TODO: Replace with real backend service
export async function mockUpdateComplaintStatus(
  complaintId: string,
  newStatus: string,
  note: string,
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const complaint = EXTENDED_MOCK_COMPLAINTS.find((c) => c.id === complaintId)
  if (complaint) {
    complaint.status = newStatus as any
    complaint.statusHistory.push({
      status: newStatus as any,
      timestamp: new Date(),
      note,
      updatedBy: MOCK_CURRENT_OFFICER.fullName,
    })
    complaint.updatedAt = new Date()
    return true
  }

  return false
}

// TODO: Replace with real backend service
export async function mockGetComplaintSummary(complaintId: string): Promise<ComplaintSummary | null> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return MOCK_COMPLAINT_SUMMARIES[complaintId] || null
}

// TODO: Replace with real backend service
export async function mockAssignComplaint(complaintId: string, officerId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  const complaint = EXTENDED_MOCK_COMPLAINTS.find((c) => c.id === complaintId)
  if (complaint) {
    complaint.assignedOfficer = MOCK_CURRENT_OFFICER.fullName
    return true
  }

  return false
}
