import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
export declare const complaintTools: ChatCompletionTool[];
export declare function extractContactInfoHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function createComplaintHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function updateComplaintDetailsHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare const complaintToolHandlers: {
    extract_contact_info: typeof extractContactInfoHandler;
    create_complaint: typeof createComplaintHandler;
    update_complaint_details: typeof updateComplaintDetailsHandler;
};
//# sourceMappingURL=complaint-tools.d.ts.map