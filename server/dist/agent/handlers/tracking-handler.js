"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingHandler = void 0;
const client_1 = require("@prisma/client");
const tracking_service_1 = require("../../services/tracking.service");
class TrackingHandler {
    constructor() {
        this.trackingService = new tracking_service_1.TrackingService();
    }
    async handle(sessionId, userMessage) {
        const trackingNumber = this.extractTrackingNumber(userMessage);
        if (!trackingNumber) {
            return {
                message: "To check your complaint status, please provide your tracking number. It should look like 'OMB-XXXX-YYYY'.",
                nextState: client_1.ConversationState.tracking,
                shouldUpdateSession: true,
                sessionData: { messageCount: 1 }
            };
        }
        try {
            // Use TrackingService for structured tracking
            const trackingResponse = await this.trackingService.trackComplaint({
                trackingNumber,
                includeHistory: true,
                includeEvidence: true
            });
            if (!trackingResponse.success) {
                // Handle different error types with appropriate user messages
                let nextState = client_1.ConversationState.tracking;
                if (trackingResponse.errorType === 'SYSTEM_ERROR') {
                    nextState = client_1.ConversationState.error;
                }
                return {
                    message: trackingResponse.message,
                    nextState,
                    shouldUpdateSession: true,
                    sessionData: {
                        messageCount: 1,
                        ...(nextState === client_1.ConversationState.error && { errorReason: 'Tracking service error' })
                    }
                };
            }
            // Successful tracking response
            return {
                message: trackingResponse.message,
                nextState: client_1.ConversationState.completed,
                shouldUpdateSession: true,
                sessionData: {
                    messageCount: 1,
                    completedAt: new Date(),
                    trackingResult: {
                        trackingNumber: trackingResponse.trackingNumber,
                        status: trackingResponse.status,
                        ministry: trackingResponse.ministry,
                        lastUpdated: trackingResponse.lastUpdated
                    }
                }
            };
        }
        catch (error) {
            console.error('Error in TrackingHandler:', error);
            return {
                message: "I'm experiencing technical difficulties while tracking your complaint. Please try again later or contact our support team for assistance.",
                nextState: client_1.ConversationState.error,
                shouldUpdateSession: true,
                sessionData: {
                    messageCount: 1,
                    errorReason: 'Tracking handler error'
                }
            };
        }
    }
    extractTrackingNumber(message) {
        const trackingRegex = /OMB-[A-Z0-9]+-[A-Z0-9]+/i;
        const match = message.match(trackingRegex);
        return match ? match[0].toUpperCase() : null;
    }
}
exports.TrackingHandler = TrackingHandler;
//# sourceMappingURL=tracking-handler.js.map