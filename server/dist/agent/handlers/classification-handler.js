"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassificationHandler = void 0;
const prisma_1 = require("../../lib/prisma");
const classification_engine_1 = require("../../lib/ai/classification-engine");
const client_1 = require("@prisma/client");
class ClassificationHandler {
    constructor() {
        const config = {
            ministries: [
                'Health', 'Education', 'Finance', 'Interior', 'Justice',
                'Transport', 'Agriculture', 'Environment', 'Labor',
                'Foreign Affairs', 'Defense', 'Social Welfare', 'Housing',
                'Energy', 'Communications', 'Tourism', 'Trade', 'Local Government'
            ],
            categories: [
                'corruption', 'service_delivery', 'misconduct', 'negligence',
                'discrimination', 'harassment', 'fraud', 'bureaucratic_delay',
                'policy_violation', 'ethical_breach', 'misappropriation', 'other'
            ],
            confidenceThreshold: 0.4
        };
        this.classificationEngine = new classification_engine_1.ClassificationEngine(config);
    }
    async handle(sessionId, userMessage) {
        const session = await prisma_1.prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Use ClassificationEngine for final classification
        const classification = await this.classificationEngine.classify(session.description || '');
        // Check if classification meets minimum requirements
        if (!this.classificationEngine.isAcceptableClassification(classification)) {
            return {
                message: this.classificationEngine.getRejectionMessage(),
                nextState: client_1.ConversationState.error,
                shouldUpdateSession: false
            };
        }
        // Update session with final classification
        const updateData = {
            messageCount: session.messageCount + 1,
            classifiedMinistry: classification.ministry || session.ministry,
            classifiedCategory: classification.category || session.category,
            ministry: classification.ministry || session.ministry,
            category: classification.category || session.category
        };
        // Generate a summary for the user
        const summary = this.generateComplaintSummary(session, classification);
        return {
            message: `Perfect! I've reviewed and classified your complaint. Here's a summary:

${summary}

Does this look correct? If yes, I'll submit your complaint and you'll receive a tracking number. If anything needs to be changed, please let me know what should be corrected.`,
            nextState: client_1.ConversationState.submission,
            shouldUpdateSession: true,
            sessionData: updateData
        };
    }
    generateComplaintSummary(session, classification) {
        const parts = [];
        parts.push(`**Subject:** ${session.subject || 'Complaint submission'}`);
        parts.push(`**Ministry:** ${classification.ministry || 'To be determined'}`);
        parts.push(`**Category:** ${classification.category || 'General complaint'}`);
        if (session.incidentDate) {
            parts.push(`**Date of Incident:** ${session.incidentDate.toLocaleDateString()}`);
        }
        parts.push(`**Description:** ${session.description || 'No description provided'}`);
        return parts.join('\n');
    }
}
exports.ClassificationHandler = ClassificationHandler;
//# sourceMappingURL=classification-handler.js.map