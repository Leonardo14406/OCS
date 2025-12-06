import { HandlerResponse } from './greeting-handler';
export declare class IdentityHandler {
    private nameProcessor;
    constructor();
    handle(sessionId: string, userMessage: string): Promise<HandlerResponse>;
    private extractEmail;
    private extractPhone;
    private extractName;
}
//# sourceMappingURL=identity-handler.d.ts.map