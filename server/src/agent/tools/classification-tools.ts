import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
import { ComplaintClassificationService } from "../../lib/ai/classification-engine";
import { logger } from "../../lib/logger";

export const classificationTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "classify_complaint",
      description: "Classify a complaint into ministry and category. This is the ONLY tool for classification.",
      parameters: {
        type: "object",
        properties: {
          complaintText: {
            type: "string",
            description: "The full complaint description to classify"
          }
        },
        required: ["complaintText"]
      }
    }
  }
];

export async function classifyComplaintHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { complaintText } = args;
    
    if (!complaintText || typeof complaintText !== 'string' || complaintText.trim().length === 0) {
      return {
        success: false,
        error: "Valid complaint text is required for classification",
        message: "Please provide the complaint description to classify"
      };
    }

    // Initialize classification service
    const classificationService = new ComplaintClassificationService(context.prisma);
    
    // Perform classification
    const classification = await classificationService.classifyComplaint(complaintText.trim());
    
    logger.info(
      {
        ministry: classification.ministry,
        category: classification.category,
        confidence: classification.confidence,
        fallbackUsed: classification.fallbackUsed
      },
      'Complaint classified via AI tool'
    );

    return {
      success: true,
      data: {
        ministry: classification.ministry,
        category: classification.category,
        confidence: classification.confidence,
        fallbackUsed: classification.fallbackUsed,
        originalMinistry: classification.originalMinistry,
        originalCategory: classification.originalCategory
      },
      message: `Complaint classified as: ${classification.category} for ${classification.ministry}` +
               (classification.fallbackUsed ? ' (using semantic matching)' : '')
    };
    
  } catch (error: any) {
    logger.error({ error }, 'Classification tool failed');
    return {
      success: false,
      error: error.message,
      message: "Failed to classify complaint. Please try again."
    };
  }
}

export const classificationToolHandlers = {
  classify_complaint: classifyComplaintHandler,
};
