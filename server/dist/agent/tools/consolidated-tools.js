"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolHandlers = exports.toolDefinitions = void 0;
exports.getOrCreateSessionHandler = getOrCreateSessionHandler;
exports.updateSessionDataHandler = updateSessionDataHandler;
exports.createComplaintHandler = createComplaintHandler;
exports.extractContactInfoHandler = extractContactInfoHandler;
exports.getComplaintStatusHandler = getComplaintStatusHandler;
const client_1 = require("@prisma/client");
// ===== TOOL DEFINITIONS =====
exports.toolDefinitions = [
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
                        enum: Object.values(client_1.ConversationState),
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
                        enum: Object.values(client_1.ComplaintPriority),
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
    }
];
// ===== TOOL HANDLERS =====
async function getOrCreateSessionHandler(args, context) {
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
                    currentState: client_1.ConversationState.greeting
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to get or create session"
        };
    }
}
async function updateSessionDataHandler(args, context) {
    try {
        const { sessionId, data, nextState } = args;
        const { prisma } = context;
        const updateData = {};
        if (data.fullName)
            updateData.fullName = data.fullName;
        if (data.email)
            updateData.email = data.email;
        if (data.phone)
            updateData.phone = data.phone;
        if (data.address)
            updateData.address = data.address;
        if (data.gender)
            updateData.gender = data.gender;
        if (data.ministry)
            updateData.ministry = data.ministry;
        if (data.category)
            updateData.category = data.category;
        if (data.subject)
            updateData.subject = data.subject;
        if (data.description)
            updateData.description = data.description;
        if (data.incidentDate)
            updateData.incidentDate = new Date(data.incidentDate);
        if (nextState)
            updateData.currentState = nextState;
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to update session data"
        };
    }
}
async function createComplaintHandler(args, context) {
    try {
        const { sessionId, priority = client_1.ComplaintPriority.medium, isAnonymous = false } = args;
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
        if (!session.fullName || !session.description || !session.ministry) {
            return {
                success: false,
                error: "Missing required information",
                message: "Please provide full name, description, and ministry before creating complaint"
            };
        }
        const trackingNumber = `OMB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const complaint = await prisma.complaint.create({
            data: {
                trackingNumber,
                complainantName: isAnonymous ? "Anonymous" : session.fullName,
                email: session.email || "",
                phone: session.phone || "",
                address: session.address,
                isAnonymous,
                ministry: session.ministry,
                category: session.category || "Other",
                subject: session.subject || "Complaint",
                description: session.description,
                incidentDate: session.incidentDate,
                priority,
                status: client_1.ComplaintStatus.submitted,
                submittedAt: new Date()
            }
        });
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to create complaint"
        };
    }
}
async function extractContactInfoHandler(args, context) {
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
        const updateData = {
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
        }
        else if (phoneNumber && !email) {
            message = `Phone number saved: ${phoneNumber}. Email is optional - your complaint will still be processed without it.`;
        }
        else if (phoneNumber && email) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to save contact information"
        };
    }
}
async function getComplaintStatusHandler(args, context) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to get complaint status"
        };
    }
}
// ===== TOOL HANDLERS REGISTRY =====
exports.toolHandlers = {
    get_or_create_session: getOrCreateSessionHandler,
    update_session_data: updateSessionDataHandler,
    extract_contact_info: extractContactInfoHandler,
    create_complaint: createComplaintHandler,
    get_complaint_status: getComplaintStatusHandler,
};
//# sourceMappingURL=consolidated-tools.js.map