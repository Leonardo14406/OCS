import { HandlerResponse } from './greeting-handler';
export declare class SubmissionHandler {
    private complaintsService;
    constructor();
    handle(sessionId: string, userMessage: string): Promise<HandlerResponse>;
    private determinePriority;
}
//# sourceMappingURL=submission-handler.d.ts.map