// Type definitions for the Ombudsman Complaint System
// These types represent the core data models used throughout the application

export type ComplaintStatus = "submitted" | "under_review" | "investigating" | "resolved" | "closed" | "rejected"

export interface EvidenceItem {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  url?: string // Will be populated after upload in real system
}

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  createdAt: Date
  complaintsCount: number
}

export interface ComplaintStatusHistory {
  status: ComplaintStatus
  timestamp: Date
  note: string
  updatedBy?: string
}

export interface Complaint {
  id: string
  // Personal Information
  complainantName: string
  email: string
  phone: string
  address?: string
  isAnonymous: boolean

  // Complaint Details
  ministry: string
  category: string
  subject: string
  description: string
  incidentDate?: Date

  // Status & Tracking
  status: ComplaintStatus
  statusHistory: ComplaintStatusHistory[]
  submittedAt: Date
  updatedAt: Date
  assignedOfficer?: string

  // Evidence
  evidence: EvidenceItem[]

  // Priority & Classification
  priority: "low" | "medium" | "high" | "urgent"
  tags: string[]
}

export interface Ministry {
  id: string
  name: string
  code: string
  description: string
}

export interface ComplaintCategory {
  id: string
  name: string
  description: string
  ministries: string[] // Array of ministry IDs
}

export interface Officer {
  id: string
  fullName: string
  email: string
  employeeId: string
  department: string
  role: "investigator" | "senior_investigator" | "supervisor"
  assignedComplaints: number
  resolvedComplaints: number
  joinedAt: Date
  avatar?: string
}

export interface InvestigationNote {
  id: string
  complaintId: string
  officerId: string
  officerName: string
  note: string
  isInternal: boolean // If true, not visible to citizen
  createdAt: Date
  attachments?: string[]
}

export interface ComplaintSummary {
  complaintId: string
  aiGeneratedSummary: string
  keyPoints: string[]
  suggestedActions: string[]
  similarComplaints: string[] // IDs of similar complaints
  riskLevel: "low" | "medium" | "high"
  generatedAt: Date
}

export interface PatternInsight {
  id: string
  title: string
  description: string
  affectedMinistry: string
  complaintCount: number
  trend: "increasing" | "stable" | "decreasing"
  severity: "low" | "medium" | "high" | "critical"
  detectedAt: Date
  relatedComplaints: string[]
  recommendations: string[]
}

export interface Admin {
  id: string
  fullName: string
  email: string
  employeeId: string
  role: "admin" | "super_admin"
  department: string
  permissions: string[]
  joinedAt: Date
  avatar?: string
}

export type OfficerRole = "investigator" | "senior_investigator" | "supervisor"

export interface SystemMetrics {
  totalComplaints: number
  activeComplaints: number
  resolvedComplaints: number
  averageResolutionTime: number // in days
  complaintsByStatus: Record<ComplaintStatus, number>
  complaintsByMinistry: Record<string, number>
  complaintsByCategory: Record<string, number>
  monthlyTrend: {
    month: string
    submitted: number
    resolved: number
  }[]
  officerPerformance: {
    officerId: string
    name: string
    assigned: number
    resolved: number
    avgResolutionTime: number
  }[]
  priorityDistribution: Record<string, number>
}

export interface CorruptionHotspot {
  id: string
  ministry: string
  region: string
  score: number // 0-100, higher is worse
  complaintCount: number
  trend: "increasing" | "stable" | "decreasing"
  riskLevel: "low" | "medium" | "high" | "critical"
  lastUpdated: Date
}

