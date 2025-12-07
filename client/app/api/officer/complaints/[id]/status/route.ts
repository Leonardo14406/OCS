import { NextResponse, type NextRequest } from "next/server"
import { ComplaintStatus, UserRole } from "@prisma/client"
import { getCurrentAccount } from "@/lib/auth"
import { db } from "@/lib/db"

// Update complaint status for a complaint assigned to the current officer and
// append a status history entry.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await getCurrentAccount()

    if (!account || account.role !== UserRole.officer || !account.isActive) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const complaintId = params.id
    const body = await req.json().catch(() => ({}))
    const { status, note } = body as { status?: ComplaintStatus | string; note?: string }

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "New status is required" }, { status: 400 })
    }

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json({ error: "Status note is required" }, { status: 400 })
    }

    // Ensure status is a valid ComplaintStatus value
    const allowedStatuses = Object.values(ComplaintStatus) as string[]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const complaint = await db.complaint.findFirst({
      where: {
        id: complaintId,
        assignedOfficerId: account.id,
      },
      select: { id: true },
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    const updatedComplaint = await db.complaint.update({
      where: { id: complaint.id },
      data: {
        status: status as ComplaintStatus,
      },
      include: {
        statusHistory: {
          orderBy: { timestamp: "asc" },
        },
      },
    })

    const historyEntry = await db.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        status: status as ComplaintStatus,
        note: note.trim(),
        updatedBy: account.fullName ?? "Officer",
      },
    })

    return NextResponse.json(
      {
        complaint: updatedComplaint,
        historyEntry,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[api/officer/complaints/[id]/status] POST error", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
