/*
 * Landing Page for Ombudsman Complaint System
 *
 * PRODUCTION REQUIREMENTS:
 * - Replace mock statistics with real data from analytics API
 * - Add proper authentication and session management
 * - Implement real-time complaint statistics
 * - Add accessibility features and WCAG compliance testing
 * - Connect to actual backend API endpoints
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, Search, Shield, Clock, CheckCircle, Users, ArrowRight } from "lucide-react"
import { getComplaintStatsSummary } from "@/lib/stats"

export default async function HomePage() {
  const stats = await getComplaintStatsSummary().catch(() => null)

  const totalComplaints = stats?.totalComplaints ?? 0
  const resolvedComplaints = stats?.resolvedComplaints ?? 0
  const averageResolutionTime = stats?.averageResolutionTime

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
                Your Voice for Government Accountability
              </h1>
              <p className="text-lg text-muted-foreground text-pretty leading-relaxed md:text-xl">
                The Office of the Ombudsman provides an independent, impartial channel for citizens to report complaints
                against public officials and government services.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-4">
                <Button asChild size="lg" className="text-base">
                  <Link href="/submit">
                    <FileText className="mr-2 h-5 w-5" />
                    File a Complaint
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
                  <Link href="/track">
                    <Search className="mr-2 h-5 w-5" />
                    Track Status
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalComplaints.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time complaints received</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Cases</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{resolvedComplaints.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalComplaints > 0
                      ? `${Math.round((resolvedComplaints / totalComplaints) * 100)}% resolution rate`
                      : "Resolution rate will appear when complaints are received"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {typeof averageResolutionTime === "number"
                      ? `${averageResolutionTime.toFixed(1)} days`
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Based on resolved complaints</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl mb-4">How We Serve You</h2>
              <p className="text-muted-foreground text-pretty leading-relaxed">
                Our commitment is to ensure transparency, fairness, and accountability in government services.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Independent Investigation</CardTitle>
                  <CardDescription>
                    Our office operates independently, free from political influence, ensuring unbiased investigation of
                    all complaints.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Confidential & Anonymous</CardTitle>
                  <CardDescription>
                    File complaints anonymously if needed. We protect whistleblowers and ensure your identity remains
                    confidential.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Timely Resolution</CardTitle>
                  <CardDescription>
                    Track your complaint in real-time. We're committed to resolving cases efficiently while maintaining
                    thoroughness.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Free Service</CardTitle>
                  <CardDescription>
                    No fees or charges. Filing a complaint is completely free for all citizens.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Legal Authority</CardTitle>
                  <CardDescription>
                    Our recommendations carry legal weight, ensuring government agencies take appropriate action.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Full Transparency</CardTitle>
                  <CardDescription>
                    Access detailed status updates and investigation findings throughout the entire process.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="border-2">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl text-balance">Ready to File a Complaint?</CardTitle>
                <CardDescription className="text-base text-pretty leading-relaxed mt-2">
                  Your complaint will be handled with care, confidentiality, and commitment to justice.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="/submit">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/track">Track Existing Complaint</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
