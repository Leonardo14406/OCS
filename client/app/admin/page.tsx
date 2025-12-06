/*
 * ADMIN DASHBOARD PAGE
 *
 * Real-world replacements needed:
 * 1. Replace MOCK_SYSTEM_METRICS with real-time analytics API
 * 2. Replace MOCK_CORRUPTION_HOTSPOTS with AI-powered detection system
 * 3. Add real authentication and role-based access control
 * 4. Connect charts to live database queries
 * 5. Implement real-time data updates via WebSocket or polling
 * 6. Add proper error handling and loading states
 */

"use client"

import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCK_SYSTEM_METRICS, MOCK_CORRUPTION_HOTSPOTS, generateMockChartData } from "@/lib/mock-admin-data"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

// TODO: Connect to real analytics database
const chartData = generateMockChartData()

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
  muted: "hsl(var(--muted))",
}

const STATUS_COLORS: Record<string, string> = {
  submitted: COLORS.muted,
  under_review: "#3b82f6",
  investigating: "#f59e0b",
  resolved: COLORS.success,
  closed: "#6b7280",
  rejected: COLORS.danger,
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview, analytics, and AI-detected patterns</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_SYSTEM_METRICS.totalComplaints}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{MOCK_SYSTEM_METRICS.activeComplaints}</div>
              <p className="text-xs text-muted-foreground">Currently investigating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{MOCK_SYSTEM_METRICS.resolvedComplaints}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((MOCK_SYSTEM_METRICS.resolvedComplaints / MOCK_SYSTEM_METRICS.totalComplaints) * 100)}%
                resolution rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_SYSTEM_METRICS.averageResolutionTime} days</div>
              <p className="text-xs text-green-600">12% improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Complaint Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Trend</CardTitle>
              <CardDescription>Monthly submissions vs resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  submitted: { label: "Submitted", color: COLORS.primary },
                  resolved: { label: "Resolved", color: COLORS.success },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.complaintTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="submitted" stroke="var(--color-submitted)" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolved" stroke="var(--color-resolved)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current complaint statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Count", color: COLORS.primary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS.primary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Ministry Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Ministry</CardTitle>
              <CardDescription>Top ministries by complaint volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Complaints", color: COLORS.primary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.ministryDistribution.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="ministry" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
              <CardDescription>Most common complaint types</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Count", color: COLORS.primary },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.categoryDistribution.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Corruption Hotspots */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              AI-Detected Corruption Hotspots
            </CardTitle>
            <CardDescription>
              Machine learning analysis identifying high-risk areas requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_CORRUPTION_HOTSPOTS.map((hotspot) => (
                <div
                  key={hotspot.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{hotspot.ministry}</h4>
                      <Badge
                        variant={
                          hotspot.riskLevel === "critical"
                            ? "destructive"
                            : hotspot.riskLevel === "high"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {hotspot.riskLevel}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {hotspot.trend === "increasing" ? (
                          <TrendingUp className="h-3 w-3 text-red-600" />
                        ) : hotspot.trend === "decreasing" ? (
                          <TrendingDown className="h-3 w-3 text-green-600" />
                        ) : null}
                        {hotspot.trend}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{hotspot.region}</p>
                    <p className="text-sm">
                      {hotspot.complaintCount} complaints • Risk Score: {hotspot.score}/100
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{hotspot.score}</div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Officer Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Officer Performance</CardTitle>
            <CardDescription>Top performing investigators by resolution metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_SYSTEM_METRICS.officerPerformance.map((officer) => (
                <div key={officer.officerId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{officer.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {officer.resolved} resolved • {officer.assigned} active
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{officer.avgResolutionTime} days</div>
                    <div className="text-xs text-muted-foreground">Avg. time</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
