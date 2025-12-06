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

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AIAssistant } from "@/components/ai-assistant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { UploadButton } from "@/lib/uploadthing"
import { getCachedLabels, fetchLabelsFromAPI, type MinistryLabels, type CategoryLabels } from "@/lib/ai-utils"

export default function SubmitComplaintPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [complaintId, setComplaintId] = useState("")
  const [error, setError] = useState("")
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [ministries, setMinistries] = useState<MinistryLabels[]>([])
  const [categories, setCategories] = useState<CategoryLabels[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Form state
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    ministry: "",
    category: "",
    subject: "",
    description: "",
    incidentDate: "",
  })

  const [files, setFiles] = useState<File[]>([])

  const [attachments, setAttachments] = useState<
    { url: string; fileName: string; fileSize: number; fileType: string }[]
  >([])

  useEffect(() => {
    if (isAnonymous || hasLoadedProfile) return

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile")
        if (!res.ok) return
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        }))
        setHasLoadedProfile(true)
        setIsLoggedIn(true)
      } catch {
        setIsLoggedIn(false)
      }
    }

    loadProfile()
  }, [isAnonymous, hasLoadedProfile])

  useEffect(() => {
    const loadMinistriesAndCategories = async () => {
      setIsLoadingData(true)
      try {
        const { ministries, categories } = await fetchLabelsFromAPI()
        setMinistries(ministries)
        setCategories(categories)
      } catch (error) {
        console.error("Failed to load ministries and categories:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadMinistriesAndCategories()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
    setError("")
  }

  const handleUploadComplete = (res: any[]) => {
    console.log("Upload complete:", res)
    if (res && res.length > 0) {
      const uploadedFiles = res.map((item) => ({
        url: item.url,
        fileName: item.name,
        fileSize: item.size,
        fileType: item.type,
        uploadedBy: item.uploadedBy,
      }))
      setAttachments(uploadedFiles)
    }
  }

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error)
    setError(`Upload failed: ${error.message}`)
  }

  const handleAISuggestion = (field: "category" | "ministry" | "description", value: string) => {
    if (field === "description") {
      setFormData((prev) => ({ ...prev, description: value }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!isAnonymous && (!formData.fullName || !formData.email)) {
      setError("Please provide your name and email, or file anonymously")
      return
    }

    if (!formData.ministry || !formData.category || !formData.subject || !formData.description) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.description.length < 50) {
      setError("Please provide a more detailed description (at least 50 characters)")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complainantName: isAnonymous ? "Anonymous" : formData.fullName,
          email: isAnonymous ? "anonymous@system.gov" : formData.email,
          phone: isAnonymous ? "N/A" : formData.phone,
          address: isAnonymous ? undefined : formData.address,
          isAnonymous,
          ministry: formData.ministry,
          category: formData.category,
          subject: formData.subject,
          description: formData.description,
          incidentDate: formData.incidentDate || null,
          priority: "medium",
          attachments: attachments.length ? attachments : undefined,
        }),
      })

      setIsSubmitting(false)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit complaint. Please try again.")
      }

      const data = await res.json()

      if (!data.id) {
        throw new Error("Invalid response from server")
      }

      setComplaintId(data.id)
      setSubmitSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to submit complaint. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
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
                    You will receive updates via email{!isAnonymous && " at " + formData.email}. You can also track your
                    complaint status anytime using the ID above.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 pt-4">
                  <Button onClick={() => router.push(`/track?id=${complaintId}`)} size="lg">
                    Track This Complaint
                  </Button>
                  <Button onClick={() => router.push("/")} variant="outline">
                    Return to Home
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
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">File a Complaint</h1>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Submit your complaint against a public official or government service. All submissions are treated
              confidentially.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Details</CardTitle>
                  <CardDescription>
                    Provide as much detail as possible to help us investigate your complaint effectively.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Anonymous Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="anonymous" className="text-base">
                          File Anonymously
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Your identity will be protected and not shared with anyone
                        </p>
                      </div>
                      <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    </div>

                    {/* Personal Information - Hidden if Anonymous */}
                    {!isAnonymous && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Personal Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) => handleInputChange("fullName", e.target.value)}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              placeholder="john@example.com"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              placeholder="123 Main St, City"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Complaint Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Complaint Information</h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ministry">Ministry/Department *</Label>
                          <Select
                            value={formData.ministry}
                            onValueChange={(value) => handleInputChange("ministry", value)}
                            disabled={isLoadingData}
                          >
                            <SelectTrigger id="ministry">
                              <SelectValue placeholder={isLoadingData ? "Loading..." : "Select ministry"} />
                            </SelectTrigger>
                            <SelectContent>
                              {ministries.map((ministry) => (
                                <SelectItem key={`${ministry.id}-${ministry.name}`} value={ministry.name}>
                                  {ministry.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Complaint Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => handleInputChange("category", value)}
                            disabled={isLoadingData}
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder={isLoadingData ? "Loading..." : "Select category"} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={`${category.id}-${category.name}`} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="incidentDate">Incident Date</Label>
                        <Input
                          id="incidentDate"
                          type="date"
                          value={formData.incidentDate}
                          onChange={(e) => handleInputChange("incidentDate", e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => handleInputChange("subject", e.target.value)}
                          placeholder="Brief summary of your complaint"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Detailed Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Provide a detailed description of your complaint. Include specific dates, names, locations, and any other relevant information..."
                          rows={8}
                          required
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.description.length} characters (minimum 50 required)
                        </p>
                      </div>

                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label htmlFor="evidence">Supporting Documents</Label>
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={handleUploadComplete}
                          onUploadError={handleUploadError}
                          appearance={{
                            button:
                              "ut-ready:bg-primary ut-ready:text-primary-foreground ut-ready:border-primary ut-uploading:bg-primary/80 ut-uploading:text-primary-foreground ut-uploading:border-primary/80",
                            container:
                              "w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center",
                            allowedContent:
                              "text-sm text-muted-foreground",
                          }}
                        />
                        {attachments.length > 0 && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>
                                  {attachment.fileName} ({(attachment.fileSize / 1024).toFixed(1)} KB)
                                </span>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Images (max 4MB, 4 files), PDFs (max 8MB, 2 files), Documents (max 16MB, 3 files)
                        </p>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Complaint"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* AI Assistant Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <AIAssistant 
                  description={formData.description} 
                  onSuggestionApply={handleAISuggestion} 
                  isLoggedIn={isLoggedIn && !isAnonymous}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
