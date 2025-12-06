import { Gender } from '@prisma/client';
export interface ClassificationResult {
    ministry?: string;
    category?: string;
    confidence?: number;
}
export interface GenderDetectionResult {
    gender: Gender;
    confidence: number;
}
export interface ParaphraseResult {
    paraphrased: string;
    improvements: string[];
}
export declare class OpenAIClient {
    private client;
    constructor();
    /**
     * Detect gender from name
     */
    detectGender(name: string): Promise<GenderDetectionResult>;
    /**
     * Classify complaint text into ministry and category
     */
    classifyComplaint(description: string): Promise<ClassificationResult>;
    /**
     * Paraphrase and improve complaint description
     */
    paraphraseDescription(originalDescription: string): Promise<ParaphraseResult>;
    /**
     * Generate conversational responses
     */
    generateResponse(context: string, userMessage: string, persona?: string): Promise<string>;
}
export declare const openaiClient: OpenAIClient;
//# sourceMappingURL=openai-client.d.ts.map