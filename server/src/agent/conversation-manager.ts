import { prisma } from '../lib/prisma';
import { ConversationState, Gender } from '@prisma/client';
import { GreetingHandler } from './handlers/greeting-handler';
import { IdentityHandler } from './handlers/identity-handler';
import { ClassificationHandler } from './handlers/classification-handler';
import { EvidenceHandler } from './handlers/evidence-handler';
import { SubmissionHandler } from './handlers/submission-handler';
import { TrackingHandler } from './handlers/tracking-handler';
import { GenderCorrectionHandler } from './handlers/gender-correction-handler';
import { OmbudsmanAgent } from './ombudsman-agent';
import { AgentMessage, AgentResponse, CAPABILITIES, OUT_OF_SCOPE_MESSAGE } from '../types/agent.types';
import { HandlerResponse } from './handlers/greeting-handler';

export interface AgentRequest {
  sessionId: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LegacyAgentResponse {
  message: string;
  currentState: ConversationState;
  sessionId: string;
  isComplete: boolean;
}

export class ConversationManager {
  private greetingHandler: GreetingHandler;
  private identityHandler: IdentityHandler;
  private evidenceHandler: EvidenceHandler;
  private classificationHandler: ClassificationHandler;
  private submissionHandler: SubmissionHandler;
  private trackingHandler: TrackingHandler;
  private genderCorrectionHandler: GenderCorrectionHandler;
  private ombudsmanAgent: OmbudsmanAgent;

  constructor() {
    this.greetingHandler = new GreetingHandler();
    this.identityHandler = new IdentityHandler();
    this.evidenceHandler = new EvidenceHandler();
    this.classificationHandler = new ClassificationHandler();
    this.submissionHandler = new SubmissionHandler();
    this.trackingHandler = new TrackingHandler();
    this.genderCorrectionHandler = new GenderCorrectionHandler();
    this.ombudsmanAgent = new OmbudsmanAgent();
    
    // Initialize the agent
    this.ombudsmanAgent.initialize();
  }

