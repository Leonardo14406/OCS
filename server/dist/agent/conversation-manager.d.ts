import { ConversationState } from '@prisma/client';
import { AgentMessage, AgentResponse } from '../types/agent.types';
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
export declare class ConversationManager {
    private greetingHandler;
    private identityHandler;
    private evidenceHandler;
    private classificationHandler;
    private submissionHandler;
    private trackingHandler;
    private genderCorrectionHandler;
    private ombudsmanAgent;
    constructor();
    processMessage(request: AgentRequest): Promise<LegacyAgentResponse>;
    processMessageWithMedia(agentMessage: AgentMessage): Promise<AgentResponse & {
        shouldAttachMedia?: boolean;
        trackingNumber?: string;
    }>;
    private extractLocationContext;
    private extractMediaContext;
    private getOrCreateSession;
    private updateSession;
    private isTrackingRequest;
    getSessionStatus(sessionId: string): Promise<any>;
    cleanupExpiredSessions(maxAgeHours?: number): Promise<number>;
    private isWithinCapabilities;
    private getTrackingNumber;
}
//# sourceMappingURL=conversation-manager.d.ts.map