/*
 * AI PATTERN DETECTION DASHBOARD - OFFICER PORTAL
 *
 * Connected to real API endpoint:
 * - GET /api/officer/patterns for fetching pattern insights
 */

"use client"

import { useState, useEffect } from "react"
import { OfficerHeader } from "@/components/officer-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { PatternInsight } from "@/lib/types"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Building2, FileText, Sparkles, Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default function PatternDetectionDashboard() {
  const [patterns, setPatterns] = useState<PatternInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadPatterns = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/officer/patterns", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch patterns")
        const data = (await res.json()) as PatternInsight[]
        if (!cancelled) {
          // Convert date strings back to Date objects
          const patternsWithDates = data.map((p) => ({
            ...p,
            detectedAt: new Date(p.detectedAt),
          }))
          setPatterns(patternsWithDates)
        }
      } catch (error) {
        console.error("Error loading patterns:", error)
        if (!cancelled) setPatterns([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadPatterns()

    return () => {
      cancelled = true
    }
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      default:
        return <Minus className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    }
  }

  const criticalPatterns = patterns.filter((p) => p.severity === "critical" || p.severity === "high")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <OfficerHeader />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading pattern insights...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <OfficerHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">AI Pattern Detection</h1>
          <p className="text-muted-foreground">
            Automated analysis of complaint trends and systemic issues across government ministries
          </p>
        </div>

        {/* Critical Alerts */}
        {criticalPatterns.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              {criticalPatterns.length} Critical Pattern{criticalPatterns.length > 1 ? "s" : ""} Detected
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Immediate attention required for high-severity systemic issues. Review the patterns below and take
              recommended actions.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Patterns</p>
                  <p className="mt-2 text-3xl font-bold">{patterns.length}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Affected Ministries</p>
                  <p className="mt-2 text-3xl font-bold">{new Set(patterns.map((p) => p.affectedMinistry)).size}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Related Complaints</p>
                  <p className="mt-2 text-3xl font-bold">{patterns.reduce((sum, p) => sum + p.complaintCount, 0)}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patterns List */}
        {patterns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No Pattern Insights Available</h3>
              <p className="text-center text-sm text-muted-foreground">
                AI-detected patterns will appear here as the system analyzes complaint data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <Card
                key={pattern.id}
                className={pattern.severity === "critical" || pattern.severity === "high" ? "border-orange-200" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className={getSeverityColor(pattern.severity)} variant="secondary">
                          {pattern.severity}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(pattern.trend)}
                          <span className="text-xs font-medium capitalize">{pattern.trend}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {pattern.complaintCount} complaints
                        </Badge>
                      </div>
                      <CardTitle className="text-balance">{pattern.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Detected on {format(pattern.detectedAt, "MMMM d, yyyy")} • {pattern.affectedMinistry}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="leading-relaxed text-pretty">{pattern.description}</p>

                  <div>
                    <h4 className="mb-2 font-semibold">Recommended Actions:</h4>
                    <ul className="ml-4 space-y-1 text-sm">
                      {pattern.recommendations.map((rec, idx) => (
                        <li key={idx} className="list-disc leading-relaxed">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pattern.relatedComplaints.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold">Related Complaints:</h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.relatedComplaints.map((id) => (
                          <Button key={id} asChild variant="outline" size="sm">
                            <Link href={`/officer/complaint/${id}`}>{id}</Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