  async processMessage(request: AgentRequest): Promise<LegacyAgentResponse> {
    const { sessionId, message, ipAddress, userAgent } = request;

    try {
      // Check if message is within allowed capabilities
      if (!this.isWithinCapabilities(message)) {
        return {
          message: OUT_OF_SCOPE_MESSAGE,
          currentState: ConversationState.greeting,
          sessionId,
          isComplete: false
        };
      }

      // Get or create session
      let session = await this.getOrCreateSession(sessionId, ipAddress, userAgent);

      // Check for gender correction first (highest priority)
      const genderCorrection = await this.genderCorrectionHandler.processMessage(sessionId, message);
      if (genderCorrection) {
        // Update session if needed
        if (genderCorrection.shouldUpdateSession) {
          session = await this.updateSession(sessionId, genderCorrection);
        }

        return {
          message: genderCorrection.message,
          currentState: genderCorrection.nextState,
          sessionId,
          isComplete: genderCorrection.nextState === ConversationState.completed
        };
      }

      // Check if this is a tracking request
      if (this.isTrackingRequest(message) && session.currentState === ConversationState.greeting) {
        const trackingResponse = await this.trackingHandler.handle(sessionId, message);
        return {
          message: trackingResponse.message,
          currentState: trackingResponse.nextState,
          sessionId,
          isComplete: trackingResponse.nextState === ConversationState.completed
        };
      }

      // Route to appropriate handler based on current state
      let handlerResponse: HandlerResponse;

      switch (session.currentState) {
        case ConversationState.greeting:
          handlerResponse = await this.greetingHandler.handle(sessionId, message);
          break;

        case ConversationState.identity_collection:
          handlerResponse = await this.identityHandler.handle(sessionId, message);
          break;

        case ConversationState.complaint_collection:
          handlerResponse = await this.evidenceHandler.handle(sessionId, message);
          break;

        case ConversationState.evidence_upload:
          handlerResponse = await this.evidenceHandler.handle(sessionId, message);
          break;

        case ConversationState.classification:
          handlerResponse = await this.classificationHandler.handle(sessionId, message);
          break;

        case ConversationState.submission:
          handlerResponse = await this.submissionHandler.handle(sessionId, message);
          break;

        case ConversationState.tracking:
          handlerResponse = await this.trackingHandler.handle(sessionId, message);
          break;

        case ConversationState.completed:
          handlerResponse = {
            message: "Your conversation has been completed. If you need to start a new complaint or track an existing one, please begin a new session.",
            nextState: ConversationState.completed,
            shouldUpdateSession: false
          };
          break;

        case ConversationState.error:
          handlerResponse = {
            message: "I apologize, but an error occurred in our conversation. Please start a new session to continue.",
            nextState: ConversationState.error,
            shouldUpdateSession: false
          };
          break;

        default:
          handlerResponse = {
            message: "I'm not sure how to respond to that. Let's start over - how can I help you today?",
            nextState: ConversationState.greeting,
            shouldUpdateSession: true,
            sessionData: { currentState: ConversationState.greeting }
          };
      }

      // Update session if needed
      if (handlerResponse.shouldUpdateSession) {
        session = await this.updateSession(sessionId, handlerResponse);
      }

      return {
        message: handlerResponse.message,
        currentState: handlerResponse.nextState,
        sessionId,
        isComplete: handlerResponse.nextState === ConversationState.completed
      };

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Mark session as error state
      await prisma.conversationSession.update({
        where: { sessionId },
        data: {
          currentState: ConversationState.error,
          errorReason: error instanceof Error ? error.message : 'Unknown error',
          lastMessageAt: new Date()
        }
      });

      return {
        message: "I apologize, but I encountered an error. Please try again or start a new conversation.",
        currentState: ConversationState.error,
        sessionId,
        isComplete: false
      };
    }
  }

  async processMessageWithMedia(agentMessage: AgentMessage): Promise<AgentResponse & { shouldAttachMedia?: boolean; trackingNumber?: string }> {
    const { userId, message, media, sessionId } = agentMessage;

    try {
      // Use the new OmbudsmanAgent with tools
      const locationContext = this.extractLocationContext(message);
      const mediaContext = this.extractMediaContext(media);
      
      const agentResponse = await this.ombudsmanAgent.processMessage(
        message,
        sessionId || '',
        locationContext,
        mediaContext
      );

      // Get updated session data
      const session = await prisma.conversationSession.findUnique({
        where: { sessionId: sessionId || '' }
      });

      return {
        message: agentResponse,
        sessionId: sessionId || '',
        state: session?.currentState || ConversationState.greeting,
        shouldEndSession: session?.currentState === ConversationState.completed,
        shouldAttachMedia: session?.currentState === ConversationState.evidence_upload && media && media.length > 0,
        trackingNumber: session?.complaintId ? undefined : undefined // Will be generated when complaint is created
      };
    } catch (error: any) {
      console.error({ error, sessionId }, "Error processing message with OmbudsmanAgent");
      return {
        message: "I apologize, but I encountered an error processing your message. Please try again.",
        sessionId: sessionId || '',
        state: ConversationState.error,
        shouldEndSession: false,
        shouldAttachMedia: false
      };
    }
  }

  private extractLocationContext(message: string): any {
    // Simple location extraction - can be enhanced
    const locationRegex = /(?:at|in|near)\s+([^,.!?]+)/gi;
    const matches = message.match(locationRegex);
    
    if (matches && matches.length > 0) {
      return {
        hasLocation: true,
        locationDescription: matches[0].replace(/(?:at|in|near)\s+/i, '').trim()
      };
    }
    
    return { hasLocation: false };
  }

