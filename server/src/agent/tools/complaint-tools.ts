import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ComplaintStatus, ComplaintPriority } from "@prisma/client";
import { ToolContext, ToolResult } from "./types";

export const complaintTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "extract_contact_info",
      description: "Extract and save contact information (phone number and optional email) from the user's message",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "The session identifier"
          },
          phoneNumber: {
            type: "string",
            description: "The user's phone number (extracted from message or context)"
          },
          email: {
            type: "string",
            description: "The user's email address (optional)"
          },
          preferNoContact: {
            type: "boolean",
            description: "Whether the user prefers not to provide contact information"
          }
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
          sessionId: {
            type: "string",
            description: "The session identifier"
          },
          priority: {
            type: "string",
            enum: Object.values(ComplaintPriority),
            description: "Complaint priority level"
          },
          isAnonymous: {
            type: "boolean",
            description: "Whether the complaint is anonymous"
          }
        },
        required: ["sessionId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_complaint_details",
      description: "Update details of an existing complaint",
      parameters: {
        type: "object",
        properties: {
          trackingNumber: {
            type: "string",
            description: "The complaint tracking number"
          },
          updates: {
            type: "object",
            properties: {
              ministry: { type: "string", description: "Ministry or department" },
              category: { type: "string", description: "Complaint category" },
              subject: { type: "string", description: "Complaint subject" },
              description: { type: "string", description: "Complaint description" },
              priority: { type: "string", enum: Object.values(ComplaintPriority) }
            }
          }
        },
        required: ["trackingNumber", "updates"]
      }
    }
  }
];

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

export async function createComplaintHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { sessionId, priority = ComplaintPriority.medium, isAnonymous = false } = args;
    const { prisma } = context;

    // Get session data
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

    // Validate required fields - only description and ministry are required
    if (!session.description || !session.ministry) {
      return {
        success: false,
        error: "Missing required information",
        message: "Please provide a description of your complaint and the ministry/department involved before submitting."
      };
    }

    // Generate unique tracking number
    const trackingNumber = `OMB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        trackingNumber,
        complainantName: isAnonymous ? "Anonymous" : (session.fullName || "Anonymous"),
        email: session.preferNoContact ? "" : (session.email || ""),
        phone: session.preferNoContact ? "" : (session.phone || ""),
        address: session.address,
        isAnonymous: isAnonymous || !session.fullName || session.preferNoContact,
        ministry: session.ministry,
        category: session.category || "Other",
        subject: session.subject || "Complaint",
        description: session.description,
        incidentDate: session.incidentDate,
        priority,
        status: ComplaintStatus.submitted,
        submittedAt: new Date()
      }
    });

    // Update session with complaint ID
    await prisma.conversationSession.update({
      where: { sessionId },
      data: {
        complaintId: complaint.id,
        currentState: "completed"
      }
    });

    return {
      success: true,
      data: {
        trackingNumber: complaint.trackingNumber,
        status: complaint.status,
        priority: complaint.priority,
        submittedAt: complaint.submittedAt
      },
      message: `Complaint created successfully with tracking number: ${trackingNumber}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to create complaint"
    };
  }
}

export async function updateComplaintDetailsHandler(args: any, context: ToolContext): Promise<ToolResult> {
  try {
    const { trackingNumber, updates } = args;
    const { prisma } = context;

    const complaint = await prisma.complaint.findUnique({
      where: { trackingNumber }
    });

    if (!complaint) {
      return {
        success: false,
        error: "Complaint not found",
        message: "No complaint found with this tracking number"
      };
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    // Map updates to database fields
    if (updates.ministry) updateData.ministry = updates.ministry;
    if (updates.category) updateData.category = updates.category;
    if (updates.subject) updateData.subject = updates.subject;
    if (updates.description) updateData.description = updates.description;
    if (updates.priority) updateData.priority = updates.priority;

    const updatedComplaint = await prisma.complaint.update({
      where: { trackingNumber },
      data: updateData
    });

    return {
      success: true,
      data: {
        trackingNumber: updatedComplaint.trackingNumber,
        updatedFields: Object.keys(updates),
        updatedAt: updatedComplaint.updatedAt
      },
      message: "Complaint details updated successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: "Failed to update complaint details"
    };
  }
}

export const complaintToolHandlers = {
  extract_contact_info: extractContactInfoHandler,
  create_complaint: createComplaintHandler,
  update_complaint_details: updateComplaintDetailsHandler,
};
