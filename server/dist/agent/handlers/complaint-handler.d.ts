import { HandlerResponse } from './greeting-handler';
export declare class ComplaintHandler {
    private openaiClient;
    constructor();
    handle(sessionId: string, userMessage: string): Promise<HandlerResponse>;
    private extractDate;
}
//# sourceMappingURL=complaint-handler.d.ts.map