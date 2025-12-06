"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDIA_VALIDATION_RULES = exports.OUT_OF_SCOPE_MESSAGE = exports.CAPABILITIES = void 0;
exports.CAPABILITIES = {
    canGreet: true,
    canCollectIdentity: true,
    canAcceptComplaint: true,
    canRequestEvidence: true,
    canClassify: true,
    canSubmit: true,
    canTrack: true,
    canAnswerQuestions: false // Strictly limited to complaint-related tasks
};
exports.OUT_OF_SCOPE_MESSAGE = "I can only help with submitting or tracking complaints.";
exports.MEDIA_VALIDATION_RULES = {
    image: {
        maxSize: 8 * 1024 * 1024, // 8MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    document: {
        maxSize: 16 * 1024 * 1024, // 16MB
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ],
        allowedExtensions: ['.pdf', '.doc', '.docx', '.txt']
    },
    video: {
        maxSize: 32 * 1024 * 1024, // 32MB
        allowedTypes: ['video/mp4', 'video/avi', 'video/mov'],
        allowedExtensions: ['.mp4', '.avi', '.mov']
    },
    audio: {
        maxSize: 32 * 1024 * 1024, // 32MB
        allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
        allowedExtensions: ['.mp3', '.wav', '.mpeg']
    }
};
//# sourceMappingURL=agent.types.js.map