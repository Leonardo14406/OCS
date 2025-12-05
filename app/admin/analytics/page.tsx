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

import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_SYSTEM_METRICS, exportToCSV, exportToJSON } from "@/lib/mock-admin-data"
import { EXTENDED_MOCK_COMPLAINTS, MOCK_OFFICERS } from "@/lib/mock-data"
import { Download, FileText, BarChart3, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AnalyticsPage() {
  const { toast } = useToast()

  // TODO: Replace with real CSV/JSON export functionality
  const handleExport = (format: "csv" | "json", dataType: string) => {
    let data: any[] = []
    let filename = ""

    switch (dataType) {
      case "complaints":
        data = EXTENDED_MOCK_COMPLAINTS
        filename = "complaints_export"
        break
      case "officers":
        data = MOCK_OFFICERS
        filename = "officers_export"
        break
      case "metrics":
        data = [MOCK_SYSTEM_METRICS]
        filename = "system_metrics"
        break
      default:
        return
    }

    const exportedFile = format === "csv" ? exportToCSV(data, filename) : exportToJSON(data, filename)

    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} file: ${exportedFile}`,
    })

    // In real implementation, trigger actual file download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${exportedFile} is ready for download`,
      })
    }, 1500)
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
                  <TableCell className="text-right">{MOCK_SYSTEM_METRICS.totalComplaints}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Active Complaints</TableCell>
                  <TableCell className="text-right">{MOCK_SYSTEM_METRICS.activeComplaints}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resolved Complaints</TableCell>
                  <TableCell className="text-right">{MOCK_SYSTEM_METRICS.resolvedComplaints}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Resolution Time</TableCell>
                  <TableCell className="text-right">{MOCK_SYSTEM_METRICS.averageResolutionTime} days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resolution Rate</TableCell>
                  <TableCell className="text-right">
                    {Math.round((MOCK_SYSTEM_METRICS.resolvedComplaints / MOCK_SYSTEM_METRICS.totalComplaints) * 100)}%
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
                  {Object.entries(MOCK_SYSTEM_METRICS.complaintsByStatus).map(([status, count]) => (
                    <TableRow key={status}>
                      <TableCell className="capitalize">{status.replace("_", " ")}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        {Math.round((count / MOCK_SYSTEM_METRICS.totalComplaints) * 100)}%
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
                  {Object.entries(MOCK_SYSTEM_METRICS.priorityDistribution).map(([priority, count]) => (
                    <TableRow key={priority}>
                      <TableCell className="capitalize">{priority}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        {Math.round((count / MOCK_SYSTEM_METRICS.totalComplaints) * 100)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
