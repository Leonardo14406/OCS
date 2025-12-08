import { NextResponse } from "next/server"
import { getComplaintStatsSummary } from "@/lib/stats"

export async function GET() {
  try {
    const stats = await getComplaintStatsSummary()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching complaint statistics:", error)
    return NextResponse.json({ error: "Failed to fetch complaint statistics" }, { status: 500 })
  }
}
