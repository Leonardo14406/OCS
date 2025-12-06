import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getCurrentAccount } from "@/lib/auth"
import { db } from "@/lib/db"
import { jsonrepair } from "jsonrepair"
import { 
  getCachedLabels, 
  checkRateLimit, 
  truncateText, 
  validateAIAnalysis, 
  type AIAnalysisResult,
  cleanupRateLimitStore
} from "@/lib/ai-utils"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


export async function POST(req: Request) {
  try {
    // Clean up old rate limit entries periodically
    cleanupRateLimitStore()

    // Check if user is authenticated
    const account = await getCurrentAccount()
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkRateLimit(account.id)
    if (!rateLimit.allowed) {
      const resetTime = Math.ceil((rateLimit.resetTime! - Date.now()) / 1000 / 60)
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.", 
          resetInMinutes: resetTime 
        },
        { status: 429 }
      )
    }

    const { description } = await req.json()

    if (!description || description.length < 20) {
      return NextResponse.json(
        { error: "Description must be at least 20 characters long" },
        { status: 400 }
      )
    }

    // Get cached ministry and category data
    const { ministryNames, categoryNames } = await getCachedLabels()

    // Create the prompt for OpenAI
    const systemPrompt = `You are an expert government complaint analyst. Analyze the complaint description and provide structured suggestions.

Available categories: ${categoryNames.join(", ")}
Available ministries: ${ministryNames.join(", ")}

You must respond with a JSON object containing:
1. "category": The most appropriate category from the available list
2. "ministry": The most relevant ministry from the available list  
3. "suggestions": An array of 2-3 specific suggestions to improve the complaint clarity, each under 100 characters
4. "improvedDescription": A clearer, more professional version of the complaint (keep it concise but detailed, under 500 characters)

Example response:
{
  "category": "Service Delay",
  "ministry": "Ministry of Health",
  "suggestions": [
    "Add specific dates and times",
    "Include names of staff involved",
    "Describe the impact on you"
  ],
  "improvedDescription": "On June 15, 2024, at approximately 2:30 PM, I experienced poor service quality at the downtown health clinic..."
}

Analyze this complaint and provide your recommendations in valid JSON format only.`

    try {
      // Use the chat.completions.create() API for OpenAI SDK v6.x
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }, // Enforce JSON response
      })

      const responseText = completion.choices[0]?.message?.content
      if (!responseText) {
        throw new Error("No response from OpenAI")
      }

      // Repair JSON before parsing
      let repairedJson: string
      try {
        repairedJson = jsonrepair(responseText)
      } catch (repairError) {
        console.error("JSON repair failed:", repairError)
        repairedJson = responseText // Fall back to original if repair fails
      }

      // Parse the repaired JSON response
      let analysis: AIAnalysisResult
      try {
        analysis = JSON.parse(repairedJson)
      } catch (parseError) {
        console.error("Failed to parse OpenAI response after repair:", repairedJson)
        throw new Error("Invalid response from AI service")
      }

      // Validate the response structure and content
      if (!validateAIAnalysis(analysis, categoryNames, ministryNames)) {
        console.error("Invalid AI analysis structure:", analysis)
        throw new Error("AI service returned invalid analysis format")
      }

      // Truncate improved description if too long
      const truncatedDescription = truncateText(analysis.improvedDescription || description)

      // Log AI suggestions for auditing
      try {
        await db.aILog.create({
          data: {
            userId: account.id,
            originalDescription: description,
            suggestedCategory: analysis.category,
            suggestedMinistry: analysis.ministry,
            suggestions: analysis.suggestions,
            improvedDescription: truncatedDescription,
            createdAt: new Date(),
          },
        })
      } catch (logError) {
        console.error("Failed to log AI suggestions:", logError)
        // Continue without failing the request
      }

      return NextResponse.json({
        category: analysis.category,
        ministry: analysis.ministry,
        suggestions: analysis.suggestions.slice(0, 3), // Limit to 3 suggestions
        improvedDescription: truncatedDescription,
      })

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)
      throw openaiError // Re-throw to be handled by outer catch block
    }

  } catch (error) {
    console.error("[/api/ai/analyze-complaint] error:", error)
    
    if (error instanceof Error) {
      // Handle rate limit errors
      if (error.message.includes("Rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      }
      // Handle OpenAI API errors
      if (error.message.includes("quota") || error.message.includes("insufficient_quota")) {
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again later." },
          { status: 503 }
        )
      }
      if (error.message.includes("Invalid") || error.message.includes("parse")) {
        return NextResponse.json(
          { error: "AI service returned invalid response. Please try again." },
          { status: 500 }
        )
      }
      // Handle OpenAI specific errors
      if (error.message.includes("OpenAI")) {
        return NextResponse.json(
          { error: "AI service error. Please try again." },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to analyze complaint. Please try again." },
      { status: 500 }
    )
  }
}
