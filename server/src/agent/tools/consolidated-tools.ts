import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ConversationState, Gender, ComplaintStatus, ComplaintPriority } from "@prisma/client";
import { ToolContext, ToolResult } from "./types";
import { classificationTools, classificationToolHandlers } from "./classification-tools";

// ===== TOOL DEFINITIONS =====

export const toolDefinitions: ChatCompletionTool[] = [
  // Session tools
  {
    type: "function",
    function: {
      name: "get_or_create_session",
      description: "Get or create a conversation session for tracking user progress",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "The unique session identifier" },
          userId: { type: "string", description: "User identifier (phone number or email)" }
        },
        required: ["sessionId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_session_data",
      description: "Update collected data in the current session",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "The session identifier" },
          data: {
            type: "object",
            properties: {
              fullName: { type: "string", description: "Complainant's full name" },
              email: { type: "string", description: "Complainant's email address" },
              phone: { type: "string", description: "Complainant's phone number" },
              address: { type: "string", description: "Complainant's address" },
              gender: { type: "string", enum: ["male", "female", "other", "prefer_not_to_say"], description: "Complainant's gender" },
              ministry: { type: "string", description: "Ministry or department involved" },
              category: { type: "string", description: "Complaint category" },
              subject: { type: "string", description: "Complaint subject/title" },
              description: { type: "string", description: "Detailed complaint description" },
              incidentDate: { type: "string", description: "Date of incident (ISO format)" }
            }
          },
          nextState: {
            type: "string",
            enum: Object.values(ConversationState),
            description: "Next conversation state"
          }
        },
        required: ["sessionId", "data"]
      }
    }
  },
  // Complaint tools
  {
    type: "function",
    function: {
      name: "extract_contact_info",
      description: "Extract and save contact information (phone number and optional email) from the user's message",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "The session identifier" },
          phoneNumber: { type: "string", description: "The user's phone number (extracted from message or context)" },
          email: { type: "string", description: "The user's email address (optional)" },
          preferNoContact: { type: "boolean", description: "Whether the user prefers not to provide contact information" }
        },
        required: ["sessionId", "phoneNumber"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_complaint",
      description: "Create a new complaint with collected session data",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "The session identifier" },
          priority: {
            type: "string",
            enum: Object.values(ComplaintPriority),
            description: "Complaint priority level"
          },
          isAnonymous: { type: "boolean", description: "Whether the complaint is anonymous" }
        },
        required: ["sessionId"]
      }
    }
  },
  // Tracking tools
  {
    type: "function",
    function: {
      name: "get_complaint_status",
      description: "Get the current status of a specific complaint",
      parameters: {
        type: "object",
        properties: {
          trackingNumber: {
            type: "string",
            description: "The complaint tracking number (e.g., OMB-2024-12345)"
          }
        },
        required: ["trackingNumber"]
      }
    }
  },
  // Classification tools
  ...classificationTools
];

// ===== TOOL HANDLERS =====

export async function getOrCreateSessionHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { sessionId, userId } = args;
    const { prisma } = context;

    let session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      session = await prisma.conversationSession.create({
        data: {
          sessionId,
          userId: userId || null,
          currentState: ConversationState.greeting
        }
      });
    }

    return {
      success: true,
      data: {
        sessionId: session.sessionId,
        currentState: session.currentState,
        userId: session.userId
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to get or create session"
    };
  }
}

export async function updateSessionDataHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { sessionId, data, nextState } = args;
    const { prisma } = context;

    const updateData: any = {};
    
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.address) updateData.address = data.address;
    if (data.gender) updateData.gender = data.gender as Gender;
    if (data.ministry) updateData.ministry = data.ministry;
    if (data.category) updateData.category = data.category;
    if (data.subject) updateData.subject = data.subject;
    if (data.description) updateData.description = data.description;
    if (data.incidentDate) updateData.incidentDate = new Date(data.incidentDate);
    
    if (nextState) updateData.currentState = nextState as ConversationState;
    updateData.messageCount = { increment: 1 };
    updateData.lastMessageAt = new Date();

    const session = await prisma.conversationSession.update({
      where: { sessionId },
      data: updateData
    });

    return {
      success: true,
      data: {
        sessionId: session.sessionId,
        currentState: session.currentState,
        updatedFields: Object.keys(updateData)
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to update session data"
    };
  }
}

