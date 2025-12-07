/*
 * Complaint Submission Form
 *
 * PRODUCTION REQUIREMENTS:
 * - Replace mock submission with real API endpoint
 * - Implement proper file upload to cloud storage (S3, Blob, etc.)
 * - Add real-time form validation with backend
 * - Implement CAPTCHA to prevent spam
 * - Add authentication for non-anonymous complaints
 * - Implement proper error handling and retry logic
 * - Add email/SMS confirmation after submission
 * - Ensure GDPR/privacy compliance
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"

export default function SubmitComplaintPage() {
  const router = useRouter()
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [complaintId, setComplaintId] = useState("")

  if (submitSuccess && complaintId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="border-2 border-accent">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">Complaint Submitted Successfully</CardTitle>
                <CardDescription className="text-base">
                  Your complaint has been received and will be reviewed by our team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Complaint ID</p>
                  <p className="text-2xl font-mono font-bold tracking-wider">{complaintId}</p>
                  <p className="text-xs text-muted-foreground mt-2">Please save this ID to track your complaint</p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You will receive updates via email. You can also track your complaint status anytime using the ID
                    above.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 pt-4">
                  <Button onClick={() => router.push(`/track?id=${complaintId}`)} size="lg">
                    Track This Complaint
                  </Button>
                  <Button onClick={() => router.push("/")} variant="outline">
                    Return to Home
                  </Button>
                  <Button
                    onClick={() => {
                      // Reset to start a new complaint via chat
                      setComplaintId("")
                      setSubmitSuccess(false)
                    }}
                    variant="ghost"
                  >
                    Start New Complaint
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">File a Complaint</h1>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Start a conversation with our AI assistant to describe your situation. The assistant will guide you and
              file a structured complaint on your behalf.
            </p>
          </div>

          <ChatInterface
            onCompleted={(trackingNumber) => {
              setComplaintId(trackingNumber)
              setSubmitSuccess(true)
            }}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
