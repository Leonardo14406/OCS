import { NextResponse, type NextRequest } from "next/server"
import { randomUUID } from "crypto"
import { ComplaintPriority, ComplaintStatus, UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { getCurrentAccount } from "@/lib/auth"

// Create a new complaint and auto-assign it to an officer based on ministry.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      complainantName,
      email,
      phone,
      address,
      isAnonymous,
      ministry,
      category,
      subject,
      description,
      incidentDate,
      priority,
      attachments,
    } = body as {
      complainantName?: string
      email?: string
      phone?: string
      address?: string
      isAnonymous?: boolean
      ministry?: string
      category?: string
      subject?: string
      description?: string
      incidentDate?: string | null
      priority?: "low" | "medium" | "high" | "urgent"
      attachments?:
        | {
            url?: string | null
            fileName?: string | null
            fileSize?: number | null
            fileType?: string | null
          }[]
        | null
    }

    const anon = !!isAnonymous

    if (!ministry || !category || !subject || !description) {
      return NextResponse.json({ error: "Missing required complaint fields" }, { status: 400 })
    }

    if (!anon && (!complainantName || !email)) {
      return NextResponse.json({ error: "Name and email are required for non-anonymous complaints" }, { status: 400 })
    }

    const now = new Date()

    // Generate a human-friendly complaint ID / tracking number like CMP-YYYY-XXX
    const year = now.getFullYear()
    const prefix = `CMP-${year}-`
    const countForYear = await db.complaint.count({
      where: {
        id: {
          startsWith: prefix,
        },
      },
    })
    const complaintId = `${prefix}${String(countForYear + 1).padStart(3, "0")}`

    // Generate a private, unguessable tracking number for citizens to use
    // when tracking their complaint without authentication.
    const trackingNumber = randomUUID()

    // If a logged-in, non-anonymous user submits the complaint, attach it to
    // their Account so it shows up in their profile history.
    let complainantAccountId: string | null = null
    if (!anon) {
      try {
        const account = await getCurrentAccount()
        if (account) {
          complainantAccountId = account.id
        }
      } catch {
        // If auth lookup fails, we still accept the complaint as email-only.
      }
    }

    // Auto-assign to an officer in the same ministry (department) with the
    // lowest number of assignedComplaints to keep distribution even.
    const officers = await db.account.findMany({
      where: {
        role: UserRole.officer,
        isActive: true,
        department: ministry,
      },
      select: {
        id: true,
        assignedComplaints: true,
      },
    })

    let assignedOfficerId: string | null = null

    if (officers.length > 0) {
      const sorted = [...officers].sort((a, b) => {
        const aCount = a.assignedComplaints ?? 0
        const bCount = b.assignedComplaints ?? 0
        return aCount - bCount
      })

      assignedOfficerId = sorted[0].id
    }

    const prismaPriority: ComplaintPriority =
      priority === "low" || priority === "high" || priority === "urgent" ? priority : ComplaintPriority.medium

    const complaint = await db.complaint.create({
      data: {
        id: complaintId,
        trackingNumber,
        complainantName: anon ? "Anonymous" : complainantName || "Anonymous",
        email: anon ? "anonymous@system.gov" : email || "anonymous@system.gov",
        phone: anon ? "N/A" : phone || "N/A",
        address: anon ? null : address ?? null,
        isAnonymous: anon,
        ministry,
        category,
        subject,
        description,
        incidentDate: incidentDate ? new Date(incidentDate) : null,
        status: ComplaintStatus.submitted,
        priority: prismaPriority,
        submittedAt: now,
        complainantId: complainantAccountId ?? undefined,
        assignedOfficerId: assignedOfficerId ?? undefined,
        tags: [],
      },
    })

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const maxSize = 10 * 1024 * 1024
      const evidenceData = attachments
        .filter(
          (a) =>
            a &&
            typeof a.fileName === "string" &&
            typeof a.fileSize === "number" &&
            a.fileSize > 0 &&
            a.fileSize <= maxSize &&
            typeof a.fileType === "string",
        )
        .map((a) => ({
          fileName: a.fileName as string,
          fileSize: a.fileSize as number,
          fileType: a.fileType as string,
          url: (a.url as string | null) ?? null,
          complaintId: complaint.id,
        }))

      if (evidenceData.length > 0) {
        await db.evidenceItem.createMany({
          data: evidenceData,
        })
      }
    }

    if (assignedOfficerId) {
      await db.account.update({
        where: { id: assignedOfficerId },
        data: {
          assignedComplaints: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json({ id: complaint.id, trackingNumber: complaint.trackingNumber }, { status: 201 })
  } catch (error) {
    console.error("[api/complaints] error", error)
    return NextResponse.json({ error: "Failed to submit complaint" }, { status: 500 })
  }
}
