import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: list all complaint categories (public endpoint)
export async function GET() {
  try {
    const categories = await db.complaintCategory.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("[api/categories] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
