import { NextResponse, type NextRequest } from "next/server"
import { UserRole } from "@prisma/client"
import { getCurrentAccount } from "@/lib/auth"
import { db } from "@/lib/db"

// Create and list investigation notes for a complaint assigned to the current officer

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
      select: { id: true },
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    const notes = await db.investigationNote.findMany({
      where: { complaintId: complaint.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("[api/officer/complaints/[id]/notes] GET error", error)
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await getCurrentAccount()

    if (!account || account.role !== UserRole.officer || !account.isActive) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const complaintId = params.id
    const body = await req.json().catch(() => ({}))
    const { note, isInternal = true } = body as { note?: string; isInternal?: boolean }

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 })
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

    const newNote = await db.investigationNote.create({
      data: {
        complaintId: complaint.id,
        officerId: account.id,
        officerName: account.fullName ?? "Officer",
        note: note.trim(),
        isInternal,
        attachments: [],
      },
    })

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error("[api/officer/complaints/[id]/notes] POST error", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
