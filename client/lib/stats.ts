import { ComplaintStatus } from "@prisma/client"
import { db } from "./db"

export interface ComplaintStatsSummary {
  totalComplaints: number
  activeComplaints: number
  resolvedComplaints: number
  averageResolutionTime: number | null
}

export async function getComplaintStatsSummary(): Promise<ComplaintStatsSummary> {
  const [totalComplaints, activeComplaints, resolvedComplaints, resolvedForTimes] =
    await Promise.all([
      db.complaint.count(),
      db.complaint.count({
        where: {
          status: {
            in: [
              ComplaintStatus.submitted,
              ComplaintStatus.under_review,
              ComplaintStatus.investigating,
            ],
          },
        },
      }),
      db.complaint.count({ where: { status: ComplaintStatus.resolved } }),
      db.complaint.findMany({
        where: { status: ComplaintStatus.resolved },
        select: { submittedAt: true, updatedAt: true },
      }),
    ])

  let averageResolutionTime: number | null = null

  if (resolvedForTimes.length > 0) {
    const totalDays = resolvedForTimes.reduce((
      sum: number,
      complaint: { submittedAt: Date; updatedAt: Date },
    ) => {
      const diffMs = complaint.updatedAt.getTime() - complaint.submittedAt.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      return sum + diffDays
    }, 0)

    averageResolutionTime = totalDays / resolvedForTimes.length
  }

  return {
    totalComplaints,
    activeComplaints,
    resolvedComplaints,
    averageResolutionTime,
  }
}
