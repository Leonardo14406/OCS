import OpenAI from "openai";
import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../lib/logger";
import { config } from "../lib/config";
import type { ToolContext, MediaContext } from "./tools/types";
import { toolDefinitions, toolHandlers } from "./tools/consolidated-tools";
import axios from "axios";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { ConversationState } from "@prisma/client";

interface ConversationHistory {
  messages: ChatCompletionMessageParam[];
  lastActivity: Date;
}

interface LocationContext {
  hasLocation?: boolean;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
}

interface SessionContext {
  sessionId: string;
  currentState: ConversationState;
  collectedData: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    ministry?: string;
    category?: string;
    subject?: string;
    description?: string;
    incidentDate?: Date;
    gender?: string;
  };
}

interface UserIdentity {
  userName?: string;
  userEmail?: string;
}

export class OmbudsmanAgent {
  private openai: OpenAI;
  private prisma: PrismaClient;
  private conversationHistory: Map<string, ConversationHistory>;
  private currentSessionId: string | null = null;
  private currentLocationContext?: LocationContext;
  private currentMediaContext?: MediaContext;
  private systemPrompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.prisma = new PrismaClient();
    this.conversationHistory = new Map();

    this.systemPrompt = `You are Leoma, an AI assistant for the Ombudsman office of Sierra Leone. Your role is to help citizens file complaints, track existing complaints, and provide information about the complaint process.

CRITICAL INTRODUCTION RULE:
For EVERY new conversation (first message from user), you MUST respond with this exact introduction and menu, regardless of what the user says:
"Hello! 🌟 I'm Leoma, your AI assistant for the Ombudsman office of Sierra Leone. I'm here to help you! 🤝

I can assist you with:

1. 📝 **File a Complaint** - Report issues with government services or officials
2. 🔍 **Track Existing Complaint** - Check the status of your submitted complaints  
3. 📚 **Get Information** - Learn about the Ombudsman process and procedures
4. ❓ **General Questions** - Answer any questions about filing complaints

How can I help you today? Just tell me what you need, and I'll guide you through it step by step. 😊"

After this introduction, continue the conversation naturally. NEVER repeat this menu unless the user asks for it again.

YOUR APPROACH:
You are a conversational, empathetic assistant who guides citizens naturally through their needs. Don't follow rigid scripts - adapt to each user's unique situation and flow naturally between tasks.

YOUR CAPABILITIES:
1. **File Complaints**: Guide citizens through the complaint filing process naturally
2. **Track Complaints**: Help citizens check the status of their existing complaints
3. **Provide Information**: Answer questions about the Ombudsman process and procedures
4. **Classify Issues**: Automatically categorize complaints and route to appropriate ministries
5. **Handle Evidence**: Process and attach supporting documents/photos to complaints
6. **Multi-task Handling**: Seamlessly switch between filing, tracking, and answering questions

NATURAL CONVERSATION FLOW:
- After the required introduction, listen carefully to understand the user's needs
- Guide them organically through the process without rigid scripts
- Collect information naturally as the conversation progresses
- Handle multiple requests in a single conversation
- Be flexible - users can jump between topics or change their mind
- Always stay empathetic, calm, and supportive
- Use simple English with optional light Krio phrases
- Maintain confidentiality and build trust

INFORMATION GATHERING STRATEGY:
- **Complaint description is REQUIRED** - this is the only essential field
- **Personal information is OPTIONAL** - name, contact details are optional
- **Evidence is OPTIONAL** - photos, documents are helpful but not required
- Gather information naturally without sounding like a rigid form
- If evidence or location would help, ask gently and explain why
- Allow anonymous complaints - users can file without personal info
- Always clarify which category and ministry a complaint belongs to

SUPPORTED COMPLAINT CATEGORIES:
- Corruption and bribery
- Misconduct and abuse of power
- Poor service delivery
- Discrimination and unfair treatment
- Human rights violations
- Financial irregularities
- Procurement issues
- Harassment and intimidation
- Negligence and dereliction of duty

MINISTRIES AND DEPARTMENTS:
- Ministry of Health and Sanitation
- Ministry of Education
- Ministry of Finance
- Ministry of Works and Infrastructure
- Ministry of Internal Affairs
- Sierra Leone Police
- Local Councils
- Public Service Commission
- Judiciary
- Other government agencies

RESPONSE STYLE:
- Always warm, friendly, and culturally aware
- Conversational and empathetic, never robotic
- Acknowledge emotions and show understanding
- Use simple English with optional light Krio (e.g., "How you dey?", "No wahala")
- Be patient and reassuring, especially with distressed users
- Maintain confidentiality and build trust
- Adapt tone to user's emotional state
- Use helpful emojis to appear friendly and approachable

LOCATION AND EVIDENCE SUPPORT:
- Users can share location when relevant to their complaint
- Accept photos, documents, and other evidence naturally
- Explain how location and evidence help investigations
- Make evidence collection feel supportive, not burdensome

TOOL USAGE:
- Use get_or_create_session to maintain conversation context
- Use update_session_data to save information as it's shared
- Use extract_contact_info to save phone numbers and optional email
- Use create_complaint when the user is ready to submit
- Use get_complaint_status for tracking inquiries
- Use classify_complaint to categorize issues automatically
- Use upload_evidence for document attachments

USER IDENTITY HANDLING:
- If you see [LOGGED_IN_USER: Name] in the context, the user is authenticated
- For logged-in users: Use their name automatically for the complaint - do NOT ask them for their name again
- For anonymous users ([ANONYMOUS_USER]): Ask ONCE if they want to provide a name or stay anonymous
- NEVER repeatedly ask for personal information - if the user says "no", "anonymous", or ignores the question, proceed without it

DECISIVE COMPLAINT SUBMISSION:
- Once you have a clear complaint description, IMMEDIATELY classify and submit it
- Do NOT ask for multiple confirmations like "are you sure?", "would you like to add anything else?", "shall I proceed?"
- One confirmation is enough: briefly summarize what you understood and submit
- If the user said "submit" or "yes" or confirmed in any way, call create_complaint immediately
- NEVER loop asking for the same information - if session data exists, use it

IMPORTANT RULES:
- ALWAYS start with the required introduction and menu for new conversations
- Always maintain confidentiality and privacy
- Never promise specific outcomes or timelines
- Be honest about process limitations
- Escalate serious allegations appropriately
- Document all interactions accurately
- Follow due process requirements
- Show empathy and cultural sensitivity
- Avoid sounding like a rigid form - be natural and conversational

KEY BEHAVIORS:
- Always start with the required introduction for new conversations
- Listen carefully to identify user intent
- Guide users through filing or tracking complaints naturally
- Focus on getting the complaint description first
- Validate feelings and show understanding
- Guide rather than command
- Be flexible with topic changes
- End with clear next steps and reassurance
- Always clarify category and ministry assignment

INTRODUCTION MENU:
When introducing yourself, always present this menu:
"Hello! I'm Leoma, your AI assistant for the Ombudsman office of Sierra Leone. I can help you with:

1. **File a Complaint** - Report issues with government services or officials
2. **Track Existing Complaint** - Check the status of your submitted complaints  
3. **Get Information** - Learn about the Ombudsman process and procedures
4. **General Questions** - Answer any questions about filing complaints

How can I help you today? Just tell me what you need, and I'll guide you through it step by step."

Remember: You are Leoma, a trusted guide helping citizens navigate the Ombudsman process. Be human, be helpful, be flexible.`;

