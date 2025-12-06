"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmbudsmanAgent = void 0;
const openai_1 = __importDefault(require("openai"));
const client_1 = require("@prisma/client");
const logger_1 = require("../lib/logger");
const config_1 = require("../lib/config");
const consolidated_tools_1 = require("./tools/consolidated-tools");
class OmbudsmanAgent {
    constructor() {
        this.currentSessionId = null;
        this.openai = new openai_1.default({
            apiKey: config_1.config.openai.apiKey,
        });
        this.prisma = new client_1.PrismaClient();
        this.conversationHistory = new Map();
        this.systemPrompt = `You are Leoma, an AI assistant for the Ombudsman office of Sierra Leone. Your role is to help citizens file complaints, track existing complaints, and provide information about the complaint process.

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
- Start with a warm, personal introduction as Leoma
- Listen to the user's story and identify their primary needs
- Guide them organically through the process without rigid steps
- Collect information naturally as the conversation progresses
- Handle multiple requests in a single conversation (e.g., file a complaint AND ask questions)
- Be flexible - users can jump between topics, change their mind, or ask clarifying questions

INFORMATION GATHERING STRATEGY:
- Collect personal details when relevant to the conversation (name is optional)
- Ask for complaint details as the user shares their story
- Request evidence when it would strengthen their case
- Don't force specific order - adapt to what the user shares
- Use tools to progressively build the complaint record
- Allow anonymous complaints - users can file without providing personal information
- Focus on gathering essential details: description and ministry/department involved

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
- Conversational and empathetic, not robotic
- Acknowledge emotions and show understanding
- Use simple, clear English with some Krio where appropriate
- Be patient and reassuring, especially with distressed users
- Maintain confidentiality and build trust
- Adapt tone to user's emotional state

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

IMPORTANT RULES:
- Always maintain confidentiality and privacy
- Never promise specific outcomes or timelines
- Be honest about process limitations
- Escalate serious allegations appropriately
- Document all interactions accurately
- Follow due process requirements
- Show empathy and cultural sensitivity

KEY BEHAVIORS:
- Start each conversation by introducing yourself as Leoma
- Ask open-ended questions to understand the user's situation
- Validate their feelings and concerns
- Guide rather than command
- Be flexible if users want to change topics or approaches
- End conversations with clear next steps and reassurance

Remember: You are Leoma, a trusted guide helping citizens navigate the Ombudsman process. Be human, be helpful, be flexible.`;
        // Clean up inactive conversations every hour
        setInterval(() => {
            this.cleanupInactiveConversations();
        }, 60 * 60 * 1000);
    }
    cleanupInactiveConversations() {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        let cleaned = 0;
        for (const [sessionId, conversation] of this.conversationHistory.entries()) {
            if (conversation.lastActivity < twoHoursAgo) {
                logger_1.logger.info({ sessionId, messageCount: conversation.messages.length }, "Cleaning up inactive conversation");
                this.conversationHistory.delete(sessionId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger_1.logger.info({ cleaned, remaining: this.conversationHistory.size }, "Cleanup completed");
        }
    }
    clearSession(sessionId) {
        const deleted = this.conversationHistory.delete(sessionId);
        if (deleted) {
            logger_1.logger.info({ sessionId }, "Cleared session conversation history");
        }
        return deleted;
    }
    getActiveSessionsCount() {
        return this.conversationHistory.size;
    }
    getOrCreateConversation(sessionId) {
        const existing = this.conversationHistory.get(sessionId);
        if (existing) {
            existing.lastActivity = new Date();
            logger_1.logger.info({ sessionId, messageCount: existing.messages.length }, "Reusing existing conversation");
            return existing.messages;
        }
        const messages = [{ role: "system", content: this.systemPrompt }];
        this.conversationHistory.set(sessionId, {
            messages,
            lastActivity: new Date(),
        });
        logger_1.logger.info({ sessionId }, "Created new conversation for session");
        return messages;
    }
    async initialize() {
        logger_1.logger.info({ model: config_1.config.openai.model }, "Ombudsman Agent initialized");
    }
    async processMessage(userMessage, sessionId, locationContext, mediaContext) {
        try {
            logger_1.logger.info({
                userMessage: userMessage.substring(0, 100),
                sessionId,
                hasLocation: !!locationContext?.hasLocation,
                hasMedia: !!mediaContext?.hasMedia,
            }, "Processing user message");
            this.currentSessionId = sessionId;
            this.currentLocationContext = locationContext;
            this.currentMediaContext = mediaContext;
            const messages = this.getOrCreateConversation(sessionId);
            // Get current session state from database
            const sessionData = await this.getSessionData(sessionId);
            let contextualMessage = `[Session: ${sessionId}]`;
            contextualMessage += `\n[Conversation Context: ${sessionData?.currentState || 'new_conversation'}]`;
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
            let completion = await this.openai.chat.completions.create({
                model: config_1.config.openai.model,
                messages: messages,
                tools: consolidated_tools_1.toolDefinitions,
                temperature: 0.7,
            });
            let loopCount = 0;
            const maxLoops = 10;
            while (completion.choices[0].finish_reason === "tool_calls" && loopCount < maxLoops) {
                loopCount++;
                const assistantMessage = completion.choices[0].message;
                messages.push(assistantMessage);
                logger_1.logger.info({
                    toolCallsCount: assistantMessage.tool_calls?.length,
                    loopCount,
                }, "Processing tool calls");
                const toolResults = await Promise.all((assistantMessage.tool_calls || []).map(async (toolCall) => {
                    if (toolCall.type === "function") {
                        let args;
                        try {
                            args = JSON.parse(toolCall.function.arguments);
                        }
                        catch (error) {
                            logger_1.logger.error({ error, args: toolCall.function.arguments }, "Failed to parse tool arguments");
                            return {
                                role: "tool",
                                tool_call_id: toolCall.id,
                                content: JSON.stringify({
                                    success: false,
                                    error: "Invalid tool arguments format",
                                }),
                            };
                        }
                        const result = await this.executeFunction(toolCall.function.name, args);
                        return {
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(result),
                        };
                    }
                    return null;
                }));
                messages.push(...toolResults.filter((r) => r !== null));
                completion = await this.openai.chat.completions.create({
                    model: config_1.config.openai.model,
                    messages: messages,
                    tools: consolidated_tools_1.toolDefinitions,
                    temperature: 0.7,
                });
            }
            if (loopCount >= maxLoops) {
                logger_1.logger.error({ sessionId, loopCount }, "Max tool call loops reached");
                return "Sorry, the request is taking too long. Please try again.";
            }
            const finalMessage = completion.choices[0].message;
            if (finalMessage.content) {
                messages.push({
                    role: "assistant",
                    content: finalMessage.content,
                });
                logger_1.logger.info({
                    sessionId,
                    responseLength: finalMessage.content.length,
                    totalMessages: messages.length,
                }, "Returning assistant response");
                return finalMessage.content;
            }
            logger_1.logger.warn({ sessionId, finishReason: completion.choices[0].finish_reason }, "No valid assistant response");
            return "Sorry, I encountered an issue processing your request. Please try again.";
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, stack: error.stack, sessionId }, "Error processing message");
            return "Sorry, I encountered an error. Please try again later.";
        }
    }
    async getSessionData(sessionId) {
        try {
            const session = await this.prisma.conversationSession.findUnique({
                where: { sessionId }
            });
            if (!session) {
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
        }
        catch (error) {
            logger_1.logger.error({ error, sessionId }, "Failed to get session data");
            return null;
        }
    }
    async executeFunction(functionName, args) {
        logger_1.logger.info({ functionName, args }, "Executing function");
        try {
            const handler = consolidated_tools_1.toolHandlers[functionName];
            if (!handler) {
                logger_1.logger.error({ functionName }, "Unknown function called");
                return {
                    success: false,
                    error: "Unknown function",
                    message: "Sorry, that operation is not available.",
                };
            }
            const context = {
                prisma: this.prisma,
                currentSessionId: this.currentSessionId || "",
                currentLocationContext: this.currentLocationContext,
                currentMediaContext: this.currentMediaContext,
            };
            const result = await handler(args, context);
            logger_1.logger.info({ functionName, success: result.success }, "Function executed");
            return result;
        }
        catch (error) {
            logger_1.logger.error({ error, functionName, args }, "Function execution error");
            return {
                success: false,
                error: error.message,
                message: "Unable to complete this operation at this time.",
            };
        }
    }
}
exports.OmbudsmanAgent = OmbudsmanAgent;
//# sourceMappingURL=ombudsman-agent.js.map