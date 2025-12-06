import { Gender } from '@prisma/client';
import { HandlerResponse } from './greeting-handler';
export declare class GenderCorrectionHandler {
    private nameProcessor;
    constructor();
    /**
     * Handle gender correction from user
     */
    handleGenderCorrection(sessionId: string, correctedGender: Gender): Promise<HandlerResponse>;
    /**
     * Check if message contains gender correction
     */
    isGenderCorrection(message: string): boolean;
    /**
     * Extract corrected gender from message
     */
    extractCorrectedGender(message: string): Gender | null;
    /**
     * Process message and handle gender correction if detected
     */
    processMessage(sessionId: string, message: string): Promise<HandlerResponse | null>;
}
//# sourceMappingURL=gender-correction-handler.d.ts.map