import { NextResponse } from "next/server"
import { getCachedLabels } from "@/lib/ai-utils"

// GET: list all ministries and categories (public endpoint)
export async function GET() {
  try {
    const labels = await getCachedLabels()
    return NextResponse.json(labels)
  } catch (error) {
    console.error("[api/ministries-categories] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch ministries and categories" },
      { status: 500 }
    )
  }
}
