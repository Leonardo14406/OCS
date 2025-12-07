import { NextResponse, type NextRequest } from "next/server"
import { UserRole } from "@prisma/client"
import { getCurrentAccount } from "@/lib/auth"
import { db } from "@/lib/db"

// Get a single complaint for the currently logged-in officer by internal
// complaint ID. Ensures the complaint is assigned to this officer.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await getCurrentAccount()

    if (!account || account.role !== UserRole.officer || !account.isActive) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const complaintId = params.id

    const complaint = await db.complaint.findFirst({
      where: {
        id: complaintId,
        assignedOfficerId: account.id,
      },
      include: {
        evidence: true,
        statusHistory: {
          orderBy: { timestamp: "asc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    return NextResponse.json(complaint)
  } catch (error) {
    console.error("[api/officer/complaints/[id]] error", error)
    return NextResponse.json({ error: "Failed to load complaint" }, { status: 500 })
  }
}
