// Mock data for Admin/Supervisor interface
// TODO: Replace with real database or API integration

import type { Admin, SystemMetrics, CorruptionHotspot } from "./types"

// TODO: Replace with real authentication and database
export const MOCK_ADMIN: Admin = {
  id: "admin-001",
  fullName: "Alexandra Martinez",
  email: "alexandra.martinez@ombudsman.gov",
  employeeId: "EMP-2017-005",
  role: "super_admin",
  department: "Administration",
  permissions: [
    "manage_users",
    "view_analytics",
    "manage_complaints",
    "manage_settings",
    "export_data",
    "manage_ministries",
  ],
  joinedAt: new Date("2017-05-20"),
}

// TODO: Connect to real analytics database
export const MOCK_SYSTEM_METRICS: SystemMetrics = {
  totalComplaints: 1247,
  activeComplaints: 342,
  resolvedComplaints: 831,
  averageResolutionTime: 18.5,
  complaintsByStatus: {
    submitted: 89,
    under_review: 124,
    investigating: 129,
    resolved: 831,
    closed: 64,
    rejected: 10,
  },
  complaintsByMinistry: {
    "Ministry of Health": 287,
    "Ministry of Education": 198,
    "Ministry of Transport": 156,
    "Ministry of Finance": 234,
    "Ministry of Justice": 87,
    "Ministry of Environment": 92,
    "Ministry of Labor": 143,
    "Ministry of Housing": 50,
  },
  complaintsByCategory: {
    "Service Delay": 412,
    Misconduct: 178,
    Corruption: 89,
    Discrimination: 67,
    "Poor Quality Service": 234,
    "Lack of Transparency": 156,
    "Policy Violation": 78,
    "Financial Irregularity": 33,
  },
  monthlyTrend: [
    { month: "May", submitted: 98, resolved: 87 },
    { month: "Jun", submitted: 112, resolved: 95 },
    { month: "Jul", submitted: 124, resolved: 108 },
    { month: "Aug", submitted: 135, resolved: 118 },
    { month: "Sep", submitted: 142, resolved: 125 },
    { month: "Oct", submitted: 156, resolved: 138 },
    { month: "Nov", submitted: 168, resolved: 142 },
  ],
  officerPerformance: [
    {
      officerId: "off-001",
      name: "Maria Santos",
      assigned: 12,
      resolved: 87,
      avgResolutionTime: 15.2,
    },
    {
      officerId: "off-002",
      name: "James Wilson",
      assigned: 8,
      resolved: 54,
      avgResolutionTime: 19.8,
    },
    {
      officerId: "off-003",
      name: "Sarah Chen",
      assigned: 5,
      resolved: 124,
      avgResolutionTime: 12.4,
    },
    {
      officerId: "off-004",
      name: "Robert Kumar",
      assigned: 15,
      resolved: 67,
      avgResolutionTime: 21.3,
    },
    {
      officerId: "off-005",
      name: "Jennifer Lee",
      assigned: 9,
      resolved: 92,
      avgResolutionTime: 16.7,
    },
  ],
  priorityDistribution: {
    low: 234,
    medium: 512,
    high: 387,
    urgent: 114,
  },
}

// TODO: Connect to AI-powered corruption detection system
export const MOCK_CORRUPTION_HOTSPOTS: CorruptionHotspot[] = [
  {
    id: "hotspot-001",
    ministry: "Ministry of Finance",
    region: "Central Region",
    score: 87,
    complaintCount: 23,
    trend: "increasing",
    riskLevel: "critical",
    lastUpdated: new Date("2024-11-28"),
  },
  {
    id: "hotspot-002",
    ministry: "Ministry of Health",
    region: "Northern District",
    score: 74,
    complaintCount: 17,
    trend: "stable",
    riskLevel: "high",
    lastUpdated: new Date("2024-11-27"),
  },
  {
    id: "hotspot-003",
    ministry: "Ministry of Transport",
    region: "Eastern Province",
    score: 68,
    complaintCount: 14,
    trend: "decreasing",
    riskLevel: "high",
    lastUpdated: new Date("2024-11-26"),
  },
  {
    id: "hotspot-004",
    ministry: "Ministry of Education",
    region: "Southern Region",
    score: 52,
    complaintCount: 9,
    trend: "stable",
    riskLevel: "medium",
    lastUpdated: new Date("2024-11-25"),
  },
  {
    id: "hotspot-005",
    ministry: "Ministry of Labor",
    region: "Western District",
    score: 45,
    complaintCount: 7,
    trend: "decreasing",
    riskLevel: "medium",
    lastUpdated: new Date("2024-11-24"),
  },
]

// TODO: Replace with real database queries
export function generateMockChartData() {
  return {
    complaintTrend: MOCK_SYSTEM_METRICS.monthlyTrend,
    statusDistribution: Object.entries(MOCK_SYSTEM_METRICS.complaintsByStatus).map(([status, count]) => ({
      status,
      count,
    })),
    ministryDistribution: Object.entries(MOCK_SYSTEM_METRICS.complaintsByMinistry)
      .map(([ministry, count]) => ({
        ministry: ministry.replace("Ministry of ", ""),
        count,
      }))
      .sort((a, b) => b.count - a.count),
    categoryDistribution: Object.entries(MOCK_SYSTEM_METRICS.complaintsByCategory)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count),
  }
}

// TODO: Replace with real CSV/JSON export functionality
export function exportToCSV(data: any[], filename: string) {
  console.log(`[Mock Export] Exporting ${data.length} records to ${filename}.csv`)
  // In real implementation, generate CSV and trigger download
  return `${filename}.csv`
}

// TODO: Replace with real CSV/JSON export functionality
export function exportToJSON(data: any[], filename: string) {
  console.log(`[Mock Export] Exporting ${data.length} records to ${filename}.json`)
  // In real implementation, generate JSON and trigger download
  return `${filename}.json`
}
