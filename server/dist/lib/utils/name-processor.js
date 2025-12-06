"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameProcessor = void 0;
const openai_1 = __importDefault(require("openai"));
class NameProcessor {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.client = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Detect gender from a given name using structured LLM prompt
     */
    async detectGender(name) {
        const cleanName = this.cleanName(name);
        if (!cleanName || cleanName.length < 2) {
            return { gender: 'prefer_not_to_say', confidence: 0 };
        }
        const prompt = `
You are a gender classification expert specializing in names from diverse cultural backgrounds.

TASK: Analyze the name "${cleanName}" and determine the most likely gender.

RESPONSE FORMAT: Respond ONLY with a valid JSON object matching this exact schema:
{
  "gender": "male|female|other|prefer_not_to_say",
  "confidence": "number between 0 and 1"
}

CLASSIFICATION RULES:
1. Consider cultural variations, international names, and unisex names
2. Be conservative - if uncertain, use "prefer_not_to_say"
3. Confidence should reflect how certain you are about the classification
4. For clearly gendered names (John, Mary, etc.), confidence should be high (0.8+)
5. For ambiguous or unisex names (Alex, Taylor, etc.), confidence should be lower (0.3-0.6)
6. For names you're completely unfamiliar with, use "prefer_not_to_say" with low confidence
7. Consider common spelling variations and diminutives

GENDER DEFINITIONS:
- "male": Typically masculine names
- "female": Typically feminine names  
- "other": Non-binary or gender-neutral identities
- "prefer_not_to_say": Unable to determine or prefer not to classify

Examples:
{"gender": "male", "confidence": 0.95}  // For "Robert"
{"gender": "female", "confidence": 0.92}  // For "Maria"
{"gender": "prefer_not_to_say", "confidence": 0.2}  // For unfamiliar/ambiguous names
{"gender": "other", "confidence": 0.7}  // For clearly non-binary names
`;
        try {
            const response = await this.client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            const result = JSON.parse(content);
            // Validate and sanitize the result
            const gender = this.validateGender(result.gender);
            const confidence = this.validateConfidence(result.confidence);
            return { gender, confidence };
        }
        catch (error) {
            console.error('Error in NameProcessor.detectGender:', error);
            return { gender: 'prefer_not_to_say', confidence: 0 };
        }
    }
    /**
     * Update gender information with user correction
     */
    async correctGender(originalName, correctedGender) {
        // When user corrects us, we should be more confident in their assessment
        return {
            gender: correctedGender,
            confidence: 0.95 // High confidence when user provides correction
        };
    }
    /**
     * Generate apology message for misgendering
     */
    generateMisgenderingApology(correctGender) {
        const genderPronouns = this.getPronouns(correctGender);
        return `I sincerely apologize for misgendering you. Thank you for the correction - I'll make sure to use the right pronouns (${genderPronouns}) going forward. I've updated my records to reflect this.`;
    }
    /**
     * Check if a name appears to be a full name vs first name
     */
    isFullName(name) {
        const cleanName = this.cleanName(name);
        return cleanName.includes(' ') && cleanName.split(' ').length >= 2;
    }
    /**
     * Extract first name from full name
     */
    extractFirstName(fullName) {
        const cleanName = this.cleanName(fullName);
        const parts = cleanName.split(' ').filter(part => part.length > 0);
        return parts[0] || cleanName;
    }
    cleanName(name) {
        return name.trim().replace(/[^\w\s\-']/g, '').replace(/\s+/g, ' ');
    }
    validateGender(gender) {
        const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
        return validGenders.includes(gender) ? gender : 'prefer_not_to_say';
    }
    validateConfidence(confidence) {
        const num = Number(confidence);
        if (isNaN(num) || num < 0) {
            return 0;
        }
        if (num > 1) {
            return 1;
        }
        return num;
    }
    getPronouns(gender) {
        switch (gender) {
            case 'male':
                return 'he/him';
            case 'female':
                return 'she/her';
            case 'other':
                return 'they/them';
            case 'prefer_not_to_say':
                return 'they/them';
            default:
                return 'they/them';
        }
    }
}
exports.NameProcessor = NameProcessor;
//# sourceMappingURL=name-processor.js.map