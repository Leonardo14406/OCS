import { cache } from "react"
import { db } from "@/lib/db"

// Types for AI analysis
export interface AIAnalysisResult {
  category: string
  ministry: string
  suggestions: string[]
  improvedDescription: string
}

export interface MinistryLabels {
  id: string
  name: string
  code: string
  description: string
}

export interface CategoryLabels {
  id: string
  name: string
  description: string
}

export interface CachedLabels {
  ministries: MinistryLabels[]
  categories: CategoryLabels[]
  ministryNames: string[]
  categoryNames: string[]
}

// Server-side cached function to get ministries and categories
export const getCachedLabels = cache(async (): Promise<CachedLabels> => {
  console.log("[getCachedLabels] Fetching from database...")
  
  const [ministries, categories] = await Promise.all([
    db.ministry.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    }),
    db.complaintCategory.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })
  ])

  const ministryNames = ministries.map(m => m.name)
  const categoryNames = categories.map(c => c.name)

  return {
    ministries,
    categories,
    ministryNames,
    categoryNames,
  }
})

// Client-side function to fetch labels via API
export async function fetchLabelsFromAPI(): Promise<CachedLabels> {
  const response = await fetch("/api/ministries-categories")
  if (!response.ok) {
    throw new Error("Failed to fetch labels")
  }
  return response.json()
}

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 5

// Rate limiting function
export function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: userLimit.resetTime }
  }

  // Increment count
  userLimit.count++
  return { allowed: true }
}

// Helper to truncate text for UI
export function truncateText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

// Validate AI analysis response
export function validateAIAnalysis(analysis: any, categoryNames: string[], ministryNames: string[]): analysis is AIAnalysisResult {
  return (
    analysis &&
    typeof analysis.category === "string" &&
    typeof analysis.ministry === "string" &&
    Array.isArray(analysis.suggestions) &&
    analysis.suggestions.every((s: any) => typeof s === "string") &&
    typeof analysis.improvedDescription === "string" &&
    categoryNames.includes(analysis.category) &&
    ministryNames.includes(analysis.ministry)
  )
}

// Clean up old rate limit entries (call this periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(userId)
    }
  }
}
