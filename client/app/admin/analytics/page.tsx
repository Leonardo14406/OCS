/*
 * ANALYTICS & REPORTS PAGE
 *
 * Real-world replacements needed:
 * 1. Replace exportToCSV/exportToJSON with real file generation
 * 2. Connect to real analytics database for data queries
 * 3. Add date range picker for custom report periods
 * 4. Implement scheduled report generation
 * 5. Add email delivery for generated reports
 * 6. Connect to data warehouse for historical analysis
 */

"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { CorruptionHotspot, SystemMetrics } from "@/lib/types"
import { Download, FileText, BarChart3, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AnalyticsPage() {
  const { toast } = useToast()

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false)
  const [hotspots, setHotspots] = useState<CorruptionHotspot[]>([])
  const [loadingHotspots, setLoadingHotspots] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    const loadMetrics = async () => {
      try {
        setLoadingMetrics(true)
        const res = await fetch("/api/admin/analytics/system-metrics")
        if (!res.ok) {
          throw new Error("Failed to load system metrics")
        }
        const data = (await res.json()) as SystemMetrics
        if (isMounted) {
          setMetrics(data)
        }
      } catch (error) {
        console.error("Error loading system metrics", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load system metrics",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setLoadingMetrics(false)
        }
      }
    }

    loadMetrics()
    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    let isMounted = true
    const loadHotspots = async () => {
      try {
        setLoadingHotspots(true)
        const res = await fetch("/api/admin/analytics/hotspots")
        if (!res.ok) {
          throw new Error("Failed to load hotspots")
        }
        const data = (await res.json()) as CorruptionHotspot[]
        if (isMounted) {
          setHotspots(data)
        }
      } catch (error) {
        console.error("Error loading hotspots", error)
        if (isMounted) {
          // On failure, keep hotspots as empty; UI will render N/A
          toast({
            title: "Error",
            description: "Failed to load AI-detected corruption hotspots",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setLoadingHotspots(false)
        }
      }
    }

    loadHotspots()
    return () => {
      isMounted = false
    }
  }, [toast])

  // TODO: Replace with real CSV/JSON export functionality
  const handleExport = async (format: "csv" | "json", dataType: string) => {
    try {
      const res = await fetch(`/api/admin/analytics/export/${dataType}?format=${format}`)
      if (!res.ok) {
        throw new Error("Failed to generate export")
      }

      const blob = await res.blob()
      const contentDisposition = res.headers.get("Content-Disposition")
      let filename = "export"

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) {
          filename = match[1]
        }
      } else {
        filename = `${dataType}_export.${format}`
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: `${filename} has been downloaded`,
      })
    } catch (error) {
      console.error("Error exporting data", error)
      toast({
        title: "Export Failed",
        description: "Unable to generate export file",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
          <p className="text-muted-foreground">Generate reports and export system data</p>
        </div>

        {/* Export Options */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complaints Report
              </CardTitle>
              <CardDescription>Export all complaint data with full details</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleExport("csv", "complaints")}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleExport("json", "complaints")}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Metrics
              </CardTitle>
              <CardDescription>Export aggregated analytics and statistics</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleExport("csv", "metrics")}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleExport("json", "metrics")}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Officer Performance
              </CardTitle>
              <CardDescription>Export officer data and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleExport("csv", "officers")}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleExport("json", "officers")}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Metrics Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current System Metrics</CardTitle>
            <CardDescription>Real-time overview of system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Complaints</TableCell>
                  <TableCell className="text-right">
                    {loadingMetrics ? "..." : metrics?.totalComplaints ?? 0}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Active Complaints</TableCell>
                  <TableCell className="text-right">
                    {loadingMetrics ? "..." : metrics?.activeComplaints ?? 0}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resolved Complaints</TableCell>
                  <TableCell className="text-right">
                    {loadingMetrics ? "..." : metrics?.resolvedComplaints ?? 0}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Resolution Time</TableCell>
                  <TableCell className="text-right">
                    {loadingMetrics
                      ? "..."
                      : metrics?.averageResolutionTime != null
                        ? `${metrics.averageResolutionTime.toFixed(1)} days`
                        : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resolution Rate</TableCell>
                  <TableCell className="text-right">
                    {metrics && metrics.totalComplaints > 0
                      ? `${Math.round((metrics.resolvedComplaints / metrics.totalComplaints) * 100)}%`
                      : "N/A"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics &&
                    Object.entries(metrics.complaintsByStatus).map(([status, count]) => (
                    <TableRow key={status}>
                      <TableCell className="capitalize">{status.replace("_", " ")}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        {metrics.totalComplaints > 0
                          ? `${Math.round((count / metrics.totalComplaints) * 100)}%`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complaints by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics &&
                    Object.entries(metrics.priorityDistribution).map(([priority, count]) => (
                    <TableRow key={priority}>
                      <TableCell className="capitalize">{priority}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        {metrics.totalComplaints > 0
                          ? `${Math.round((count / metrics.totalComplaints) * 100)}%`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Complaint Trend (by Month) */}
        <Card className="mt-8 mb-8">
          <CardHeader>
            <CardTitle>Complaint Trend</CardTitle>
            <CardDescription>Monthly submitted vs resolved complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics && metrics.monthlyTrend.length > 0 ? (
                  metrics.monthlyTrend.map((entry) => (
                    <TableRow key={entry.month}>
                      <TableCell>{entry.month}</TableCell>
                      <TableCell className="text-right">{entry.submitted}</TableCell>
                      <TableCell className="text-right">{entry.resolved}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {loadingMetrics ? "Loading trend..." : "N/A"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Complaints by Ministry & Category */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Ministry</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ministry</TableHead>
                    <TableHead className="text-right">Complaints</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics && Object.keys(metrics.complaintsByMinistry).length > 0 ? (
                    Object.entries(metrics.complaintsByMinistry).map(([ministry, count]) => (
                      <TableRow key={ministry}>
                        <TableCell>{ministry.replace("Ministry of ", "")}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {loadingMetrics ? "Loading ministries..." : "N/A"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Complaints</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics && Object.keys(metrics.complaintsByCategory).length > 0 ? (
                    Object.entries(metrics.complaintsByCategory).map(([category, count]) => (
                      <TableRow key={category}>
                        <TableCell>{category}</TableCell>
                        <TableCell className="text-right">{count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {loadingMetrics ? "Loading categories..." : "N/A"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Officer Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Officer Performance</CardTitle>
            <CardDescription>Workload and resolution performance by officer</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Avg. Resolution Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics && metrics.officerPerformance.length > 0 ? (
                  metrics.officerPerformance.map((officer) => (
                    <TableRow key={officer.officerId}>
                      <TableCell>{officer.name}</TableCell>
                      <TableCell className="text-right">{officer.assigned}</TableCell>
                      <TableCell className="text-right">{officer.resolved}</TableCell>
                      <TableCell className="text-right">
                        {officer.resolved > 0 && officer.avgResolutionTime > 0
                          ? `${officer.avgResolutionTime.toFixed(1)} days`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {loadingMetrics ? "Loading officer performance..." : "N/A"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* AI Detected Corruption Hotspots */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>AI-Detected Corruption Hotspots</CardTitle>
            <CardDescription>High-risk areas based on complaint patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ministry</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Complaints</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                  <TableHead className="text-right">Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspots.length > 0 ? (
                  hotspots.map((hotspot) => (
                    <TableRow key={hotspot.id}>
                      <TableCell>{hotspot.ministry}</TableCell>
                      <TableCell>{hotspot.region}</TableCell>
                      <TableCell className="text-right">{hotspot.score}</TableCell>
                      <TableCell className="text-right">{hotspot.complaintCount}</TableCell>
                      <TableCell className="text-right">{hotspot.trend}</TableCell>
                      <TableCell className="text-right">{hotspot.riskLevel}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {loadingHotspots ? "Loading hotspots..." : "N/A"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
