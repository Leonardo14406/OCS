"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassificationEngine = void 0;
const openai_1 = __importDefault(require("openai"));
class ClassificationEngine {
    constructor(config) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.client = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.config = {
            confidenceThreshold: 0.4,
            ...config
        };
    }
    /**
     * Classify complaint text using predefined JSON schema
     */
    async classify(complaintText) {
        const ministriesList = this.config.ministries.join(', ');
        const categoriesList = this.config.categories.join(', ');
        const prompt = `
You are a classification expert for government complaints. Analyze the following complaint and classify it according to the provided schema.

COMPLAINT TEXT:
"${complaintText}"

AVAILABLE MINISTRIES:
${ministriesList}

AVAILABLE CATEGORIES:
${categoriesList}

TASK:
Classify this complaint by selecting the most appropriate ministry and category from the lists above. Respond ONLY with a valid JSON object matching this exact schema:
{
  "ministry": "string or null",
  "category": "string or null", 
  "confidence": "number between 0 and 1"
}

RULES:
1. If no ministry from the list is appropriate, set ministry to null
2. If no category from the list is appropriate, set category to null
3. Confidence should reflect how certain you are about the classification
4. Be conservative with confidence - if unsure, assign a lower score
5. Consider the specific details and context of the complaint
6. If the complaint is unclear or doesn't match available options, both ministry and category should be null

Example valid responses:
{"ministry": "Health", "category": "service_delivery", "confidence": 0.85}
{"ministry": null, "category": null, "confidence": 0.2}
{"ministry": "Education", "category": "misconduct", "confidence": 0.72}
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
            const classification = {
                ministry: this.validateMinistry(result.ministry),
                category: this.validateCategory(result.category),
                confidence: this.validateConfidence(result.confidence)
            };
            return classification;
        }
        catch (error) {
            console.error('Error in ClassificationEngine:', error);
            return {
                ministry: null,
                category: null,
                confidence: 0
            };
        }
    }
    /**
     * Check if classification meets minimum requirements
     */
    isAcceptableClassification(result) {
        return (result.ministry !== null &&
            result.confidence >= this.config.confidenceThreshold);
    }
    /**
     * Get rejection message for unacceptable classifications
     */
    getRejectionMessage() {
        return "I'm sorry, I cannot process this type of complaint.";
    }
    validateMinistry(ministry) {
        if (typeof ministry !== 'string' || !ministry.trim()) {
            return null;
        }
        const normalizedMinistry = ministry.trim();
        return this.config.ministries.includes(normalizedMinistry) ? normalizedMinistry : null;
    }
    validateCategory(category) {
        if (typeof category !== 'string' || !category.trim()) {
            return null;
        }
        const normalizedCategory = category.trim();
        return this.config.categories.includes(normalizedCategory) ? normalizedCategory : null;
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
}
exports.ClassificationEngine = ClassificationEngine;
//# sourceMappingURL=classification-engine.js.map