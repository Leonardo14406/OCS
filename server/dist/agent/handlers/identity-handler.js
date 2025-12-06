"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityHandler = void 0;
const prisma_1 = require("../../lib/prisma");
const name_processor_1 = require("../../lib/utils/name-processor");
const client_1 = require("@prisma/client");
class IdentityHandler {
    constructor() {
        this.nameProcessor = new name_processor_1.NameProcessor();
    }
    async handle(sessionId, userMessage) {
        const session = await prisma_1.prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        const lowerMessage = userMessage.toLowerCase();
        // Check if we have email and phone
        const hasEmail = this.extractEmail(userMessage);
        const hasPhone = this.extractPhone(userMessage);
        // Update session with extracted information
        const updateData = { messageCount: session.messageCount + 1 };
        if (hasEmail)
            updateData.email = hasEmail;
        if (hasPhone)
            updateData.phone = hasPhone;
        // Extract and detect gender from name
        const extractedName = this.extractName(userMessage);
        if (extractedName && !session.fullName) {
            updateData.fullName = extractedName;
            // Detect gender from the extracted name
            const genderDetection = await this.nameProcessor.detectGender(extractedName);
            if (genderDetection.confidence > 0.6) { // Only set gender if confidence is reasonable
                updateData.gender = genderDetection.gender;
            }
        }
        // Check if we have all required identity information
        const hasName = session.fullName && session.fullName.trim().length > 0;
        const hasEmailNow = updateData.email || session.email;
        const hasPhoneNow = updateData.phone || session.phone;
        if (!hasName) {
            return {
                message: "I'll need your full name first. Could you please tell me your name?",
                nextState: client_1.ConversationState.identity_collection,
                shouldUpdateSession: true,
                sessionData: updateData
            };
        }
        if (!hasEmailNow) {
            return {
                message: "Thank you! Now I'll need your email address for contact purposes.",
                nextState: client_1.ConversationState.identity_collection,
                shouldUpdateSession: true,
                sessionData: updateData
            };
        }
        if (!hasPhoneNow) {
            return {
                message: "Great! Finally, I'll need your phone number for verification and updates.",
                nextState: client_1.ConversationState.identity_collection,
                shouldUpdateSession: true,
                sessionData: updateData
            };
        }
        // All identity information collected - move to complaint collection
        return {
            message: `Perfect! I have your information. Now, please tell me about the complaint you'd like to file. What happened, which government ministry or department is involved, and when did it occur?`,
            nextState: client_1.ConversationState.complaint_collection,
            shouldUpdateSession: true,
            sessionData: updateData
        };
    }
    extractEmail(message) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const match = message.match(emailRegex);
        return match ? match[0] : null;
    }
    extractPhone(message) {
        // Remove all non-digit characters first
        const digitsOnly = message.replace(/\D/g, '');
        // Look for patterns that could be phone numbers
        // 10-15 digits (typical phone number length)
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            // Try to format it reasonably
            if (digitsOnly.length === 10) {
                return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
            }
            else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
                return `+${digitsOnly.slice(0, 1)} ${digitsOnly.slice(1, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
            }
            return digitsOnly; // Return as-is for other formats
        }
        return null;
    }
    extractName(message) {
        // Look for name patterns - simple heuristic
        // Remove email and phone first to avoid confusion
        const cleanMessage = message
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '')
            .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '')
            .replace(/\b\d{10,15}\b/g, '');
        // Common name introduction patterns
        const namePatterns = [
            /(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /(?:call me|you can call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:here|is)/i,
        ];
        for (const pattern of namePatterns) {
            const match = cleanMessage.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // Basic validation: should be 2-50 characters, contain only letters and spaces
                if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\s]+$/.test(name)) {
                    return name;
                }
            }
        }
        // If no pattern matches, try to find capitalized words that might be names
        const words = cleanMessage.split(/\s+/);
        const capitalizedWords = words.filter(word => /^[A-Z][a-z]+$/.test(word) && word.length >= 2 && word.length <= 20);
        if (capitalizedWords.length >= 1 && capitalizedWords.length <= 3) {
            const potentialName = capitalizedWords.slice(0, 2).join(' ');
            return potentialName;
        }
        return null;
    }
}
exports.IdentityHandler = IdentityHandler;
//# sourceMappingURL=identity-handler.js.map