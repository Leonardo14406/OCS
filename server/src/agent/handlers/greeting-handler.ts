import { prisma } from '../../lib/prisma';
import { OpenAIClient } from '../../lib/ai/openai-client';
import { ConversationState, Gender } from '@prisma/client';

export interface HandlerResponse {
  message: string;
  nextState: ConversationState;
  shouldUpdateSession: boolean;
  sessionData?: Partial<any>;
}

export class GreetingHandler {
  private openaiClient: OpenAIClient;

  constructor() {
    this.openaiClient = new OpenAIClient();
  }

  async handle(sessionId: string, userMessage: string): Promise<HandlerResponse> {
    const session = await prisma.conversationSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Check if user is providing their name or wants to start
    const lowerMessage = userMessage.toLowerCase();
    
    // If user says they want to file a complaint, move to identity collection
    if (lowerMessage.includes('complaint') || lowerMessage.includes('report') || 
        lowerMessage.includes('file') || lowerMessage.includes('issue')) {
      return {
        message: "Hello! I'm Leoma, your AI assistant for the Ombudsman office. I'll help you file your complaint. To get started, could you please tell me your full name?",
        nextState: ConversationState.identity_collection,
        shouldUpdateSession: true,
        sessionData: { messageCount: session.messageCount + 1 }
      };
    }

    // If user provides their name, detect gender and move to identity collection
    if (this.looksLikeName(userMessage)) {
      const genderResult = await this.openaiClient.detectGender(userMessage);
      
      return {
        message: `Nice to meet you! I'm Leoma, your AI assistant for the Ombudsman office. I'll help you file your complaint. Could you please provide your email address and phone number?`,
        nextState: ConversationState.identity_collection,
        shouldUpdateSession: true,
        sessionData: {
          fullName: userMessage.trim(),
          detectedGender: genderResult.gender,
          messageCount: session.messageCount + 1
        }
      };
    }

    // Default greeting response
    return {
      message: "Hello! I'm Leoma, your AI assistant for the Ombudsman office. How can I help you today? You can tell me if you'd like to file a complaint, or ask me any questions about the process.",
      nextState: ConversationState.greeting,
      shouldUpdateSession: true,
      sessionData: { messageCount: session.messageCount + 1 }
    };
  }

  private looksLikeName(message: string): boolean {
    const trimmed = message.trim();
    const lowerMessage = message.toLowerCase();
    
    // Simple heuristics for name detection
    // 1-3 words, no numbers, no special characters, reasonable length
    const words = trimmed.split(/\s+/);
    
    if (words.length < 1 || words.length > 3) return false;
    if (/\d/.test(trimmed)) return false; // Contains numbers
    if (trimmed.length < 2 || trimmed.length > 50) return false;
    
    // Check if it contains common non-name words
    const nonNameWords = ['hello', 'hi', 'hey', 'help', 'complaint', 'report', 'file', 'issue', 'problem', 'assistant', 'leoma'];
    if (nonNameWords.some(word => lowerMessage.includes(word))) return false;
    
    return true;
  }
}
