"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const agent_types_1 = require("../types/agent.types");
const complaints_service_1 = require("./complaints.service");
class MediaService {
    constructor() {
        this.complaintsService = new complaints_service_1.ComplaintsService();
    }
    /**
     * Detect file type and validate
     */
    validateFile(file) {
        // Check file size
        if (file.size === 0) {
            return { isValid: false, error: 'File is empty' };
        }
        // Detect file category
        const category = this.detectFileCategory(file.mimeType);
        if (!category) {
            return {
                isValid: false,
                error: 'Unsupported file type. Supported types: images, documents, videos, and audio files.'
            };
        }
        const rules = agent_types_1.MEDIA_VALIDATION_RULES[category];
        // Validate file type
        if (!rules.allowedTypes.includes(file.mimeType)) {
            return {
                isValid: false,
                error: `Invalid file type for ${category}. Allowed types: ${rules.allowedTypes.join(', ')}`
            };
        }
        // Validate file size
        if (file.size > rules.maxSize) {
            const maxSizeMB = Math.round(rules.maxSize / (1024 * 1024));
            return {
                isValid: false,
                error: `File too large. Maximum size for ${category} is ${maxSizeMB}MB.`
            };
        }
        return { isValid: true, category };
    }
    /**
     * Process and upload media file
     */
    async processFile(file) {
        // Validate file first
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }
        try {
            // For now, simulate upload - in production, integrate with uploadthing
            const uploadResult = await this.uploadFile(file);
            return {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.mimeType,
                url: uploadResult.url,
                uploadThingKey: uploadResult.key,
                uploadedAt: new Date()
            };
        }
        catch (error) {
            console.error('Error processing file:', error);
            throw new Error('Failed to process file. Please try again.');
        }
    }
    /**
     * Attach media to active complaint session
     */
    async attachMediaToSession(sessionId, mediaFiles) {
        try {
            // Get session to find associated complaint
            const session = await this.getSessionBySessionId(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            if (!session.complaintId) {
                throw new Error('No active complaint found for this session');
            }
            // Add evidence to complaint
            await this.complaintsService.addEvidenceToComplaint(session.complaintId, mediaFiles.map(media => ({
                fileName: media.fileName,
                fileSize: media.fileSize,
                fileType: media.fileType,
                url: media.url,
                uploadThingKey: media.uploadThingKey
            })));
        }
        catch (error) {
            console.error('Error attaching media to session:', error);
            throw new Error('Failed to attach files to complaint');
        }
    }
    /**
     * Detect file category based on MIME type
     */
    detectFileCategory(mimeType) {
        if (mimeType.startsWith('image/'))
            return 'image';
        if (mimeType.startsWith('video/'))
            return 'video';
        if (mimeType.startsWith('audio/'))
            return 'audio';
        // Document types
        const documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (documentTypes.includes(mimeType))
            return 'document';
        return null;
    }
    /**
     * Upload file to storage (placeholder for uploadthing integration)
     */
    async uploadFile(file) {
        // In production, integrate with uploadthing here
        // For now, return a mock response
        const key = `evidence/${Date.now()}-${file.name}`;
        const url = `https://storage.example.com/${key}`;
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return { url, key };
    }
    /**
     * Get session by session ID
     */
    async getSessionBySessionId(sessionId) {
        // This would use Prisma in production
        // For now, return mock data
        return {
            id: sessionId,
            complaintId: 'mock-complaint-id'
        };
    }
    /**
     * Get supported file types for user guidance
     */
    getSupportedFileTypes() {
        const types = Object.entries(agent_types_1.MEDIA_VALIDATION_RULES)
            .map(([category, rules]) => {
            const maxSizeMB = Math.round(rules.maxSize / (1024 * 1024));
            const extensions = rules.allowedExtensions.join(', ');
            return `${category} (${extensions}) - Max ${maxSizeMB}MB`;
        })
            .join('\n');
        return types;
    }
    /**
     * Batch process multiple files
     */
    async processBatchFiles(files) {
        const results = [];
        const errors = [];
        for (const file of files) {
            try {
                const processed = await this.processFile(file);
                results.push(processed);
            }
            catch (error) {
                errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`Some files failed to process:\n${errors.join('\n')}`);
        }
        return results;
    }
}
exports.MediaService = MediaService;
//# sourceMappingURL=media.service.js.map