export async function createComplaintHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { sessionId, priority = ComplaintPriority.medium, isAnonymous = false } = args;
    const { prisma } = context;

    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return {
        success: false,
        error: "Session not found",
        message: "Cannot create complaint without session data"
      };
    }

    if (!session.description) {
      return {
        success: false,
        error: "Missing complaint description",
        message: "Please provide a description of your complaint before submitting. The system will automatically classify it and assign the appropriate ministry."
      };
    }

    // Auto-classify the complaint using the classification service
    const { ComplaintClassificationService } = await import('../../lib/ai/classification-engine');
    const classificationService = new ComplaintClassificationService(prisma);
    
    const classification = await classificationService.classifyComplaint(session.description);
    
    // Use classification results or fallback to session data
    const finalMinistry = classification.ministry || session.ministry || 'Ministry of Health and Sanitation';
    const finalCategory = classification.category || session.category || 'service_delivery';

    const trackingNumber = `OMB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const complaint = await prisma.complaint.create({
      data: {
        trackingNumber,
        complainantName: isAnonymous ? "Anonymous" : (session.fullName || "Anonymous"),
        email: session.email || "",
        phone: session.phone || "",
        address: session.address,
        isAnonymous,
        ministry: finalMinistry,
        category: finalCategory,
        subject: session.subject || "Complaint",
        description: session.description,
        incidentDate: session.incidentDate,
        priority,
        status: ComplaintStatus.submitted,
        submittedAt: new Date()
      }
    });

    // Update session with classification results and complaint ID
    await prisma.conversationSession.update({
      where: { sessionId },
      data: {
        complaintId: complaint.id,
        currentState: "completed",
        classifiedMinistry: finalMinistry,
        classifiedCategory: finalCategory,
        ministry: finalMinistry,
        category: finalCategory
      }
    });

    // Log the classification with complaint
    const logger = (await import('../../lib/logger')).logger;
    logger.info(
      {
        complaintId: complaint.id,
        trackingNumber: complaint.trackingNumber,
        ministry: finalMinistry,
        category: finalCategory,
        confidence: classification.confidence,
        fallbackUsed: classification.fallbackUsed
      },
      'Complaint created with automatic classification'
    );

    return {
      success: true,
      data: {
        trackingNumber: complaint.trackingNumber,
        status: complaint.status,
        priority: complaint.priority,
        submittedAt: complaint.submittedAt,
        ministry: finalMinistry,
        category: finalCategory,
        classification: {
          confidence: classification.confidence,
          fallbackUsed: classification.fallbackUsed
        }
      },
      message: `Complaint created successfully with tracking number: ${trackingNumber}. ` +
               `Automatically classified as ${finalCategory} for ${finalMinistry}.` +
               (classification.fallbackUsed ? ' (Used semantic matching for classification)' : '')
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to create complaint"
    };
  }
}

export async function extractContactInfoHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { sessionId, phoneNumber, email, preferNoContact = false } = args;
    const { prisma } = context;

    // Get session data
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return {
        success: false,
        error: "Session not found",
        message: "Cannot save contact information without session data"
      };
    }

    // Update session with contact information
    const updateData: any = {
      phone: phoneNumber || session.phone,
      email: email || session.email,
      preferNoContact
    };

    // If user prefers no contact, clear existing contact info
    if (preferNoContact) {
      updateData.phone = "";
      updateData.email = "";
    }

    await prisma.conversationSession.update({
      where: { sessionId },
      data: updateData
    });

    let message = "Contact information saved successfully.";
    if (preferNoContact) {
      message = "I understand you prefer not to provide contact information. Your complaint will still be processed and you can check its status using the tracking number.";
    } else if (phoneNumber && !email) {
      message = `Phone number saved: ${phoneNumber}. Email is optional - your complaint will still be processed without it.`;
    } else if (phoneNumber && email) {
      message = `Contact information saved: Phone ${phoneNumber}, Email ${email}`;
    }

    return {
      success: true,
      data: {
        phoneNumber: updateData.phone,
        email: updateData.email,
        preferNoContact
      },
      message
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to save contact information"
    };
  }
}

export async function getComplaintStatusHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { trackingNumber } = args;
    const { prisma } = context;

    const complaint = await prisma.complaint.findUnique({
      where: { trackingNumber },
      include: {
        evidence: true,
        statusHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    if (!complaint) {
      return {
        success: false,
        error: "Complaint not found",
        message: "No complaint found with this tracking number"
      };
    }

    return {
      success: true,
      data: {
        trackingNumber: complaint.trackingNumber,
        status: complaint.status,
        priority: complaint.priority,
        subject: complaint.subject,
        ministry: complaint.ministry,
        category: complaint.category,
        submittedAt: complaint.submittedAt,
        updatedAt: complaint.updatedAt,
        evidenceCount: complaint.evidence.length,
        recentStatusHistory: complaint.statusHistory
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to get complaint status"
    };
  }
}

// ===== TOOL HANDLERS REGISTRY =====

export const toolHandlers = {
  get_or_create_session: getOrCreateSessionHandler,
  update_session_data: updateSessionDataHandler,
  extract_contact_info: extractContactInfoHandler,
  create_complaint: createComplaintHandler,
  get_complaint_status: getComplaintStatusHandler,
  ...classificationToolHandlers,
};
