// Mock data for demonstration purposes
// TODO: Replace with real API integration

import type {
  Complaint,
  User,
  Ministry,
  ComplaintCategory,
  Officer,
  InvestigationNote,
  ComplaintSummary,
  PatternInsight,
} from "./types"

// TODO: Replace with real API integration
export const MOCK_MINISTRIES: Ministry[] = [
  { id: "1", name: "Ministry of Health", code: "MOH", description: "Healthcare services and public health" },
  { id: "2", name: "Ministry of Education", code: "MOE", description: "Educational institutions and policies" },
  { id: "3", name: "Ministry of Transport", code: "MOT", description: "Transportation and infrastructure" },
  { id: "4", name: "Ministry of Finance", code: "MOF", description: "Financial services and taxation" },
  { id: "5", name: "Ministry of Justice", code: "MOJ", description: "Legal affairs and judicial matters" },
  { id: "6", name: "Ministry of Environment", code: "MOENV", description: "Environmental protection and conservation" },
  { id: "7", name: "Ministry of Labor", code: "MOL", description: "Employment and worker rights" },
  { id: "8", name: "Ministry of Housing", code: "MOHOU", description: "Housing and urban development" },
]

// TODO: Replace with real API integration
export const MOCK_CATEGORIES: ComplaintCategory[] = [
  { id: "cat-001", name: "Service Delay", description: "Delays in service delivery or response times", ministries: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  { id: "cat-002", name: "Poor Quality Service", description: "Low quality or inadequate service provided", ministries: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  { id: "cat-003", name: "Misconduct", description: "Inappropriate behavior or conduct by officials", ministries: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  { id: "cat-004", name: "Policy Violation", description: "Violation of established policies or procedures", ministries: ["1", "2", "3", "4", "5", "6", "7", "8"] },
  { id: "cat-005", name: "Financial Irregularity", description: "Issues related to financial management or billing", ministries: ["4", "8"] },
  { id: "cat-006", name: "Discrimination", description: "Unfair treatment based on protected characteristics", ministries: ["1", "2", "5", "7"] },
  { id: "cat-007", name: "Safety Concerns", description: "Issues related to public or workplace safety", ministries: ["3", "6", "7"] },
  { id: "cat-008", name: "Communication Issues", description: "Poor communication or lack of information", ministries: ["1", "2", "3", "4", "5", "6", "7", "8"] },
]

// TODO: Replace with real API integration
export const MOCK_USER: User = {
  id: "user-001",
  fullName: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main Street",
  city: "Springfield",
  state: "State",
  postalCode: "12345",
  createdAt: new Date("2024-01-15"),
  complaintsCount: 3,
}

// TODO: Replace with real API integration
export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: "CMP-2024-001",
    complainantName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, Springfield",
    isAnonymous: false,
    ministry: "Ministry of Health",
    category: "Service Delay",
    subject: "Long waiting time for surgery approval",
    description:
      "I have been waiting for over 6 months for approval for a necessary surgery. Despite multiple follow-ups, there has been no response from the ministry. This delay is affecting my health and quality of life.",
    incidentDate: new Date("2024-06-15"),
    status: "investigating",
    statusHistory: [
      { status: "submitted", timestamp: new Date("2024-09-01"), note: "Complaint submitted by citizen" },
      {
        status: "under_review",
        timestamp: new Date("2024-09-03"),
        note: "Assigned to review team",
        updatedBy: "System",
      },
      {
        status: "investigating",
        timestamp: new Date("2024-09-10"),
        note: "Investigation initiated by Officer Maria Santos",
        updatedBy: "Maria Santos",
      },
    ],
    submittedAt: new Date("2024-09-01"),
    updatedAt: new Date("2024-09-10"),
    assignedOfficer: "Maria Santos",
    evidence: [
      {
        id: "ev-001",
        fileName: "medical_report.pdf",
        fileSize: 245000,
        fileType: "application/pdf",
        uploadedAt: new Date("2024-09-01"),
      },
      {
        id: "ev-002",
        fileName: "correspondence.pdf",
        fileSize: 180000,
        fileType: "application/pdf",
        uploadedAt: new Date("2024-09-01"),
      },
    ],
    priority: "high",
    tags: ["healthcare", "urgent"],
  },
  {
    id: "CMP-2024-042",
    complainantName: "Anonymous",
    email: "anonymous@system.gov",
    phone: "N/A",
    isAnonymous: true,
    ministry: "Ministry of Education",
    category: "Misconduct",
    subject: "Teacher misconduct at public school",
    description: "Reporting inappropriate behavior by a teacher towards students. Request confidentiality.",
    status: "under_review",
    statusHistory: [
      { status: "submitted", timestamp: new Date("2024-11-15"), note: "Anonymous complaint submitted" },
      {
        status: "under_review",
        timestamp: new Date("2024-11-16"),
        note: "Under preliminary review",
        updatedBy: "System",
      },
    ],
    submittedAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-11-16"),
    evidence: [],
    priority: "urgent",
    tags: ["education", "confidential"],
  },
  {
    id: "CMP-2024-089",
    complainantName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, Springfield",
    isAnonymous: false,
    ministry: "Ministry of Transport",
    category: "Poor Quality Service",
    subject: "Poor road maintenance causing damage",
    description:
      "The main road in our neighborhood has been in terrible condition for months, causing damage to vehicles. Despite multiple complaints to the local transport office, no action has been taken.",
    incidentDate: new Date("2024-08-01"),
    status: "resolved",
    statusHistory: [
      { status: "submitted", timestamp: new Date("2024-08-05"), note: "Complaint submitted" },
      { status: "under_review", timestamp: new Date("2024-08-06"), note: "Assigned for review" },
      { status: "investigating", timestamp: new Date("2024-08-10"), note: "Site inspection scheduled" },
      {
        status: "resolved",
        timestamp: new Date("2024-10-15"),
        note: "Road repairs completed and verified",
        updatedBy: "James Wilson",
      },
    ],
    submittedAt: new Date("2024-08-05"),
    updatedAt: new Date("2024-10-15"),
    assignedOfficer: "James Wilson",
    evidence: [
      {
        id: "ev-010",
        fileName: "road_damage.jpg",
        fileSize: 850000,
        fileType: "image/jpeg",
        uploadedAt: new Date("2024-08-05"),
      },
    ],
    priority: "medium",
    tags: ["infrastructure"],
  },
]

// TODO: Replace with real API integration
export function getMockComplaintById(id: string): Complaint | null {
  return MOCK_COMPLAINTS.find((c) => c.id === id) || null
}

// TODO: Replace with real API integration
export function getMockUserComplaints(userId: string): Complaint[] {
  return MOCK_COMPLAINTS
}

// TODO: Replace with real API integration
export const MOCK_OFFICERS: Officer[] = [
  {
    id: "off-001",
    fullName: "Maria Santos",
    email: "maria.santos@ombudsman.gov",
    employeeId: "EMP-2019-045",
    department: "Health & Welfare",
    role: "senior_investigator",
    assignedComplaints: 12,
    resolvedComplaints: 87,
    joinedAt: new Date("2019-03-15"),
  },
  {
    id: "off-002",
    fullName: "James Wilson",
    email: "james.wilson@ombudsman.gov",
    employeeId: "EMP-2020-112",
    department: "Infrastructure & Transport",
    role: "investigator",
    assignedComplaints: 8,
    resolvedComplaints: 54,
    joinedAt: new Date("2020-07-22"),
  },
  {
    id: "off-003",
    fullName: "Sarah Chen",
    email: "sarah.chen@ombudsman.gov",
    employeeId: "EMP-2018-028",
    department: "Education & Culture",
    role: "supervisor",
    assignedComplaints: 5,
    resolvedComplaints: 124,
    joinedAt: new Date("2018-01-10"),
  },
]

// TODO: Replace with real API integration
export const MOCK_CURRENT_OFFICER: Officer = MOCK_OFFICERS[0]

// TODO: Replace with real API integration
export const MOCK_INVESTIGATION_NOTES: InvestigationNote[] = [
  {
    id: "note-001",
    complaintId: "CMP-2024-001",
    officerId: "off-001",
    officerName: "Maria Santos",
    note: "Contacted Ministry of Health records department. Confirmed surgery approval was delayed due to missing documentation from the hospital.",
    isInternal: true,
    createdAt: new Date("2024-09-12"),
  },
  {
    id: "note-002",
    complaintId: "CMP-2024-001",
    officerId: "off-001",
    officerName: "Maria Santos",
    note: "Requested clarification from complainant regarding specific hospital department involved.",
    isInternal: false,
    createdAt: new Date("2024-09-15"),
  },
  {
    id: "note-003",
    complaintId: "CMP-2024-001",
    officerId: "off-001",
    officerName: "Maria Santos",
    note: "Meeting scheduled with Ministry officials for Nov 30. Will discuss process improvements to prevent future delays.",
    isInternal: true,
    createdAt: new Date("2024-11-20"),
  },
]

// TODO: Replace with real API integration
export const MOCK_COMPLAINT_SUMMARIES: Record<string, ComplaintSummary> = {
  "CMP-2024-001": {
    complaintId: "CMP-2024-001",
    aiGeneratedSummary:
      "Citizen reports 6-month delay in receiving surgery approval from Ministry of Health, despite multiple follow-ups. Medical evidence provided shows urgency. Similar patterns detected in 4 other cases from the same regional office.",
    keyPoints: [
      "6-month waiting period exceeds standard processing time",
      "Multiple follow-up attempts with no response",
      "Medical documentation supports urgency of procedure",
      "Regional office showing pattern of delays",
    ],
    suggestedActions: [
      "Contact Ministry of Health regional office immediately",
      "Request explanation for delay and current status",
      "Escalate to senior ministry officials if no response within 48 hours",
      "Review similar cases for systemic issues",
    ],
    similarComplaints: ["CMP-2024-015", "CMP-2024-023", "CMP-2024-067"],
    riskLevel: "high",
    generatedAt: new Date("2024-09-10"),
  },
  "CMP-2024-042": {
    complaintId: "CMP-2024-042",
    aiGeneratedSummary:
      "Anonymous complaint regarding teacher misconduct at public school. Requires sensitive handling due to confidentiality and potential safeguarding concerns.",
    keyPoints: [
      "Anonymous submission - identity protection critical",
      "Involves educational institution and minors",
      "Requires coordination with Ministry of Education",
      "Potential safeguarding implications",
    ],
    suggestedActions: [
      "Maintain strict confidentiality protocols",
      "Contact Ministry of Education child protection unit",
      "Request school records through official channels",
      "Consider involvement of specialized safeguarding team",
    ],
    similarComplaints: [],
    riskLevel: "high",
    generatedAt: new Date("2024-11-16"),
  },
}

// TODO: Replace with real API integration
export const MOCK_PATTERN_INSIGHTS: PatternInsight[] = [
  {
    id: "pattern-001",
    title: "Increasing Surgery Approval Delays - Ministry of Health",
    description:
      "AI analysis has detected a 340% increase in complaints regarding surgery approval delays from the Ministry of Health over the past 3 months. The pattern is concentrated in the Central Regional Office.",
    affectedMinistry: "Ministry of Health",
    complaintCount: 17,
    trend: "increasing",
    severity: "high",
    detectedAt: new Date("2024-11-15"),
    relatedComplaints: ["CMP-2024-001", "CMP-2024-015", "CMP-2024-023", "CMP-2024-067", "CMP-2024-088"],
    recommendations: [
      "Conduct immediate review of Central Regional Office processes",
      "Meet with Ministry leadership to address staffing or procedural issues",
      "Implement temporary expedited review process for urgent cases",
      "Request monthly progress reports until pattern resolves",
    ],
  },
  {
    id: "pattern-002",
    title: "Passport Processing Delays - Multiple Regions",
    description:
      "System-wide delays in passport processing detected across 5 regional offices. Average processing time has increased from 14 days to 45 days.",
    affectedMinistry: "Ministry of Interior",
    complaintCount: 23,
    trend: "increasing",
    severity: "medium",
    detectedAt: new Date("2024-11-10"),
    relatedComplaints: [],
    recommendations: [
      "Investigate potential system outages or technical issues",
      "Assess staffing levels across affected regions",
      "Consider implementing online tracking system for transparency",
    ],
  },
  {
    id: "pattern-003",
    title: "Improved Response Times - Ministry of Transport",
    description:
      "Positive trend detected: Ministry of Transport has reduced average complaint resolution time by 60% following recent process improvements.",
    affectedMinistry: "Ministry of Transport",
    complaintCount: 8,
    trend: "decreasing",
    severity: "low",
    detectedAt: new Date("2024-11-01"),
    relatedComplaints: [],
    recommendations: [
      "Document successful practices for knowledge sharing",
      "Consider replicating improvements in other ministries",
      "Request case study from Ministry leadership",
    ],
  },
]

// TODO: Replace with real API integration
// Generate additional mock complaints for officer dashboard
export const EXTENDED_MOCK_COMPLAINTS: Complaint[] = [
  ...MOCK_COMPLAINTS,
  {
    id: "CMP-2024-015",
    complainantName: "Emily Rodriguez",
    email: "emily.r@example.com",
    phone: "+1 (555) 234-5678",
    isAnonymous: false,
    ministry: "Ministry of Health",
    category: "Service Delay",
    subject: "Delayed specialist appointment approval",
    description: "Waiting 4 months for specialist appointment approval. No updates provided despite inquiries.",
    status: "submitted",
    statusHistory: [{ status: "submitted", timestamp: new Date("2024-11-25"), note: "Complaint submitted" }],
    submittedAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-25"),
    evidence: [],
    priority: "high",
    tags: ["healthcare"],
  },
  {
    id: "CMP-2024-067",
    complainantName: "Michael Thompson",
    email: "m.thompson@example.com",
    phone: "+1 (555) 345-6789",
    isAnonymous: false,
    ministry: "Ministry of Health",
    category: "Service Delay",
    subject: "Surgery scheduling delayed without explanation",
    description: "Approved surgery has been rescheduled 3 times without proper explanation or alternative dates.",
    status: "under_review",
    statusHistory: [
      { status: "submitted", timestamp: new Date("2024-11-10"), note: "Complaint submitted" },
      { status: "under_review", timestamp: new Date("2024-11-12"), note: "Assigned for review" },
    ],
    submittedAt: new Date("2024-11-10"),
    updatedAt: new Date("2024-11-12"),
    evidence: [],
    priority: "urgent",
    tags: ["healthcare", "urgent"],
  },
  {
    id: "CMP-2024-103",
    complainantName: "Lisa Anderson",
    email: "lisa.a@example.com",
    phone: "+1 (555) 456-7890",
    isAnonymous: false,
    ministry: "Ministry of Finance",
    category: "Financial Irregularity",
    subject: "Tax refund not received after 6 months",
    description: "Filed for tax refund 6 months ago. Online system shows 'processing' with no further information.",
    status: "submitted",
    statusHistory: [{ status: "submitted", timestamp: new Date("2024-11-28"), note: "Complaint submitted" }],
    submittedAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-11-28"),
    evidence: [
      {
        id: "ev-020",
        fileName: "tax_return.pdf",
        fileSize: 120000,
        fileType: "application/pdf",
        uploadedAt: new Date("2024-11-28"),
      },
    ],
    priority: "medium",
    tags: ["finance", "refund"],
  },
  {
    id: "CMP-2024-118",
    complainantName: "David Park",
    email: "d.park@example.com",
    phone: "+1 (555) 567-8901",
    isAnonymous: false,
    ministry: "Ministry of Labor",
    category: "Policy Violation",
    subject: "Workplace safety complaint ignored by inspector",
    description:
      "Reported unsafe working conditions to labor inspector. Inspector visited but no follow-up report or action taken.",
    status: "under_review",
    statusHistory: [
      { status: "submitted", timestamp: new Date("2024-11-20"), note: "Complaint submitted" },
      { status: "under_review", timestamp: new Date("2024-11-22"), note: "Preliminary review in progress" },
    ],
    submittedAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-22"),
    assignedOfficer: "Sarah Chen",
    evidence: [
      {
        id: "ev-025",
        fileName: "workplace_photos.zip",
        fileSize: 2500000,
        fileType: "application/zip",
        uploadedAt: new Date("2024-11-20"),
      },
    ],
    priority: "high",
    tags: ["labor", "safety"],
  },
]
