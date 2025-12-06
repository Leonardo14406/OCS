import { ConversationState } from '@prisma/client';
export interface AgentMessage {
    userId?: string;
    message: string;
    media?: MediaFile[];
    sessionId?: string;
}
export interface MediaFile {
    name: string;
    type: string;
    size: number;
    url?: string;
    buffer?: Buffer;
    mimeType: string;
}
export interface AgentResponse {
    message: string;
    sessionId: string;
    state: ConversationState;
    shouldEndSession?: boolean;
    trackingNumber?: string;
    evidenceUploaded?: boolean;
}
export interface MessageHandler {
    handle(sessionId: string, message: string, media?: MediaFile[]): Promise<AgentResponse>;
}
export interface MediaProcessor {
    validateFile(file: MediaFile): {
        isValid: boolean;
        error?: string;
    };
    processFile(file: MediaFile): Promise<ProcessedMedia>;
}
export interface ProcessedMedia {
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    uploadThingKey?: string;
    uploadedAt: Date;
}
export interface ConversationCapabilities {
    canGreet: boolean;
    canCollectIdentity: boolean;
    canAcceptComplaint: boolean;
    canRequestEvidence: boolean;
    canClassify: boolean;
    canSubmit: boolean;
    canTrack: boolean;
    canAnswerQuestions: boolean;
}
export declare const CAPABILITIES: ConversationCapabilities;
export declare const OUT_OF_SCOPE_MESSAGE = "I can only help with submitting or tracking complaints.";
export interface MediaValidationRule {
    maxSize: number;
    allowedTypes: string[];
    allowedExtensions: string[];
}
export declare const MEDIA_VALIDATION_RULES: Record<string, MediaValidationRule>;
export interface SessionContext {
    sessionId: string;
    userId?: string;
    currentState: ConversationState;
    messageCount: number;
    lastMessageAt: Date;
    hasActiveComplaint: boolean;
    evidenceUploaded: boolean;
}
//# sourceMappingURL=agent.types.d.ts.map