import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: list all ministries (public endpoint)
export async function GET() {
  try {
    const ministries = await db.ministry.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    })

    return NextResponse.json(ministries)
  } catch (error) {
    console.error("[api/ministries] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch ministries" },
      { status: 500 }
    )
  }
}
