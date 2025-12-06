// Mock API functions for Admin interface
// TODO: Replace all mock functions with real API calls

import type { Officer, Ministry, ComplaintCategory, Complaint } from "./types"
import { MOCK_OFFICERS, MOCK_MINISTRIES, MOCK_CATEGORIES, EXTENDED_MOCK_COMPLAINTS } from "./mock-data"

// TODO: Replace with real API integration
export async function createOfficer(officer: Omit<Officer, "id" | "joinedAt">): Promise<Officer> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const newOfficer: Officer = {
    ...officer,
    id: `off-${Date.now()}`,
    joinedAt: new Date(),
  }

  console.log("[Mock API] Created officer:", newOfficer)
  return newOfficer
}

// TODO: Replace with real API integration
export async function updateOfficer(id: string, updates: Partial<Officer>): Promise<Officer> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const officer = MOCK_OFFICERS.find((o) => o.id === id)
  if (!officer) throw new Error("Officer not found")

  const updated = { ...officer, ...updates }
  console.log("[Mock API] Updated officer:", updated)
  return updated
}

// TODO: Replace with real API integration
export async function deleteOfficer(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log("[Mock API] Deleted officer:", id)
}

// TODO: Replace with real API integration
export async function reassignComplaint(complaintId: string, officerId: string): Promise<Complaint> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const complaint = EXTENDED_MOCK_COMPLAINTS.find((c) => c.id === complaintId)
  if (!complaint) throw new Error("Complaint not found")

  const officer = MOCK_OFFICERS.find((o) => o.id === officerId)

  const updated = {
    ...complaint,
    assignedOfficer: officer?.fullName || "Unassigned",
    updatedAt: new Date(),
  }

  console.log("[Mock API] Reassigned complaint:", complaintId, "to officer:", officerId)
  return updated
}

// TODO: Replace with real API integration
export async function createMinistry(ministry: Omit<Ministry, "id">): Promise<Ministry> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const newMinistry: Ministry = {
    ...ministry,
    id: `ministry-${Date.now()}`,
  }

  console.log("[Mock API] Created ministry:", newMinistry)
  return newMinistry
}

// TODO: Replace with real API integration
export async function updateMinistry(id: string, updates: Partial<Ministry>): Promise<Ministry> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const ministry = MOCK_MINISTRIES.find((m) => m.id === id)
  if (!ministry) throw new Error("Ministry not found")

  const updated = { ...ministry, ...updates }
  console.log("[Mock API] Updated ministry:", updated)
  return updated
}

// TODO: Replace with real API integration
export async function deleteMinistry(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log("[Mock API] Deleted ministry:", id)
}

// TODO: Replace with real API integration
export async function createCategory(category: Omit<ComplaintCategory, "id">): Promise<ComplaintCategory> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const newCategory: ComplaintCategory = {
    ...category,
    id: `category-${Date.now()}`,
  }

  console.log("[Mock API] Created category:", newCategory)
  return newCategory
}

// TODO: Replace with real API integration
export async function updateCategory(id: string, updates: Partial<ComplaintCategory>): Promise<ComplaintCategory> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const category = MOCK_CATEGORIES.find((c) => c.id === id)
  if (!category) throw new Error("Category not found")

  const updated = { ...category, ...updates }
  console.log("[Mock API] Updated category:", updated)
  return updated
}

// TODO: Replace with real API integration
export async function deleteCategory(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log("[Mock API] Deleted category:", id)
}
