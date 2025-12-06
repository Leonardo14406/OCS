import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"

// Public endpoint: allow unauthenticated users to track a complaint using the
// private trackingNumber. Returns basic complaint details only.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const trackingNumber = searchParams.get("trackingNumber")

    if (!trackingNumber) {
      return NextResponse.json({ error: "trackingNumber is required" }, { status: 400 })
    }

    const complaint = await db.complaint.findUnique({
      where: { trackingNumber },
    })

    if (!complaint) {
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
    console.error("[public/complaints/track] error", error)
    return NextResponse.json({ error: "Failed to track complaint" }, { status: 500 })
  }
}
