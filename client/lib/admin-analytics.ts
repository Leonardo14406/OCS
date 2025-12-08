import { ComplaintPriority, ComplaintStatus, UserRole } from "@prisma/client"
import { db } from "./db"
import type { SystemMetrics } from "./types"

function formatMonthLabel(date: Date): string {
  return date.toLocaleString("default", { month: "short" })
}

function createEmptySystemMetrics(): SystemMetrics {
  return {
    totalComplaints: 0,
    activeComplaints: 0,
    resolvedComplaints: 0,
    averageResolutionTime: 0,
    complaintsByStatus: {
      submitted: 0,
      under_review: 0,
      investigating: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
    },
    complaintsByMinistry: {},
    complaintsByCategory: {},
    monthlyTrend: [],
    officerPerformance: [],
    priorityDistribution: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
  }
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const [summary, statusGroups, priorityGroups, ministryGroups, categoryGroups, recentComplaints, officers] =
    await Promise.all([
      // High-level summary numbers
      (async () => {
        const [totalComplaints, activeComplaints, resolvedComplaints, resolvedForTimes] = await Promise.all([
          db.complaint.count(),
          db.complaint.count({
            where: {
              status: {
                in: [ComplaintStatus.submitted, ComplaintStatus.under_review, ComplaintStatus.investigating],
              },
            },
          }),
          db.complaint.count({ where: { status: ComplaintStatus.resolved } }),
          db.complaint.findMany({
            where: { status: ComplaintStatus.resolved },
            select: { submittedAt: true, updatedAt: true },
          }),
        ])

        let averageResolutionTime = 0
        if (resolvedForTimes.length > 0) {
          const totalDays = resolvedForTimes.reduce((sum: number, complaint: { submittedAt: Date; updatedAt: Date }) => {
            const diffMs = complaint.updatedAt.getTime() - complaint.submittedAt.getTime()
            const diffDays = diffMs / (1000 * 60 * 60 * 24)
            return sum + diffDays
          }, 0)
          averageResolutionTime = totalDays / resolvedForTimes.length
        }

        return { totalComplaints, activeComplaints, resolvedComplaints, averageResolutionTime }
      })(),
      db.complaint.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.complaint.groupBy({
        by: ["priority"],
        _count: { _all: true },
      }),
      db.complaint.groupBy({
        by: ["ministry"],
        _count: { _all: true },
      }),
      db.complaint.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
      db.complaint.findMany({
        where: { submittedAt: { gte: sixMonthsAgo } },
        select: { submittedAt: true, status: true },
        orderBy: { submittedAt: "asc" },
      }),
      db.account.findMany({
        where: { role: UserRole.officer },
        select: {
          id: true,
          fullName: true,
          assignedComplaints: true,
          resolvedComplaints: true,
        },
      }),
    ])

  const complaintsByStatus: SystemMetrics["complaintsByStatus"] = {
    submitted: 0,
    under_review: 0,
    investigating: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
  }

  for (const group of statusGroups as { status: ComplaintStatus; _count: { _all: number } }[]) {
    complaintsByStatus[group.status] = group._count._all
  }

  const priorityDistribution: SystemMetrics["priorityDistribution"] = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  }

  for (const group of priorityGroups as { priority: ComplaintPriority; _count: { _all: number } }[]) {
    priorityDistribution[group.priority] = group._count._all
  }

  const complaintsByMinistry: SystemMetrics["complaintsByMinistry"] = {}
  for (const group of ministryGroups as { ministry: string; _count: { _all: number } }[]) {
    complaintsByMinistry[group.ministry] = group._count._all
  }

  const complaintsByCategory: SystemMetrics["complaintsByCategory"] = {}
  for (const group of categoryGroups as { category: string; _count: { _all: number } }[]) {
    complaintsByCategory[group.category] = group._count._all
  }

  // Bucket submissions and resolutions by calendar month (last ~6 months)
  const monthlyMap = new Map<string, { monthLabel: string; submitted: number; resolved: number }>()

  for (const item of recentComplaints) {
    const submittedAt = new Date(item.submittedAt)
    const key = `${submittedAt.getFullYear()}-${submittedAt.getMonth()}`
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        monthLabel: formatMonthLabel(submittedAt),
        submitted: 0,
        resolved: 0,
      })
    }
    const entry = monthlyMap.get(key)!
    entry.submitted += 1
    if (item.status === ComplaintStatus.resolved) {
      entry.resolved += 1
    }
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([aYearMonth], [bYearMonth]) => {
      return aYearMonth.localeCompare(bYearMonth)
    })
    .map(([_, value]) => ({
      month: value.monthLabel,
      submitted: value.submitted,
      resolved: value.resolved,
    }))

  const officerPerformance: SystemMetrics["officerPerformance"] = officers.map((o: {
    id: string
    fullName: string
    assignedComplaints: number | null
    resolvedComplaints: number | null
  }) => {
    const resolved = o.resolvedComplaints ?? 0
    const assigned = o.assignedComplaints ?? 0
    const avgResolutionTime = resolved > 0 ? summary.averageResolutionTime : 0
    return {
      officerId: o.id,
      name: o.fullName,
      assigned,
      resolved,
      avgResolutionTime,
    }
  })

  return {
    totalComplaints: summary.totalComplaints,
    activeComplaints: summary.activeComplaints,
    resolvedComplaints: summary.resolvedComplaints,
    averageResolutionTime: summary.averageResolutionTime,
    complaintsByStatus,
    complaintsByMinistry,
    complaintsByCategory,
    monthlyTrend,
    officerPerformance,
    priorityDistribution,
  }
  } catch (error) {
    console.error("[getSystemMetrics] error", error)
    // Fallback to a fully-initialized metrics object so callers never see a thrown error.
    return createEmptySystemMetrics()
  }
}
