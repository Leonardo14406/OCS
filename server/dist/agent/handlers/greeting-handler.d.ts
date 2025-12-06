import { ConversationState } from '@prisma/client';
export interface HandlerResponse {
    message: string;
    nextState: ConversationState;
    shouldUpdateSession: boolean;
    sessionData?: Partial<any>;
}
export declare class GreetingHandler {
    private openaiClient;
    constructor();
    handle(sessionId: string, userMessage: string): Promise<HandlerResponse>;
    private looksLikeName;
}
//# sourceMappingURL=greeting-handler.d.ts.map