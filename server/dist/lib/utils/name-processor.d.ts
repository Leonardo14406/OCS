import { Gender } from '@prisma/client';
export interface GenderDetectionResult {
    gender: Gender;
    confidence: number;
}
export declare class NameProcessor {
    private client;
    constructor();
    /**
     * Detect gender from a given name using structured LLM prompt
     */
    detectGender(name: string): Promise<GenderDetectionResult>;
    /**
     * Update gender information with user correction
     */
    correctGender(originalName: string, correctedGender: Gender): Promise<GenderDetectionResult>;
    /**
     * Generate apology message for misgendering
     */
    generateMisgenderingApology(correctGender: Gender): string;
    /**
     * Check if a name appears to be a full name vs first name
     */
    isFullName(name: string): boolean;
    /**
     * Extract first name from full name
     */
    extractFirstName(fullName: string): string;
    private cleanName;
    private validateGender;
    private validateConfidence;
    private getPronouns;
}
//# sourceMappingURL=name-processor.d.ts.map