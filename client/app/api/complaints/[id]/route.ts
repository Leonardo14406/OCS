import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { getCurrentAccount } from "@/lib/auth"

// Authenticated endpoint: allow logged-in users to track a complaint by its
// public complaintId (the Complaint.id field). Citizens can only see their own
// complaints, while officers/admins can see any.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await getCurrentAccount()

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: complaintId } = await params

    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Citizens may only view their own complaints
    if (account.role === UserRole.citizen && complaint.complainantId !== account.id) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    const result = {
      id: complaint.id,
      trackingNumber: complaint.trackingNumber,
      complainantName: complaint.complainantName,
      email: complaint.email,
      phone: complaint.phone,
      isAnonymous: complaint.isAnonymous,
      ministry: complaint.ministry,
      category: complaint.category,
      subject: complaint.subject,
      description: complaint.description,
      incidentDate: complaint.incidentDate,
      status: complaint.status,
      submittedAt: complaint.submittedAt,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/complaints/[id]] error", error)
    return NextResponse.json({ error: "Failed to load complaint" }, { status: 500 })
  }
}
