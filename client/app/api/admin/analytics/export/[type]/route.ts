import { NextResponse, type NextRequest } from "next/server"
import { UserRole } from "@prisma/client"
import { db } from "@/lib/db"
import { getSystemMetrics } from "@/lib/admin-analytics"

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ""

  const headers = Object.keys(rows[0])
  const escape = (value: any) => {
    if (value == null) return ""
    const str = String(value)
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows = [headers.join(",")]
  for (const row of rows) {
    csvRows.push(headers.map((h) => escape(row[h])).join(","))
  }
  return csvRows.join("\n")
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string }> } | { params: { type: string } },
) {
  const { searchParams } = new URL(req.url)
  const format = (searchParams.get("format") || "csv").toLowerCase()

  // In Next.js App Router, params may be a Promise and must be unwrapped.
  const resolvedParams =
    "then" in context.params ? await (context.params as Promise<{ type: string }>) : context.params
  const type = resolvedParams.type

  if (format !== "csv" && format !== "json") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  }

  try {
    let filenameBase = "export"
    let rows: Record<string, any>[] = []

    if (type === "complaints") {
      filenameBase = "complaints_export"
      const complaints = await db.complaint.findMany({
        orderBy: { submittedAt: "desc" },
      })

      rows = complaints.map((c: {
        id: string
        trackingNumber: string
        complainantName: string
        email: string
        phone: string
        ministry: string
        category: string
        subject: string
        status: string
        priority: string
        submittedAt: Date
        updatedAt: Date
        isAnonymous: boolean
      }) => ({
        id: c.id,
        trackingNumber: c.trackingNumber,
        complainantName: c.complainantName,
        email: c.email,
        phone: c.phone,
        ministry: c.ministry,
        category: c.category,
        subject: c.subject,
        status: c.status,
        priority: c.priority,
        submittedAt: c.submittedAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        isAnonymous: c.isAnonymous,
      }))
    } else if (type === "officers") {
      filenameBase = "officers_export"
      const officers = await db.account.findMany({
        where: { role: UserRole.officer },
        orderBy: { createdAt: "desc" },
      })

      rows = officers.map((o: {
        id: string
        fullName: string
        email: string
        employeeId: string | null
        department: string | null
        assignedComplaints: number | null
        resolvedComplaints: number | null
        isActive: boolean
        createdAt: Date
      }) => ({
        id: o.id,
        fullName: o.fullName,
        email: o.email,
        employeeId: o.employeeId,
        department: o.department,
        assignedComplaints: o.assignedComplaints,
        resolvedComplaints: o.resolvedComplaints,
        isActive: o.isActive,
        createdAt: o.createdAt.toISOString(),
      }))
    } else if (type === "metrics") {
      filenameBase = "system_metrics"
      const metrics = await getSystemMetrics()
      rows = [metrics as unknown as Record<string, any>]
    } else {
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 })
    }

    const extension = format === "csv" ? "csv" : "json"
    const filename = `${filenameBase}.${extension}`

    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    const csv = toCSV(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[api/admin/analytics/export] error", error)
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 })
  }
}
