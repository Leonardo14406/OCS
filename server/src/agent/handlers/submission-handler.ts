import { prisma } from '../../lib/prisma';
import { ConversationState, ComplaintStatus, ComplaintPriority, Gender } from '@prisma/client';
import { HandlerResponse } from './greeting-handler';
import { ComplaintsService, ComplaintSubmissionData } from '../../services/complaints.service';

export class SubmissionHandler {
  private complaintsService: ComplaintsService;

  constructor() {
    this.complaintsService = new ComplaintsService();
  }
  async handle(sessionId: string, userMessage: string): Promise<HandlerResponse> {
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const lowerMessage = userMessage.toLowerCase();
    
    // Check if user confirms submission
    if (lowerMessage.includes('yes') || lowerMessage.includes('correct') || 
        lowerMessage.includes('looks good') || lowerMessage.includes('submit')) {
      
      try {
        // Prepare complaint submission data
        const submissionData: ComplaintSubmissionData = {
          fullName: session.fullName,
          gender: session.gender,
          email: session.email || '',
          phone: session.phone || '',
          address: session.address,
          subject: session.subject || undefined,
          description: session.description || '',
          ministry: session.ministry || session.classifiedMinistry || 'Unknown',
          category: session.category || session.classifiedCategory || 'Other',
          incidentDate: session.incidentDate,
          isAnonymous: !session.fullName
        };

        // Validate submission data
        const validation = this.complaintsService.validateSubmissionData(submissionData);
        if (!validation.isValid) {
          return {
            message: `I need some additional information before submitting: ${validation.errors.join(', ')}. Let me help you fix this.`,
            nextState: ConversationState.complaint_collection,
            shouldUpdateSession: true,
            sessionData: { messageCount: session.messageCount + 1 }
          };
        }

        // Create the complaint using the service
        const complaint = await this.complaintsService.createComplaint(submissionData);

        // Update session with complaint ID and mark as completed
        await prisma.conversationSession.update({
          where: { sessionId },
          data: {
            complaintId: complaint.id,
            currentState: ConversationState.completed,
            completedAt: new Date(),
            messageCount: session.messageCount + 1
          }
        });

        const message = (session as any).hasEvidence ? 
          `Excellent! Your complaint has been successfully submitted. 

**Tracking Number:** ${complaint.trackingNumber}

You'll receive an email shortly with a secure link to upload your evidence. Please save your tracking number for future reference.

Your complaint will be reviewed by our team within 2-3 business days. You can check the status anytime using your tracking number.

Is there anything else I can help you with today?` :
          `Excellent! Your complaint has been successfully submitted. 

**Tracking Number:** ${complaint.trackingNumber}

Please save this tracking number for future reference. Your complaint will be reviewed by our team within 2-3 business days.

You can check the status of your complaint anytime by providing your tracking number. Is there anything else I can help you with today?`;

        return {
          message,
          nextState: ConversationState.completed,
          shouldUpdateSession: false // Already updated above
        };

      } catch (error) {
        console.error('Error submitting complaint:', error);
        
        // Mark session as error state
        await prisma.conversationSession.update({
          where: { sessionId },
          data: {
            currentState: ConversationState.error,
            errorReason: 'Database submission failed',
            messageCount: session.messageCount + 1
          }
        });

        return {
          message: "I apologize, but I encountered an error while submitting your complaint. Our technical team has been notified. Please try again in a few minutes, or contact our support team directly.",
          nextState: ConversationState.error,
          shouldUpdateSession: false
        };
      }
    }

    // If user wants to make changes
    if (lowerMessage.includes('no') || lowerMessage.includes('change') || 
        lowerMessage.includes('wrong') || lowerMessage.includes('correct')) {
      return {
        message: "I understand. What would you like to change? You can tell me to modify the subject, description, ministry, category, or any other detail.",
        nextState: ConversationState.complaint_collection,
        shouldUpdateSession: true,
        sessionData: { messageCount: session.messageCount + 1 }
      };
    }

    // Default response
    return {
      message: "Please confirm if you'd like me to submit this complaint by saying 'yes' or 'submit', or let me know what changes you'd like to make.",
      nextState: ConversationState.submission,
      shouldUpdateSession: true,
      sessionData: { messageCount: session.messageCount + 1 }
    };
  }

  
  private determinePriority(category?: string): ComplaintPriority {
    return this.complaintsService.determinePriority(category || '');
  }
}
