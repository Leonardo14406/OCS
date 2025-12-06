"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionToolHandlers = exports.getSessionOrCreateTool = void 0;
exports.getOrCreateSessionHandler = getOrCreateSessionHandler;
exports.updateSessionDataHandler = updateSessionDataHandler;
exports.getSessionStatusHandler = getSessionStatusHandler;
const client_1 = require("@prisma/client");
exports.getSessionOrCreateTool = [
    {
        type: "function",
        function: {
            name: "get_or_create_session",
            description: "Get or create a conversation session for tracking user progress",
            parameters: {
                type: "object",
                properties: {
                    sessionId: {
                        type: "string",
                        description: "The unique session identifier"
                    },
                    userId: {
                        type: "string",
                        description: "User identifier (phone number or email)"
                    }
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
                    sessionId: {
                        type: "string",
                        description: "The session identifier"
                    },
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
    {
        type: "function",
        function: {
            name: "get_session_status",
            description: "Get current session status and collected data",
            parameters: {
                type: "object",
                properties: {
                    sessionId: {
                        type: "string",
                        description: "The session identifier"
                    }
                },
                required: ["sessionId"]
            }
        }
    }
];
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
        // Map data fields to database fields
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
async function getSessionStatusHandler(args, context) {
    try {
        const { sessionId } = args;
        const { prisma } = context;
        const session = await prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            return {
                success: false,
                error: "Session not found",
                message: "No active session found"
            };
        }
        return {
            success: true,
            data: {
                sessionId: session.sessionId,
                currentState: session.currentState,
                messageCount: session.messageCount,
                collectedData: {
                    fullName: session.fullName,
                    email: session.email,
                    phone: session.phone,
                    address: session.address,
                    gender: session.gender,
                    ministry: session.ministry,
                    category: session.category,
                    subject: session.subject,
                    description: session.description,
                    incidentDate: session.incidentDate
                }
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Failed to get session status"
        };
    }
}
exports.sessionToolHandlers = {
    get_or_create_session: getOrCreateSessionHandler,
    update_session_data: updateSessionDataHandler,
    get_session_status: getSessionStatusHandler,
};
//# sourceMappingURL=session-tools.js.map