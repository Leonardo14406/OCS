import { NextResponse } from "next/server"
import { getSystemMetrics } from "@/lib/admin-analytics"

export async function GET() {
  const metrics = await getSystemMetrics()
  return NextResponse.json(metrics)
}
