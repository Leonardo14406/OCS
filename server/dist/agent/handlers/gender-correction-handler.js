"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenderCorrectionHandler = void 0;
const prisma_1 = require("../../lib/prisma");
const name_processor_1 = require("../../lib/utils/name-processor");
class GenderCorrectionHandler {
    constructor() {
        this.nameProcessor = new name_processor_1.NameProcessor();
    }
    /**
     * Handle gender correction from user
     */
    async handleGenderCorrection(sessionId, correctedGender) {
        const session = await prisma_1.prisma.conversationSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        // Get the corrected gender detection result
        const correctedResult = await this.nameProcessor.correctGender(session.fullName || 'User', correctedGender);
        // Update session with corrected gender
        const updateData = {
            gender: correctedGender,
            messageCount: session.messageCount + 1
        };
        // Generate apology message
        const apologyMessage = this.nameProcessor.generateMisgenderingApology(correctedGender);
        return {
            message: apologyMessage,
            nextState: session.currentState, // Stay in current state
            shouldUpdateSession: true,
            sessionData: updateData
        };
    }
    /**
     * Check if message contains gender correction
     */
    isGenderCorrection(message) {
        const lowerMessage = message.toLowerCase();
        const correctionPatterns = [
            'i am', 'i\'m', 'my gender is', 'i identify as',
            'actually i\'m', 'actually i am', 'i\'m actually',
            'i\'m a', 'i am a', 'call me', 'refer to me'
        ];
        const genderKeywords = [
            'male', 'female', 'man', 'woman', 'guy', 'girl',
            'he', 'him', 'his', 'she', 'her', 'hers',
            'they', 'them', 'their', 'non-binary', 'nonbinary'
        ];
        // Check if message contains correction pattern + gender keyword
        const hasCorrectionPattern = correctionPatterns.some(pattern => lowerMessage.includes(pattern));
        const hasGenderKeyword = genderKeywords.some(keyword => lowerMessage.includes(keyword));
        return hasCorrectionPattern && hasGenderKeyword;
    }
    /**
     * Extract corrected gender from message
     */
    extractCorrectedGender(message) {
        const lowerMessage = message.toLowerCase();
        // Map various gender expressions to standard values
        const genderMap = {
            'male': 'male',
            'man': 'male',
            'guy': 'male',
            'he': 'male',
            'him': 'male',
            'his': 'male',
            'female': 'female',
            'woman': 'female',
            'girl': 'female',
            'she': 'female',
            'her': 'female',
            'hers': 'female',
            'they': 'other',
            'them': 'other',
            'their': 'other',
            'non-binary': 'other',
            'nonbinary': 'other',
            'prefer not to say': 'prefer_not_to_say',
            'undisclosed': 'prefer_not_to_say'
        };
        for (const [key, value] of Object.entries(genderMap)) {
            if (lowerMessage.includes(key)) {
                return value;
            }
        }
        return null;
    }
    /**
     * Process message and handle gender correction if detected
     */
    async processMessage(sessionId, message) {
        if (!this.isGenderCorrection(message)) {
            return null;
        }
        const correctedGender = this.extractCorrectedGender(message);
        if (!correctedGender) {
            return null;
        }
        return await this.handleGenderCorrection(sessionId, correctedGender);
    }
}
exports.GenderCorrectionHandler = GenderCorrectionHandler;
//# sourceMappingURL=gender-correction-handler.js.map