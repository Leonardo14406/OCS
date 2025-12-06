"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreetingHandler = void 0;
const prisma_1 = require("../../lib/prisma");
const openai_client_1 = require("../../lib/ai/openai-client");
const client_1 = require("@prisma/client");
class GreetingHandler {
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
        // More flexible conversation handling - let the AI guide naturally
        const lowerMessage = userMessage.toLowerCase();
        // If user clearly wants to file a complaint, provide gentle guidance
        if (lowerMessage.includes('complaint') || lowerMessage.includes('report') ||
            lowerMessage.includes('file') || lowerMessage.includes('issue')) {
            return {
                message: "I understand you'd like to file a complaint. I'm Leoma, and I'm here to help you through this process. Could you start by telling me what happened? Don't worry about getting all the details perfect at first - just share your story in your own words.",
                nextState: client_1.ConversationState.identity_collection,
                shouldUpdateSession: true,
                sessionData: { messageCount: session.messageCount + 1 }
            };
        }
        // If user provides their name, respond naturally
        if (this.looksLikeName(userMessage)) {
            const genderResult = await this.openaiClient.detectGender(userMessage);
            return {
                message: `Thank you for sharing your name with me. I'm Leoma, your AI assistant from the Ombudsman office. I'm here to listen and help you with whatever you need. Could you tell me what brought you here today?`,
                nextState: client_1.ConversationState.identity_collection,
                shouldUpdateSession: true,
                sessionData: {
                    fullName: userMessage.trim(),
                    detectedGender: genderResult.gender,
                    messageCount: session.messageCount + 1
                }
            };
        }
        // More conversational default greeting
        return {
            message: "Hello! I'm Leoma, your AI assistant for the Ombudsman office of Sierra Leone. I'm here to help you with any concerns you might have about government services or officials. Feel free to share what's on your mind, and I'll guide you through the process step by step.",
            nextState: client_1.ConversationState.greeting,
            shouldUpdateSession: true,
            sessionData: { messageCount: session.messageCount + 1 }
        };
    }
    looksLikeName(message) {
        const trimmed = message.trim();
        const lowerMessage = message.toLowerCase();
        // Simple heuristics for name detection
        // 1-3 words, no numbers, no special characters, reasonable length
        const words = trimmed.split(/\s+/);
        if (words.length < 1 || words.length > 3)
            return false;
        if (/\d/.test(trimmed))
            return false; // Contains numbers
        if (trimmed.length < 2 || trimmed.length > 50)
            return false;
        // Check if it contains common non-name words
        const nonNameWords = ['hello', 'hi', 'hey', 'help', 'complaint', 'report', 'file', 'issue', 'problem', 'assistant', 'leoma'];
        if (nonNameWords.some(word => lowerMessage.includes(word)))
            return false;
        return true;
    }
}
exports.GreetingHandler = GreetingHandler;
//# sourceMappingURL=greeting-handler.js.map