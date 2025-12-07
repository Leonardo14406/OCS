import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    const response = await fetch(`${backendUrl}/api/agent/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Pass through the backend response (including websocketUrl) unchanged
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/agent/session] error", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
