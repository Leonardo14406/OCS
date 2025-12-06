import { MediaFile, ProcessedMedia } from '../types/agent.types';
export declare class MediaService {
    private complaintsService;
    constructor();
    /**
     * Detect file type and validate
     */
    validateFile(file: MediaFile): {
        isValid: boolean;
        error?: string;
        category?: string;
    };
    /**
     * Process and upload media file
     */
    processFile(file: MediaFile): Promise<ProcessedMedia>;
    /**
     * Attach media to active complaint session
     */
    attachMediaToSession(sessionId: string, mediaFiles: ProcessedMedia[]): Promise<void>;
    /**
     * Detect file category based on MIME type
     */
    private detectFileCategory;
    /**
     * Upload file to storage (placeholder for uploadthing integration)
     */
    private uploadFile;
    /**
     * Get session by session ID
     */
    private getSessionBySessionId;
    /**
     * Get supported file types for user guidance
     */
    getSupportedFileTypes(): string;
    /**
     * Batch process multiple files
     */
    processBatchFiles(files: MediaFile[]): Promise<ProcessedMedia[]>;
}
//# sourceMappingURL=media.service.d.ts.map