import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
import OpenAI from "openai";
import { config } from "../../lib/config";

export const classificationTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "classify_complaint",
      description: "Classify a complaint into category and ministry using database lookup and AI analysis",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "The complaint description to classify"
          },
          sessionId: {
            type: "string",
            description: "The session identifier"
          }
        },
        required: ["description", "sessionId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_ministry_info",
      description: "Get information about a specific ministry",
      parameters: {
        type: "object",
        properties: {
          ministryName: {
            type: "string",
            description: "Name of the ministry"
          }
        },
        required: ["ministryName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_category_to_database",
      description: "Add a new complaint category to the database with associated ministry",
      parameters: {
        type: "object",
        properties: {
          categoryName: {
            type: "string",
            description: "Name of the new category"
          },
          categoryDescription: {
            type: "string",
            description: "Description of the new category"
          },
          ministryName: {
            type: "string",
            description: "Name of the ministry this category belongs to"
          }
        },
        required: ["categoryName", "categoryDescription", "ministryName"]
      }
    }
  }
];

export async function classifyComplaintHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { description, sessionId } = args;
    const { prisma } = context;

    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });

    // Step 1: Try to find existing category in database
    const existingCategories = await prisma.complaintCategory.findMany({
      include: {
        ministries: {
          include: {
            ministry: true
          }
        }
      }
    });

    // Step 2: Use AI to classify the complaint
    const classificationPrompt = `
Analyze this complaint and classify it:

COMPLAINT: "${description}"

AVAILABLE CATEGORIES:
${existingCategories.map(cat => 
  `- ${cat.name} (Ministries: ${cat.ministries.map(m => m.ministry.name).join(', ')})`
).join('\n')}

RESPOND WITH JSON ONLY:
{
  "category": "exact category name or "new_category" if not found",
  "ministry": "exact ministry name or "new_ministry" if not found",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggestedNewCategory": "if new_category, suggest a category name",
  "suggestedNewMinistry": "if new_ministry, suggest a ministry name"
}
`;

    const classificationResponse = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: "user", content: classificationPrompt }],
      temperature: 0.3,
    });

    const classificationResult = JSON.parse(classificationResponse.choices[0].message.content || '{}');
    
    let finalCategory = classificationResult.category;
    let finalMinistry = classificationResult.ministry;

    // Step 3: If category doesn't exist, create it
    if (classificationResult.category === "new_category" && classificationResult.suggestedNewCategory) {
      // Find or create the ministry first
      let ministry = await prisma.ministry.findFirst({
        where: { name: classificationResult.suggestedNewMinistry }
      });

      if (!ministry && classificationResult.suggestedNewMinistry) {
        ministry = await prisma.ministry.create({
          data: {
            name: classificationResult.suggestedNewMinistry,
            code: classificationResult.suggestedNewMinistry.toUpperCase().replace(/\s+/g, '_'),
            description: `Ministry responsible for ${classificationResult.suggestedNewMinistry}`
          }
        });
      }

      // Create the new category
      const newCategory = await prisma.complaintCategory.create({
        data: {
          name: classificationResult.suggestedNewCategory,
          description: `Category for ${classificationResult.suggestedNewCategory} complaints`
        }
      });

      // Link category to ministry
      if (ministry) {
        await prisma.complaintCategoryOnMinistry.create({
          data: {
            categoryId: newCategory.id,
            ministryId: ministry.id
          }
        });
      }

      finalCategory = newCategory.name;
      finalMinistry = ministry?.name || classificationResult.suggestedNewMinistry;
    }

    // Step 4: Update session with classification results
    await prisma.conversationSession.update({
      where: { sessionId },
      data: {
        classifiedMinistry: finalMinistry,
        classifiedCategory: finalCategory,
        ministry: finalMinistry,
        category: finalCategory
      }
    });

    return {
      success: true,
      data: {
        category: finalCategory,
        ministry: finalMinistry,
        confidence: classificationResult.confidence,
        reasoning: classificationResult.reasoning,
        isNewCategory: classificationResult.category === "new_category"
      },
      message: `Complaint classified as ${finalCategory} for ${finalMinistry}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to classify complaint"
    };
  }
}

export async function getMinistryInfoHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { ministryName } = args;
    const { prisma } = context;

    // Mock ministry information
    const ministryInfo: { [key: string]: any } = {
      "Ministry of Health and Sanitation": {
        description: "Responsible for healthcare services, hospitals, and public health",
        contact: "health@gov.sl",
        address: "Freetown, Sierra Leone"
      },
      "Ministry of Education": {
        description: "Oversees education system, schools, and educational programs",
        contact: "education@gov.sl",
        address: "Tower Hill, Freetown"
      },
      "Ministry of Works and Infrastructure": {
        description: "Manages public works, roads, and infrastructure development",
        contact: "works@gov.sl",
        address: "Freetown, Sierra Leone"
      },
      "Sierra Leone Police": {
        description: "Law enforcement and public safety",
        contact: "police@gov.sl",
        address: "Police Headquarters, Freetown"
      }
    };

    const info = ministryInfo[ministryName];
    if (!info) {
      return {
        success: false,
        error: "Ministry not found",
        message: "No information available for this ministry"
      };
    }

    return {
      success: true,
      data: {
        name: ministryName,
        ...info
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to get ministry information"
    };
  }
}

export async function addCategoryToDatabaseHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { categoryName, categoryDescription, ministryName } = args;
    const { prisma } = context;

    // Check if category already exists
    const existingCategory = await prisma.complaintCategory.findFirst({
      where: { name: categoryName }
    });

    if (existingCategory) {
      return {
        success: false,
        error: "Category already exists",
        message: `Category '${categoryName}' already exists in the database`
      };
    }

    // Find or create the ministry
    let ministry = await prisma.ministry.findFirst({
      where: { name: ministryName }
    });

    if (!ministry) {
      ministry = await prisma.ministry.create({
        data: {
          name: ministryName,
          code: ministryName.toUpperCase().replace(/\s+/g, '_'),
          description: `Ministry responsible for ${ministryName}`
        }
      });
    }

    // Create the new category
    const newCategory = await prisma.complaintCategory.create({
      data: {
        name: categoryName,
        description: categoryDescription
      }
    });

    // Link category to ministry
    await prisma.complaintCategoryOnMinistry.create({
      data: {
        categoryId: newCategory.id,
        ministryId: ministry.id
      }
    });

    return {
      success: true,
      data: {
        category: newCategory,
        ministry: ministry
      },
      message: `Successfully added category '${categoryName}' to ministry '${ministryName}'`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to add category to database"
    };
  }
}

export const classificationToolHandlers = {
  classify_complaint: classifyComplaintHandler,
  get_ministry_info: getMinistryInfoHandler,
  add_category_to_database: addCategoryToDatabaseHandler,
};
