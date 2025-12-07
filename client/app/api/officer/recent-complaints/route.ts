import { NextResponse, type NextRequest } from "next/server"
import { UserRole } from "@prisma/client"
import { getCurrentAccount } from "@/lib/auth"
import { db } from "@/lib/db"

// Return the first 3 most recent complaints assigned to the logged-in officer
export async function GET(req: NextRequest) {
  try {
    const account = await getCurrentAccount()

    if (!account || account.role !== UserRole.officer || !account.isActive) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const complaints = await db.complaint.findMany({
      where: {
        assignedOfficerId: account.id,
      },
      orderBy: { submittedAt: "desc" },
      take: 3,
    })

    return NextResponse.json(complaints)
  } catch (error) {
    console.error("[api/officer/recent-complaints] error", error)
    return NextResponse.json({ error: "Failed to load recent complaints" }, { status: 500 })
  }
}
