// Mock API functions for demonstration purposes
// TODO: Replace with real API integration

import type { Complaint } from "./types"
import { getMockComplaintById } from "./mock-data"

// TODO: Replace with real API integration
export async function submitComplaint(
  data: Partial<Complaint>,
): Promise<{ success: boolean; complaintId?: string; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Simulate successful submission
  const complaintId = `CMP-2024-${Math.floor(Math.random() * 9000) + 1000}`

  console.log("Mock complaint submitted:", { ...data, complaintId })

  return {
    success: true,
    complaintId,
  }
}

// TODO: Replace with real API integration
export async function trackComplaint(
  complaintId: string,
): Promise<{ success: boolean; complaint?: Complaint; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const complaint = getMockComplaintById(complaintId)

  if (complaint) {
    return {
      success: true,
      complaint,
    }
  } else {
    return {
      success: false,
      error: "Complaint not found. Please check the ID and try again.",
    }
  }
}

// TODO: Replace with real API integration
export async function getAISuggestions(
  description: string,
): Promise<{ category?: string; ministry?: string; suggestions?: string[] }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock AI responses based on keywords
  const lowerDesc = description.toLowerCase()

  let category = ""
  let ministry = ""
  const suggestions: string[] = []

  if (lowerDesc.includes("delay") || lowerDesc.includes("wait")) {
    category = "Service Delay"
    suggestions.push("Include specific dates and timeline of events")
    suggestions.push("Mention any reference numbers or case IDs you have")
  }

  if (lowerDesc.includes("corrupt") || lowerDesc.includes("bribe")) {
    category = "Corruption"
    suggestions.push("Provide as much evidence as possible")
    suggestions.push("Consider filing anonymously for your protection")
  }

  if (lowerDesc.includes("health") || lowerDesc.includes("hospital") || lowerDesc.includes("doctor")) {
    ministry = "Ministry of Health"
  }

  if (lowerDesc.includes("school") || lowerDesc.includes("teacher") || lowerDesc.includes("education")) {
    ministry = "Ministry of Education"
  }

  if (lowerDesc.includes("road") || lowerDesc.includes("transport") || lowerDesc.includes("traffic")) {
    ministry = "Ministry of Transport"
  }

  suggestions.push("Be specific about dates, locations, and people involved")
  suggestions.push("Attach relevant documents or photos if available")

  return {
    category: category || undefined,
    ministry: ministry || undefined,
    suggestions,
  }
}
