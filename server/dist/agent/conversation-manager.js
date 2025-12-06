"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const greeting_handler_1 = require("./handlers/greeting-handler");
const identity_handler_1 = require("./handlers/identity-handler");
const classification_handler_1 = require("./handlers/classification-handler");
const evidence_handler_1 = require("./handlers/evidence-handler");
const submission_handler_1 = require("./handlers/submission-handler");
const tracking_handler_1 = require("./handlers/tracking-handler");
const gender_correction_handler_1 = require("./handlers/gender-correction-handler");
const ombudsman_agent_1 = require("./ombudsman-agent");
const agent_types_1 = require("../types/agent.types");
class ConversationManager {
    constructor() {
        this.greetingHandler = new greeting_handler_1.GreetingHandler();
        this.identityHandler = new identity_handler_1.IdentityHandler();
        this.evidenceHandler = new evidence_handler_1.EvidenceHandler();
        this.classificationHandler = new classification_handler_1.ClassificationHandler();
        this.submissionHandler = new submission_handler_1.SubmissionHandler();
        this.trackingHandler = new tracking_handler_1.TrackingHandler();
        this.genderCorrectionHandler = new gender_correction_handler_1.GenderCorrectionHandler();
        this.ombudsmanAgent = new ombudsman_agent_1.OmbudsmanAgent();
        // Initialize the agent
        this.ombudsmanAgent.initialize();
    }
    async processMessage(request) {
        const { sessionId, message, ipAddress, userAgent } = request;
        try {
            // Check if message is within allowed capabilities
            if (!this.isWithinCapabilities(message)) {
                return {
                    message: agent_types_1.OUT_OF_SCOPE_MESSAGE,
                    currentState: client_1.ConversationState.greeting,
                    sessionId,
                    isComplete: false
                };
            }
            // Get or create session
            let session = await this.getOrCreateSession(sessionId, ipAddress, userAgent);
            // Check for gender correction first (highest priority)
            const genderCorrection = await this.genderCorrectionHandler.processMessage(sessionId, message);
            if (genderCorrection) {
                // Update session if needed
                if (genderCorrection.shouldUpdateSession) {
                    session = await this.updateSession(sessionId, genderCorrection);
                }
                return {
                    message: genderCorrection.message,
                    currentState: genderCorrection.nextState,
                    sessionId,
                    isComplete: genderCorrection.nextState === client_1.ConversationState.completed
                };
            }
            // Check if this is a tracking request
            if (this.isTrackingRequest(message) && session.currentState === client_1.ConversationState.greeting) {
                const trackingResponse = await this.trackingHandler.handle(sessionId, message);
                return {
                    message: trackingResponse.message,
                    currentState: trackingResponse.nextState,
                    sessionId,
                    isComplete: trackingResponse.nextState === client_1.ConversationState.completed
                };
            }
            // Route to appropriate handler based on current state
            let handlerResponse;
            switch (session.currentState) {
                case client_1.ConversationState.greeting:
                    handlerResponse = await this.greetingHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.identity_collection:
                    handlerResponse = await this.identityHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.complaint_collection:
                    handlerResponse = await this.evidenceHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.evidence_upload:
                    handlerResponse = await this.evidenceHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.classification:
                    handlerResponse = await this.classificationHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.submission:
                    handlerResponse = await this.submissionHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.tracking:
                    handlerResponse = await this.trackingHandler.handle(sessionId, message);
                    break;
                case client_1.ConversationState.completed:
                    handlerResponse = {
                        message: "Your conversation has been completed. If you need to start a new complaint or track an existing one, please begin a new session.",
                        nextState: client_1.ConversationState.completed,
                        shouldUpdateSession: false
                    };
                    break;
                case client_1.ConversationState.error:
                    handlerResponse = {
                        message: "I apologize, but an error occurred in our conversation. Please start a new session to continue.",
                        nextState: client_1.ConversationState.error,
                        shouldUpdateSession: false
                    };
                    break;
                default:
                    handlerResponse = {
                        message: "I'm not sure how to respond to that. Let's start over - how can I help you today?",
                        nextState: client_1.ConversationState.greeting,
                        shouldUpdateSession: true,
                        sessionData: { currentState: client_1.ConversationState.greeting }
                    };
            }
            // Update session if needed
            if (handlerResponse.shouldUpdateSession) {
                session = await this.updateSession(sessionId, handlerResponse);
            }
            return {
                message: handlerResponse.message,
                currentState: handlerResponse.nextState,
                sessionId,
                isComplete: handlerResponse.nextState === client_1.ConversationState.completed
            };
        }
        catch (error) {
            console.error('Error processing message:', error);
            // Mark session as error state
            await prisma_1.prisma.conversationSession.update({
                where: { sessionId },
                data: {
                    currentState: client_1.ConversationState.error,
                    errorReason: error instanceof Error ? error.message : 'Unknown error',
                    lastMessageAt: new Date()
                }
            });
            return {
                message: "I apologize, but I encountered an error. Please try again or start a new conversation.",
                currentState: client_1.ConversationState.error,
                sessionId,
                isComplete: false
            };
        }
    }
    async processMessageWithMedia(agentMessage) {
        const { userId, message, media, sessionId } = agentMessage;
        try {
            // Use the new OmbudsmanAgent with tools
            const locationContext = this.extractLocationContext(message);
            const mediaContext = this.extractMediaContext(media);
            const agentResponse = await this.ombudsmanAgent.processMessage(message, sessionId || '', locationContext, mediaContext);
            // Get updated session data
            const session = await prisma_1.prisma.conversationSession.findUnique({
                where: { sessionId: sessionId || '' }
            });
            return {
                message: agentResponse,
                sessionId: sessionId || '',
                state: session?.currentState || client_1.ConversationState.greeting,
                shouldEndSession: session?.currentState === client_1.ConversationState.completed,
                shouldAttachMedia: session?.currentState === client_1.ConversationState.evidence_upload && media && media.length > 0,
                trackingNumber: session?.complaintId ? undefined : undefined // Will be generated when complaint is created
            };
        }
        catch (error) {
            console.error({ error, sessionId }, "Error processing message with OmbudsmanAgent");
            return {
                message: "I apologize, but I encountered an error processing your message. Please try again.",
                sessionId: sessionId || '',
                state: client_1.ConversationState.error,
                shouldEndSession: false,
                shouldAttachMedia: false
            };
        }
    }
    extractLocationContext(message) {
        // Simple location extraction - can be enhanced
        const locationRegex = /(?:at|in|near)\s+([^,.!?]+)/gi;
        const matches = message.match(locationRegex);
        if (matches && matches.length > 0) {
            return {
                hasLocation: true,
                locationDescription: matches[0].replace(/(?:at|in|near)\s+/i, '').trim()
            };
        }
        return { hasLocation: false };
    }
    extractMediaContext(media) {
        if (!media || media.length === 0) {
            return { hasMedia: false };
        }
        return {
            hasMedia: true,
            filename: media[0].name,
            mimeType: media[0].mimeType,
            size: media[0].size,
            data: media[0].buffer ? media[0].buffer.toString('base64') : undefined
        };
    }
    async getOrCreateSession(sessionId, ipAddress, userAgent) {
        let session = await prisma_1.prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            session = await prisma_1.prisma.conversationSession.create({
                data: {
                    sessionId,
                    ipAddress,
                    userAgent,
                    currentState: client_1.ConversationState.greeting,
                    lastMessageAt: new Date(),
                    messageCount: 0
                }
            });
        }
        return session;
    }
    async updateSession(sessionId, response) {
        const updateData = {
            currentState: response.nextState,
            lastMessageAt: new Date()
        };
        if (response.sessionData) {
            Object.assign(updateData, response.sessionData);
        }
        return await prisma_1.prisma.conversationSession.update({
            where: { sessionId },
            data: updateData
        });
    }
    isTrackingRequest(message) {
        const lowerMessage = message.toLowerCase();
        const trackingKeywords = [
            'track', 'status', 'check', 'omb-', 'tracking number', 'follow up',
            'followup', 'update', 'progress'
        ];
        return trackingKeywords.some(keyword => lowerMessage.includes(keyword)) ||
            /OMB-[A-Z0-9]+-[A-Z0-9]+/i.test(message);
    }
    async getSessionStatus(sessionId) {
        const session = await prisma_1.prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            return { error: 'Session not found' };
        }
        return {
            sessionId: session.sessionId,
            currentState: session.currentState,
            messageCount: session.messageCount,
            isComplete: session.currentState === client_1.ConversationState.completed,
            hasError: session.currentState === client_1.ConversationState.error,
            complaintId: session.complaintId
        };
    }
    async cleanupExpiredSessions(maxAgeHours = 24) {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
        const result = await prisma_1.prisma.conversationSession.deleteMany({
            where: {
                lastMessageAt: {
                    lt: cutoffDate
                },
                currentState: {
                    in: [client_1.ConversationState.completed, client_1.ConversationState.error]
                }
            }
        });
        return result.count;
    }
    isWithinCapabilities(message) {
        const lowerMessage = message.toLowerCase();
        // Check for out-of-scope topics
        const outOfScopeKeywords = [
            'weather', 'news', 'sports', 'entertainment', 'politics',
            'joke', 'story', 'recipe', 'advice', 'opinion', 'personal',
            'relationship', 'health', 'medical', 'legal', 'financial',
            'investment', 'tax', 'insurance', 'banking', 'loan'
        ];
        // If message contains out-of-scope keywords, reject
        if (outOfScopeKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return false;
        }
        // Allow complaint-related and tracking keywords
        const allowedKeywords = [
            'complaint', 'report', 'file', 'submit', 'issue', 'problem',
            'concern', 'grievance', 'corruption', 'misconduct', 'harassment',
            'discrimination', 'fraud', 'track', 'status', 'check', 'omb-',
            'tracking number', 'follow up', 'followup', 'update', 'progress',
            'evidence', 'document', 'proof', 'ministry', 'department',
            'officer', 'investigation', 'help', 'assist', 'support'
        ];
        // If message contains allowed keywords, it's within scope
        if (allowedKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return true;
        }
        // General greetings and simple questions are allowed
        const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
        const simpleQuestions = ['how can', 'what can', 'help', 'start', 'begin'];
        return greetings.some(greeting => lowerMessage.includes(greeting)) ||
            simpleQuestions.some(question => lowerMessage.includes(question));
    }
    async getTrackingNumber(sessionId) {
        try {
            // Simplified query to avoid type issues
            const session = await prisma_1.prisma.conversationSession.findUnique({
                where: { sessionId }
            });
            if (!session?.complaintId) {
                return undefined;
            }
            // Get complaint separately
            const complaint = await prisma_1.prisma.complaint.findUnique({
                where: { id: session.complaintId },
                select: { trackingNumber: true }
            });
            return complaint?.trackingNumber;
        }
        catch (error) {
            console.error('Error getting tracking number:', error);
            return undefined;
        }
    }
}
exports.ConversationManager = ConversationManager;
//# sourceMappingURL=conversation-manager.js.map