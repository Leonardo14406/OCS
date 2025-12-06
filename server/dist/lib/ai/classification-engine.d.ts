export interface ClassificationResult {
    ministry: string | null;
    category: string | null;
    confidence: number;
}
export interface ClassificationEngineConfig {
    ministries: string[];
    categories: string[];
    confidenceThreshold?: number;
}
export declare class ClassificationEngine {
    private client;
    private config;
    constructor(config: ClassificationEngineConfig);
    /**
     * Classify complaint text using predefined JSON schema
     */
    classify(complaintText: string): Promise<ClassificationResult>;
    /**
     * Check if classification meets minimum requirements
     */
    isAcceptableClassification(result: ClassificationResult): boolean;
    /**
     * Get rejection message for unacceptable classifications
     */
    getRejectionMessage(): string;
    private validateMinistry;
    private validateCategory;
    private validateConfidence;
}
//# sourceMappingURL=classification-engine.d.ts.map