import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
export declare const trackingTools: ChatCompletionTool[];
export declare function getComplaintStatusHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function listUserComplaintsHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare const trackingToolHandlers: {
    get_complaint_status: typeof getComplaintStatusHandler;
    list_user_complaints: typeof listUserComplaintsHandler;
};
//# sourceMappingURL=tracking-tools.d.ts.map