  private extractMediaContext(media?: any[]): any {
    if (!media || media.length === 0) {
      return { hasMedia: false };
    }
    
    return {
      hasMedia: true,
      filename: media[0].name,
      mimeType: media[0].mimeType,
      size: media[0].size,
      data: media[0].buffer ? media[0].buffer.toString('base64') : undefined
    };
  }

  private async getOrCreateSession(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    let session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      session = await prisma.conversationSession.create({
        data: {
          sessionId,
          ipAddress,
          userAgent,
          currentState: ConversationState.greeting,
          lastMessageAt: new Date(),
          messageCount: 0
        }
      });
    }

    return session;
  }

  private async updateSession(sessionId: string, response: HandlerResponse) {
    const updateData: any = {
      currentState: response.nextState,
      lastMessageAt: new Date()
    };

    if (response.sessionData) {
      Object.assign(updateData, response.sessionData);
    }

    return await prisma.conversationSession.update({
      where: { sessionId },
      data: updateData
    });
  }

  private isTrackingRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const trackingKeywords = [
      'track', 'status', 'check', 'omb-', 'tracking number', 'follow up',
      'followup', 'update', 'progress'
    ];
    
    return trackingKeywords.some(keyword => lowerMessage.includes(keyword)) ||
           /OMB-[A-Z0-9]+-[A-Z0-9]+/i.test(message);
  }

  async getSessionStatus(sessionId: string): Promise<any> {
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return { error: 'Session not found' };
    }

    return {
      sessionId: session.sessionId,
      currentState: session.currentState,
      messageCount: session.messageCount,
      isComplete: session.currentState === ConversationState.completed,
      hasError: session.currentState === ConversationState.error,
      complaintId: session.complaintId
    };
  }

  async cleanupExpiredSessions(maxAgeHours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const result = await prisma.conversationSession.deleteMany({
      where: {
        lastMessageAt: {
          lt: cutoffDate
        },
        currentState: {
          in: [ConversationState.completed, ConversationState.error]
        }
      }
    });

    return result.count;
  }

  private isWithinCapabilities(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Check for out-of-scope topics
    const outOfScopeKeywords = [
      'weather', 'news', 'sports', 'entertainment', 'politics',
      'joke', 'story', 'recipe', 'advice', 'opinion', 'personal',
      'relationship', 'health', 'medical', 'legal', 'financial',
      'investment', 'tax', 'insurance', 'banking', 'loan'
    ];
    
    // If message contains out-of-scope keywords, reject
    if (outOfScopeKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return false;
    }
    
    // Allow complaint-related and tracking keywords
    const allowedKeywords = [
      'complaint', 'report', 'file', 'submit', 'issue', 'problem',
      'concern', 'grievance', 'corruption', 'misconduct', 'harassment',
      'discrimination', 'fraud', 'track', 'status', 'check', 'omb-',
      'tracking number', 'follow up', 'followup', 'update', 'progress',
      'evidence', 'document', 'proof', 'ministry', 'department',
      'officer', 'investigation', 'help', 'assist', 'support'
    ];
    
    // If message contains allowed keywords, it's within scope
    if (allowedKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }
    
    // General greetings and simple questions are allowed
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const simpleQuestions = ['how can', 'what can', 'help', 'start', 'begin'];
    
    return greetings.some(greeting => lowerMessage.includes(greeting)) ||
           simpleQuestions.some(question => lowerMessage.includes(question));
  }

  private async getTrackingNumber(sessionId: string): Promise<string | undefined> {
    try {
      // Simplified query to avoid type issues
      const session = await prisma.conversationSession.findUnique({
        where: { sessionId }
      });
      
      if (!session?.complaintId) {
        return undefined;
      }
      
      // Get complaint separately
      const complaint = await prisma.complaint.findUnique({
        where: { id: session.complaintId },
        select: { trackingNumber: true }
      });
      
      return complaint?.trackingNumber;
    } catch (error) {
      console.error('Error getting tracking number:', error);
      return undefined;
    }
  }
}
