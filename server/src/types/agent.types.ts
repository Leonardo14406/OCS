import { ConversationState, Gender } from '@prisma/client';

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
  validateFile(file: MediaFile): { isValid: boolean; error?: string };
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

export const CAPABILITIES: ConversationCapabilities = {
  canGreet: true,
  canCollectIdentity: true,
  canAcceptComplaint: true,
  canRequestEvidence: true,
  canClassify: true,
  canSubmit: true,
  canTrack: true,
  canAnswerQuestions: false // Strictly limited to complaint-related tasks
};

export const OUT_OF_SCOPE_MESSAGE = "I can only help with submitting or tracking complaints.";

export interface MediaValidationRule {
  maxSize: number; // bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

export const MEDIA_VALIDATION_RULES: Record<string, MediaValidationRule> = {
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

export interface SessionContext {
  sessionId: string;
  userId?: string;
  currentState: ConversationState;
  messageCount: number;
  lastMessageAt: Date;
  hasActiveComplaint: boolean;
  evidenceUploaded: boolean;
}
