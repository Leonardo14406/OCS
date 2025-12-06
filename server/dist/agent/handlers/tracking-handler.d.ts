import { HandlerResponse } from './greeting-handler';
export declare class TrackingHandler {
    private trackingService;
    constructor();
    handle(sessionId: string, userMessage: string): Promise<HandlerResponse>;
    private extractTrackingNumber;
}
//# sourceMappingURL=tracking-handler.d.ts.map