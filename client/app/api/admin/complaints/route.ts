import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/admin/complaints
 * 
 * Fetch all complaints for the admin oversight page with optional filtering.
 * Supports query params: status, priority, search, limit, offset
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)

        const status = searchParams.get("status")
        const priority = searchParams.get("priority")
        const search = searchParams.get("search")
        const limit = parseInt(searchParams.get("limit") || "100", 10)
        const offset = parseInt(searchParams.get("offset") || "0", 10)

        // Build the where clause dynamically
        const where: Record<string, unknown> = {}

        if (status && status !== "all") {
            where.status = status
        }

        if (priority && priority !== "all") {
            where.priority = priority
        }

        if (search) {
            where.OR = [
                { id: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
                { complainantName: { contains: search, mode: "insensitive" } },
                { trackingNumber: { contains: search, mode: "insensitive" } },
            ]
        }

        const [complaints, total] = await Promise.all([
            db.complaint.findMany({
                where,
                orderBy: { submittedAt: "desc" },
                take: limit,
                skip: offset,
                include: {
                    assignedOfficer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    evidence: {
                        select: {
                            id: true,
                            fileName: true,
                            fileSize: true,
                            fileType: true,
                            uploadedAt: true,
                        },
                    },
                    statusHistory: {
                        orderBy: { timestamp: "desc" },
                        take: 5,
                    },
                },
            }),
            db.complaint.count({ where }),
        ])

        // Transform to match the expected client-side Complaint type
        const transformed = complaints.map((c: any) => ({
            id: c.id,
            trackingNumber: c.trackingNumber,
            complainantName: c.complainantName,
            email: c.email,
            phone: c.phone,
            address: c.address,
            isAnonymous: c.isAnonymous,
            ministry: c.ministry,
            category: c.category,
            subject: c.subject,
            description: c.description,
            incidentDate: c.incidentDate?.toISOString() ?? null,
            status: c.status,
            priority: c.priority,
            submittedAt: c.submittedAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            assignedOfficer: c.assignedOfficer?.fullName ?? null,
            assignedOfficerId: c.assignedOfficerId,
            tags: c.tags,
            evidence: c.evidence.map((e: any) => ({
                id: e.id,
                fileName: e.fileName,
                fileSize: e.fileSize,
                fileType: e.fileType,
                uploadedAt: e.uploadedAt.toISOString(),
            })),
            statusHistory: c.statusHistory.map((sh: any) => ({
                status: sh.status,
                timestamp: sh.timestamp.toISOString(),
                note: sh.note,
                updatedBy: sh.updatedBy,
            })),
        }))

        return NextResponse.json({
            complaints: transformed,
            total,
            limit,
            offset,
        })
    } catch (error) {
        console.error("[api/admin/complaints] error", error)
        return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 })
    }
}
