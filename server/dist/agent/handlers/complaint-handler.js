"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintHandler = void 0;
const prisma_1 = require("../../lib/prisma");
const openai_client_1 = require("../../lib/ai/openai-client");
const client_1 = require("@prisma/client");
class ComplaintHandler {
    constructor() {
        this.openaiClient = new openai_client_1.OpenAIClient();
    }
    async handle(sessionId, userMessage) {
        const session = await prisma_1.prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        const updateData = { messageCount: session.messageCount + 1 };
        // Check if we have basic complaint information
        const hasDescription = session.description && session.description.trim().length > 0;
        const hasMinistry = session.ministry && session.ministry.trim().length > 0;
        const hasSubject = session.subject && session.subject.trim().length > 0;
        // If this is the first complaint message, classify and store it
        if (!hasDescription) {
            const classification = await this.openaiClient.classifyComplaint(userMessage);
            const paraphrase = await this.openaiClient.paraphraseDescription(userMessage);
            updateData.description = paraphrase.paraphrased;
            updateData.classifiedMinistry = classification.ministry;
            updateData.classifiedCategory = classification.category;
            return {
                message: `Thank you for providing those details. I've classified this as potentially involving ${classification.ministry || 'a government department'}. 

Could you please provide a brief subject or title for your complaint? Also, if there was a specific date when this incident occurred, please let me know.`,
                nextState: client_1.ConversationState.complaint_collection,
                shouldUpdateSession: true,
                sessionData: updateData
            };
        }
        // Extract subject if not present
        if (!hasSubject) {
            updateData.subject = userMessage.trim().substring(0, 100); // Limit subject length
            return {
                message: "Got it. Do you have any evidence or documents related to this complaint that you'd like to upload? This could include photos, videos, emails, or other supporting documents.",
                nextState: client_1.ConversationState.evidence_upload,
                shouldUpdateSession: true,
                sessionData: updateData
            };
        }
        // Extract date if not present
        if (!session.incidentDate) {
            const extractedDate = this.extractDate(userMessage);
            if (extractedDate) {
                updateData.incidentDate = extractedDate;
            }
            return {
                message: "Thank you for the additional information. Do you have any evidence or documents related to this complaint that you'd like to upload? This could include photos, videos, emails, or other supporting documents.",
                nextState: client_1.ConversationState.evidence_upload,
                shouldUpdateSession: true,
                sessionData: updateData
            };
        }
        // Move to evidence upload
        return {
            message: "I have the details of your complaint. Do you have any evidence or documents you'd like to upload to support your case?",
            nextState: client_1.ConversationState.evidence_upload,
            shouldUpdateSession: true,
            sessionData: updateData
        };
    }
    extractDate(message) {
        const lowerMessage = message.toLowerCase();
        // Look for common date patterns
        const datePatterns = [
            /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/, // MM/DD/YYYY or DD/MM/YYYY
            /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/, // YYYY/MM/DD
            /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i, // Month DD, YYYY
            /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/i, // DD Month YYYY
        ];
        for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match) {
                try {
                    const date = new Date(match[0]);
                    if (!isNaN(date.getTime()) && date <= new Date()) {
                        return date;
                    }
                }
                catch (error) {
                    // Continue to next pattern
                }
            }
        }
        // Look for relative dates
        if (lowerMessage.includes('yesterday')) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday;
        }
        if (lowerMessage.includes('last week')) {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            return lastWeek;
        }
        if (lowerMessage.includes('last month')) {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return lastMonth;
        }
        return null;
    }
}
exports.ComplaintHandler = ComplaintHandler;
//# sourceMappingURL=complaint-handler.js.map