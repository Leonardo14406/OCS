import { prisma } from '../../lib/prisma';
import { ConversationState } from '@prisma/client';
import { HandlerResponse } from './greeting-handler';

export class EvidenceHandler {
  async handle(sessionId: string, userMessage: string): Promise<HandlerResponse> {
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const lowerMessage = userMessage.toLowerCase();
    
    // Check if user wants to upload evidence or skip
    if (lowerMessage.includes('no') || lowerMessage.includes('skip') || 
        lowerMessage.includes('don\'t have') || lowerMessage.includes('none') ||
        lowerMessage.includes('without') || lowerMessage.includes('no evidence')) {
      return {
        message: "No problem. Let me review your complaint details and prepare it for submission. I'll classify it properly and make sure everything is in order.",
        nextState: ConversationState.classification,
        shouldUpdateSession: true,
        sessionData: { 
          messageCount: session.messageCount + 1,
          hasEvidence: false
        }
      };
    }

    // If user mentions having evidence, explain the upload process
    if (lowerMessage.includes('yes') || lowerMessage.includes('have') || 
        lowerMessage.includes('upload') || lowerMessage.includes('documents')) {
      return {
        message: "Great! For security and technical reasons, I'll need to direct you to a secure upload portal. Your complaint will be submitted first, and then you'll receive an email with a link to upload your evidence safely. The evidence will be attached to your complaint with tracking number. Shall I proceed with submitting your complaint?",
        nextState: ConversationState.submission,
        shouldUpdateSession: true,
        sessionData: { 
          messageCount: session.messageCount + 1,
          hasEvidence: true
        }
      };
    }

    // Default response
    return {
      message: "Do you have any evidence or documents to support your complaint? You can say 'yes' if you have documents to upload, or 'no' if you don't have any evidence to provide.",
      nextState: ConversationState.evidence_upload,
      shouldUpdateSession: true,
      sessionData: { messageCount: session.messageCount + 1 }
    };
  }
}
