import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const hotspots = await db.corruptionHotspot.findMany({
      orderBy: { score: "desc" },
    })

    // Ensure we always return an array; caller can interpret empty as "no data".
    const payload = hotspots.map((h) => ({
      id: h.id,
      ministry: h.ministry,
      region: h.region,
      score: h.score,
      complaintCount: h.complaintCount,
      trend: h.trend,
      riskLevel: h.riskLevel,
      lastUpdated: h.lastUpdated.toISOString(),
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error("[api/admin/analytics/hotspots] error", error)
    // On error, return an empty list so the UI can show N/A rather than breaking.
    return NextResponse.json([], { status: 200 })
  }
}