    // Clean up inactive conversations every hour
    setInterval(() => {
      this.cleanupInactiveConversations();
    }, 60 * 60 * 1000);
  }

  private cleanupInactiveConversations() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    let cleaned = 0;
    for (const [sessionId, conversation] of this.conversationHistory.entries()) {
      if (conversation.lastActivity < twoHoursAgo) {
        logger.info({ sessionId, messageCount: conversation.messages.length }, "Cleaning up inactive conversation");
        this.conversationHistory.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned, remaining: this.conversationHistory.size }, "Cleanup completed");
    }
  }

  public clearSession(sessionId: string): boolean {
    const deleted = this.conversationHistory.delete(sessionId);
    if (deleted) {
      logger.info({ sessionId }, "Cleared session conversation history");
    }
    return deleted;
  }

  public getActiveSessionsCount(): number {
    return this.conversationHistory.size;
  }

  private getOrCreateConversation(sessionId: string): ChatCompletionMessageParam[] {
    const existing = this.conversationHistory.get(sessionId);

    if (existing) {
      existing.lastActivity = new Date();
      logger.info({ sessionId, messageCount: existing.messages.length }, "Reusing existing conversation");
      return existing.messages;
    }

    const messages: ChatCompletionMessageParam[] = [{ role: "system", content: this.systemPrompt }];

    this.conversationHistory.set(sessionId, {
      messages,
      lastActivity: new Date(),
    });

    logger.info({ sessionId }, "Created new conversation for session");
    return messages;
  }

  async initialize() {
    logger.info({ model: config.openai.model }, "Ombudsman Agent initialized");
  }

  async processMessage(
    userMessage: string,
    sessionId: string,
    locationContext?: LocationContext,
    mediaContext?: MediaContext,
    userIdentity?: UserIdentity
  ): Promise<string> {
    try {
      if (!sessionId || sessionId.trim() === '') {
        logger.error({ sessionId, userMessage: userMessage?.substring(0, 50) }, "processMessage: sessionId is required");
        return "I apologize, but I encountered an error. Please try again later.";
      }

      if (!userMessage || userMessage.trim() === '') {
        logger.warn({ sessionId }, "processMessage: empty user message received");
        userMessage = "Hello";
      }

      logger.info(
        {
          userMessage: userMessage.substring(0, 100),
          sessionId,
          hasLocation: !!locationContext?.hasLocation,
          hasMedia: !!mediaContext?.hasMedia,
        },
        "Processing user message"
      );

      this.currentSessionId = sessionId;
      this.currentLocationContext = locationContext;
      this.currentMediaContext = mediaContext;

      const messages = this.getOrCreateConversation(sessionId);

      // Get current session state from database
      const sessionData = await this.getSessionData(sessionId);

      if (!sessionData) {
        logger.warn({ sessionId }, "Session not found in database, will create during processing");
      }

      // -----------------------------------------------------------
      // ENFORCE FIRST MESSAGE INTRODUCTION LOGIC
      // -----------------------------------------------------------

      // If this is a new conversation (no DB session OR state = greeting)  
      // AND the user hasn't been greeted yet in this runtime session:
      const history = this.conversationHistory.get(sessionId);

      if (
        (!sessionData || sessionData.currentState === ConversationState.greeting) &&
        history &&
        history.messages.length === 1 // Only system prompt exists
      ) {
        // Personalize greeting for logged-in users
        const greeting = userIdentity?.userName
          ? `Hello, ${userIdentity.userName}! 🌟`
          : `Hello! 🌟`;

        const introMessage = `${greeting} I'm Leoma, your AI assistant for the Ombudsman office of Sierra Leone. I'm here to help you! 🤝

      I can assist you with:

      1. 📝 **File a Complaint** - Report issues with government services or officials
      2. 🔍 **Track Existing Complaint** - Check the status of your submitted complaints
      3. 📚 **Get Information** - Learn about the Ombudsman process and procedures
      4. ❓ **General Questions** - Answer any questions about filing complaints

      How can I help you today? Just tell me what you need, and I'll guide you through it step by step. 😊`;

        // Save into conversation history
        history.messages.push({
          role: "assistant",
          content: introMessage,
        });

        // Immediately return the intro (do NOT call OpenAI yet)
        return introMessage;
      }

      let contextualMessage = `[Session: ${sessionId}]`;
      contextualMessage += `\n[Conversation Context: ${sessionData?.currentState || 'new_conversation'}]`;

      // Include user identity context for the AI
      if (userIdentity?.userName) {
        contextualMessage += `\n[LOGGED_IN_USER: ${userIdentity.userName}${userIdentity.userEmail ? ` (${userIdentity.userEmail})` : ''}]`;
      } else {
        contextualMessage += `\n[ANONYMOUS_USER: User is not logged in]`;
      }

      if (locationContext?.hasLocation && locationContext.latitude && locationContext.longitude) {
        contextualMessage += `\n[LOCATION_SHARED: ${locationContext.latitude}, ${locationContext.longitude}${locationContext.locationDescription ? ` - ${locationContext.locationDescription}` : ""}]`;
      }

      if (mediaContext?.hasMedia && mediaContext.data) {
        contextualMessage += `\n[MEDIA_ATTACHED: ${mediaContext.filename}, ${mediaContext.mimeType}]`;
      }

      contextualMessage += `\n\n${userMessage}`;

      messages.push({
        role: "user",
        content: contextualMessage,
      });

      // Validate OpenAI API key
      if (!config.openai.apiKey || config.openai.apiKey.trim() === '') {
        logger.error({ sessionId }, "OpenAI API key is not configured");
        return "I apologize, but the AI service is not properly configured. Please contact support.";
      }

      logger.info({ sessionId, messageCount: messages.length, model: config.openai.model }, "Calling OpenAI API");

      let completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: messages,
        tools: toolDefinitions as ChatCompletionTool[],
        temperature: 0.7,
      });

      let loopCount = 0;
      const maxLoops = 10;

      while (completion.choices[0].finish_reason === "tool_calls" && loopCount < maxLoops) {
        loopCount++;
        const assistantMessage = completion.choices[0].message;

        messages.push(assistantMessage);

        logger.info(
          {
            toolCallsCount: assistantMessage.tool_calls?.length,
            loopCount,
          },
          "Processing tool calls"
        );

        const toolResults = await Promise.all(
          (assistantMessage.tool_calls || []).map(async (toolCall) => {
            if (toolCall.type === "function") {
              let args;
              try {
                args = JSON.parse(toolCall.function.arguments);
              } catch (error) {
                logger.error({ error, args: toolCall.function.arguments }, "Failed to parse tool arguments");
                return {
                  role: "tool" as const,
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({
                    success: false,
                    error: "Invalid tool arguments format",
                  }),
                };
              }

              const result = await this.executeFunction(toolCall.function.name, args);

              return {
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              };
            }
            return null;
          })
        );

        messages.push(...(toolResults.filter((r) => r !== null) as ChatCompletionMessageParam[]));

        completion = await this.openai.chat.completions.create({
          model: config.openai.model,
          messages: messages,
          tools: toolDefinitions as ChatCompletionTool[],
          temperature: 0.7,
        });
      }

      if (loopCount >= maxLoops) {
        logger.error({ sessionId, loopCount }, "Max tool call loops reached");
        return "Sorry, the request is taking too long. Please try again.";
      }

      const finalMessage = completion.choices[0].message;

      if (finalMessage.content) {
        messages.push({
          role: "assistant",
          content: finalMessage.content,
        });

        logger.info(
          {
            sessionId,
            responseLength: finalMessage.content.length,
            totalMessages: messages.length,
          },
          "Returning assistant response"
        );

        return finalMessage.content;
      }

      logger.warn({ sessionId, finishReason: completion.choices[0].finish_reason }, "No valid assistant response");
      return "Sorry, I encountered an issue processing your request. Please try again.";
    } catch (error: any) {
      const errorDetails = {
        error: error.message,
        stack: error.stack,
        sessionId,
        errorName: error.name,
        errorCode: error.code,
        errorStatus: error.status,
        errorResponse: error.response?.data || error.response || undefined
      };

      logger.error(errorDetails, "Error processing message in OmbudsmanAgent");

      // Provide more specific error messages based on error type
      if (error.status === 401 || error.message?.includes('API key')) {
        return "I apologize, but there's an authentication issue with the AI service. Please contact support.";
      } else if (error.status === 429 || error.message?.includes('rate limit')) {
        return "I apologize, but the service is currently busy. Please try again in a moment.";
      } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        return "I apologize, but the request timed out. Please try again.";
      } else if (error.message?.includes('network') || error.code === 'ECONNREFUSED') {
        return "I apologize, but there's a network issue. Please try again later.";
      }

      return "Sorry, I encountered an error. Please try again later.";
    }
  }

  private async getSessionData(sessionId: string): Promise<SessionContext | null> {
    try {
      if (!sessionId || sessionId.trim() === '') {
        logger.warn({ sessionId }, "getSessionData: empty sessionId provided");
        return null;
      }

      const session = await this.prisma.conversationSession.findUnique({
        where: { sessionId }
      });

      if (!session) {
        logger.info({ sessionId }, "Session not found in database (this is OK for new sessions)");
        return null;
      }

      return {
        sessionId: session.sessionId,
        currentState: session.currentState,
        collectedData: {
          fullName: session.fullName || undefined,
          email: session.email || undefined,
          phone: session.phone || undefined,
          address: session.address || undefined,
          ministry: session.ministry || undefined,
          category: session.category || undefined,
          subject: session.subject || undefined,
          description: session.description || undefined,
          incidentDate: session.incidentDate || undefined,
          gender: session.gender || undefined,
        }
      };
    } catch (error: any) {
      logger.error({
        error: error.message,
        stack: error.stack,
        sessionId,
        errorCode: error.code,
        errorName: error.name
      }, "Failed to get session data from database");
      return null;
    }
  }

  private async executeFunction(functionName: string, args: any): Promise<any> {
    logger.info({ functionName, args }, "Executing function");

    try {
      const handler = toolHandlers[functionName as keyof typeof toolHandlers];

      if (!handler) {
        logger.error({ functionName }, "Unknown function called");
        return {
          success: false,
          error: "Unknown function",
          message: "Sorry, that operation is not available.",
        };
      }

      const context: ToolContext = {
        prisma: this.prisma,
        currentSessionId: this.currentSessionId || "",
        currentLocationContext: this.currentLocationContext,
        currentMediaContext: this.currentMediaContext,
      };

      const result = await handler(args, context);

      logger.info({ functionName, success: result.success }, "Function executed");
      return result;
    } catch (error: any) {
      logger.error({ error, functionName, args }, "Function execution error");
      return {
        success: false,
        error: error.message,
        message: "Unable to complete this operation at this time.",
      };
    }
  }
}
