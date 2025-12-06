import { prisma } from '../../lib/prisma';
import { ConversationState } from '@prisma/client';
import { HandlerResponse } from './greeting-handler';
import { TrackingService } from '../../services/tracking.service';

export class TrackingHandler {
  private trackingService: TrackingService;

  constructor() {
    this.trackingService = new TrackingService();
  }
  async handle(sessionId: string, userMessage: string): Promise<HandlerResponse> {
    const trackingNumber = this.extractTrackingNumber(userMessage);
    
    if (!trackingNumber) {
      return {
        message: "To check your complaint status, please provide your tracking number. It should look like 'OMB-XXXX-YYYY'.",
        nextState: ConversationState.tracking,
        shouldUpdateSession: true,
        sessionData: { messageCount: 1 }
      };
    }

    try {
      // Use TrackingService for structured tracking
      const trackingResponse = await this.trackingService.trackComplaint({
        trackingNumber,
        includeHistory: true,
        includeEvidence: true
      });

      if (!trackingResponse.success) {
        // Handle different error types with appropriate user messages
        let nextState: ConversationState = ConversationState.tracking;
        
        if (trackingResponse.errorType === 'SYSTEM_ERROR') {
          nextState = ConversationState.error;
        }

        return {
          message: trackingResponse.message,
          nextState,
          shouldUpdateSession: true,
          sessionData: { 
            messageCount: 1,
            ...(nextState === ConversationState.error && { errorReason: 'Tracking service error' })
          }
        };
      }

      // Successful tracking response
      return {
        message: trackingResponse.message,
        nextState: ConversationState.completed,
        shouldUpdateSession: true,
        sessionData: { 
          messageCount: 1, 
          completedAt: new Date(),
          trackingResult: {
            trackingNumber: trackingResponse.trackingNumber,
            status: trackingResponse.status,
            ministry: trackingResponse.ministry,
            lastUpdated: trackingResponse.lastUpdated
          }
        }
      };

    } catch (error) {
      console.error('Error in TrackingHandler:', error);
      return {
        message: "I'm experiencing technical difficulties while tracking your complaint. Please try again later or contact our support team for assistance.",
        nextState: ConversationState.error,
        shouldUpdateSession: true,
        sessionData: { 
          messageCount: 1, 
          errorReason: 'Tracking handler error' 
        }
      };
    }
  }

  private extractTrackingNumber(message: string): string | null {
    const trackingRegex = /OMB-[A-Z0-9]+-[A-Z0-9]+/i;
    const match = message.match(trackingRegex);
    return match ? match[0].toUpperCase() : null;
  }
}
