import { prisma } from '../../lib/prisma';
import { NameProcessor } from '../../lib/utils/name-processor';
import { Gender, ConversationState } from '@prisma/client';
import { HandlerResponse } from './greeting-handler';

export class GenderCorrectionHandler {
  private nameProcessor: NameProcessor;

  constructor() {
    this.nameProcessor = new NameProcessor();
  }

  /**
   * Handle gender correction from user
   */
  async handleGenderCorrection(sessionId: string, correctedGender: Gender): Promise<HandlerResponse> {
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get the corrected gender detection result
    const correctedResult = await this.nameProcessor.correctGender(
      session.fullName || 'User',
      correctedGender
    );

    // Update session with corrected gender
    const updateData = {
      gender: correctedGender,
      messageCount: session.messageCount + 1
    };

    // Generate apology message
    const apologyMessage = this.nameProcessor.generateMisgenderingApology(correctedGender);

    return {
      message: apologyMessage,
      nextState: session.currentState, // Stay in current state
      shouldUpdateSession: true,
      sessionData: updateData
    };
  }

  /**
   * Check if message contains gender correction
   */
  isGenderCorrection(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const correctionPatterns = [
      'i am', 'i\'m', 'my gender is', 'i identify as',
      'actually i\'m', 'actually i am', 'i\'m actually',
      'i\'m a', 'i am a', 'call me', 'refer to me'
    ];

    const genderKeywords = [
      'male', 'female', 'man', 'woman', 'guy', 'girl',
      'he', 'him', 'his', 'she', 'her', 'hers',
      'they', 'them', 'their', 'non-binary', 'nonbinary'
    ];

    // Check if message contains correction pattern + gender keyword
    const hasCorrectionPattern = correctionPatterns.some(pattern => 
      lowerMessage.includes(pattern)
    );

    const hasGenderKeyword = genderKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    return hasCorrectionPattern && hasGenderKeyword;
  }

  /**
   * Extract corrected gender from message
   */
  extractCorrectedGender(message: string): Gender | null {
    const lowerMessage = message.toLowerCase();

    // Map various gender expressions to standard values
    const genderMap: { [key: string]: Gender } = {
      'male': 'male',
      'man': 'male',
      'guy': 'male',
      'he': 'male',
      'him': 'male',
      'his': 'male',
      'female': 'female',
      'woman': 'female',
      'girl': 'female',
      'she': 'female',
      'her': 'female',
      'hers': 'female',
      'they': 'other',
      'them': 'other',
      'their': 'other',
      'non-binary': 'other',
      'nonbinary': 'other',
      'prefer not to say': 'prefer_not_to_say',
      'undisclosed': 'prefer_not_to_say'
    };

    for (const [key, value] of Object.entries(genderMap)) {
      if (lowerMessage.includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Process message and handle gender correction if detected
   */
  async processMessage(sessionId: string, message: string): Promise<HandlerResponse | null> {
    if (!this.isGenderCorrection(message)) {
      return null;
    }

    const correctedGender = this.extractCorrectedGender(message);
    if (!correctedGender) {
      return null;
    }

    return await this.handleGenderCorrection(sessionId, correctedGender);
  }
}
