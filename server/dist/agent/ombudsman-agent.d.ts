import type { MediaContext } from "./tools/types";
interface LocationContext {
    hasLocation?: boolean;
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
}
export declare class OmbudsmanAgent {
    private openai;
    private prisma;
    private conversationHistory;
    private currentSessionId;
    private currentLocationContext?;
    private currentMediaContext?;
    private systemPrompt;
    constructor();
    private cleanupInactiveConversations;
    clearSession(sessionId: string): boolean;
    getActiveSessionsCount(): number;
    private getOrCreateConversation;
    initialize(): Promise<void>;
    processMessage(userMessage: string, sessionId: string, locationContext?: LocationContext, mediaContext?: MediaContext): Promise<string>;
    private getSessionData;
    private executeFunction;
}
export {};
//# sourceMappingURL=ombudsman-agent.d.ts.map