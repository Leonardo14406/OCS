import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAccount } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const account = await getCurrentAccount()

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      address: account.address,
      city: account.city,
      state: account.state,
      postalCode: account.postalCode,
    })
  } catch (error) {
    console.error("[api/profile] get error", error)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const account = await getCurrentAccount()

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      fullName,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
    } = body as {
      fullName?: string
      email?: string
      phone?: string
      address?: string
      city?: string
      state?: string
      postalCode?: string
    }

    const updateData: Record<string, string | null | undefined> = {}

    if (typeof fullName === "string") updateData.fullName = fullName.trim()
    if (typeof email === "string") updateData.email = email.trim()
    if (typeof phone === "string") updateData.phone = phone.trim()
    if (typeof address === "string") updateData.address = address.trim()
    if (typeof city === "string") updateData.city = city.trim()
    if (typeof state === "string") updateData.state = state.trim()
    if (typeof postalCode === "string") updateData.postalCode = postalCode.trim()

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await db.account.update({
      where: { id: account.id },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      city: updated.city,
      state: updated.state,
      postalCode: updated.postalCode,
    })
  } catch (error) {
    console.error("[api/profile] update error", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
