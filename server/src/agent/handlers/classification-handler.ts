import { prisma } from '../../lib/prisma';
import { ClassificationEngine } from '../../lib/ai/classification-core';
import { ConversationState } from '@prisma/client';
import { HandlerResponse } from './greeting-handler';

export class ClassificationHandler {
  private classificationEngine: ClassificationEngine;

  constructor() {
    this.classificationEngine = new ClassificationEngine();
  }

  async handle(sessionId: string, userMessage: string): Promise<HandlerResponse> {
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Use ClassificationEngine for final classification
    const ministries = [
      'Health', 'Education', 'Finance', 'Interior', 'Justice', 
      'Transport', 'Agriculture', 'Environment', 'Labor', 
      'Foreign Affairs', 'Defense', 'Social Welfare', 'Housing',
      'Energy', 'Communications', 'Tourism', 'Trade', 'Local Government'
    ];
    const categories = [
      'corruption', 'service_delivery', 'misconduct', 'negligence', 
      'discrimination', 'harassment', 'fraud', 'bureaucratic_delay',
      'policy_violation', 'ethical_breach', 'misappropriation', 'other'
    ];
    
    const classification = await this.classificationEngine.classify(
      session.description || '',
      ministries,
      categories
    );
    
    // Check if classification meets minimum requirements
    if (!classification.ministry || !classification.category || classification.confidence < 0.4) {
      return {
        message: "I'm sorry, but I couldn't classify your complaint with sufficient confidence. Could you please provide more details about which government ministry is involved and what type of issue you're experiencing?",
        nextState: ConversationState.error,
        shouldUpdateSession: false
      };
    }
    
    // Update session with final classification
    const updateData = {
      messageCount: session.messageCount + 1,
      classifiedMinistry: classification.ministry || session.ministry,
      classifiedCategory: classification.category || session.category,
      ministry: classification.ministry || session.ministry,
      category: classification.category || session.category
    };

    // Generate a summary for the user
    const summary = this.generateComplaintSummary(session, classification);

    return {
      message: `Perfect! I've reviewed and classified your complaint. Here's a summary:

${summary}

Does this look correct? If yes, I'll submit your complaint and you'll receive a tracking number. If anything needs to be changed, please let me know what should be corrected.`,
      nextState: ConversationState.submission,
      shouldUpdateSession: true,
      sessionData: updateData
    };
  }

  private generateComplaintSummary(session: any, classification: any): string {
    const parts = [];
    
    parts.push(`**Subject:** ${session.subject || 'Complaint submission'}`);
    parts.push(`**Ministry:** ${classification.ministry || 'To be determined'}`);
    parts.push(`**Category:** ${classification.category || 'General complaint'}`);
    
    if (session.incidentDate) {
      parts.push(`**Date of Incident:** ${session.incidentDate.toLocaleDateString()}`);
    }
    
    parts.push(`**Description:** ${session.description || 'No description provided'}`);
    
    return parts.join('\n');
  }
}
