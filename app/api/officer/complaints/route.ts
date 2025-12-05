import { NextResponse, type NextRequest } from "next/server"
import { ComplaintPriority, ComplaintStatus, UserRole } from "@prisma/client"
import { getCurrentAccount } from "@/lib/auth"
import { db } from "@/lib/db"

// List complaints for the currently logged-in officer. Complaints are
// scoped to those assigned to this officer, with optional status/priority
// filters.
export async function GET(req: NextRequest) {
  try {
    const account = await getCurrentAccount()

    if (!account || account.role !== UserRole.officer || !account.isActive) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get("status") || "all").toLowerCase()
    const priority = (searchParams.get("priority") || "all").toLowerCase()

    const where: any = {
      assignedOfficerId: account.id,
    }

    if (status !== "all") {
      where.status = status as ComplaintStatus
    }

    if (priority !== "all") {
      where.priority = priority as ComplaintPriority
    }

    const complaints = await db.complaint.findMany({
      where,
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json(complaints)
  } catch (error) {
    console.error("[api/officer/complaints] error", error)
    return NextResponse.json({ error: "Failed to load complaints" }, { status: 500 })
  }
}
