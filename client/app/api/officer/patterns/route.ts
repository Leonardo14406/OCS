import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/officer/patterns
 * 
 * Fetch all pattern insights from the database for the officer patterns dashboard.
 */
export async function GET() {
    try {
        const patterns = await db.patternInsight.findMany({
            orderBy: [
                { severity: "desc" },
                { detectedAt: "desc" },
            ],
        })

        // Transform to match the expected client-side PatternInsight type
        const transformed = patterns.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            affectedMinistry: p.affectedMinistry,
            complaintCount: p.complaintCount,
            trend: p.trend,
            severity: p.severity,
            detectedAt: p.detectedAt.toISOString(),
            relatedComplaints: p.relatedComplaints,
            recommendations: p.recommendations,
        }))

        return NextResponse.json(transformed)
    } catch (error) {
        console.error("[api/officer/patterns] error", error)
        return NextResponse.json([], { status: 200 }) // Return empty array on error
    }
}
