"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiClient = exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIClient {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.client = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Detect gender from name
     */
    async detectGender(name) {
        const prompt = `
Analyze the name "${name}" and determine the most likely gender.
Respond with ONLY a JSON object containing:
- gender: one of "male", "female", "other", or "prefer_not_to_say"
- confidence: a number between 0 and 1 indicating confidence level

Consider cultural variations and ambiguous names. If uncertain, prefer "prefer_not_to_say".
`;
        try {
            const response = await this.client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            const result = JSON.parse(content);
            return {
                gender: result.gender || 'prefer_not_to_say',
                confidence: result.confidence || 0.5,
            };
        }
        catch (error) {
            console.error('Error detecting gender:', error);
            return { gender: 'prefer_not_to_say', confidence: 0 };
        }
    }
    /**
     * Classify complaint text into ministry and category
     */
    async classifyComplaint(description) {
        const prompt = `
Analyze the following complaint description and classify it:

"${description}"

Respond with ONLY a JSON object containing:
- ministry: the most relevant government ministry/department
- category: the type of complaint (e.g., "corruption", "service_delivery", "misconduct", "negligence", "discrimination", "harassment", "fraud", "other")
- confidence: a number between 0 and 1 indicating classification confidence

Common ministries include: Health, Education, Finance, Interior, Justice, Transport, Agriculture, Environment, Labor, etc.
`;
        try {
            const response = await this.client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            const result = JSON.parse(content);
            return {
                ministry: result.ministry,
                category: result.category,
                confidence: result.confidence || 0.5,
            };
        }
        catch (error) {
            console.error('Error classifying complaint:', error);
            return { confidence: 0 };
        }
    }
    /**
     * Paraphrase and improve complaint description
     */
    async paraphraseDescription(originalDescription) {
        const prompt = `
Improve the following complaint description to make it clearer, more professional, and more effective:

"${originalDescription}"

Provide:
1. A paraphrased version that is clear, concise, and professional
2. A list of specific improvements made

Respond with ONLY a JSON object containing:
- paraphrased: the improved description
- improvements: an array of strings describing what was improved

Focus on clarity, professionalism, removing emotional language while preserving the core facts, and ensuring all important details are included.
`;
        try {
            const response = await this.client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            const result = JSON.parse(content);
            return {
                paraphrased: result.paraphrased || originalDescription,
                improvements: result.improvements || [],
            };
        }
        catch (error) {
            console.error('Error paraphrasing description:', error);
            return {
                paraphrased: originalDescription,
                improvements: [],
            };
        }
    }
    /**
     * Generate conversational responses
     */
    async generateResponse(context, userMessage, persona = 'Leoma') {
        const prompt = `
You are ${persona}, an AI assistant for the Ombudsman office. You are helpful, professional, and empathetic.

Context: ${context}

User message: "${userMessage}"

Generate a natural, convers ​​conversational response that:
1. Acknowledges the user's input
2. Provides helpful guidance
3. Maintains a professional yet approachable tone
4. Asks relevant follow-up questions if needed

Keep responses concise (2-3 sentences maximum) and conversational.
`;
        try {
            const response = await this.client.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            });
            return response.choices[0]?.message?.content || "I'm here to help you with your complaint. Could you please provide more details?";
        }
        catch (error) {
            console.error('Error generating response:', error);
            return "I'm experiencing some technical difficulties, but I'm still here to help. Could you try rephrasing your message?";
        }
    }
}
exports.OpenAIClient = OpenAIClient;
exports.openaiClient = new OpenAIClient();
//# sourceMappingURL=openai-client.js.map