import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAccount } from "@/lib/auth"

// Authenticated endpoint: fetch complaints filed by the current citizen for
// display on the profile page.
export async function GET(req: NextRequest) {
  try {
    const account = await getCurrentAccount()

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const complaints = await db.complaint.findMany({
      where: {
        complainantId: account.id,
      },
      orderBy: {
        submittedAt: "desc",
      },
    })

    const result = complaints.map((c) => ({
      id: c.id,
      subject: c.subject,
      description: c.description,
      category: c.category,
      status: c.status,
      submittedAt: c.submittedAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/profile/complaints] error", error)
    return NextResponse.json({ error: "Failed to load complaints" }, { status: 500 })
  }
}
