import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
export declare const toolDefinitions: ChatCompletionTool[];
export declare function getOrCreateSessionHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function updateSessionDataHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function createComplaintHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function extractContactInfoHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function getComplaintStatusHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare const toolHandlers: {
    get_or_create_session: typeof getOrCreateSessionHandler;
    update_session_data: typeof updateSessionDataHandler;
    extract_contact_info: typeof extractContactInfoHandler;
    create_complaint: typeof createComplaintHandler;
    get_complaint_status: typeof getComplaintStatusHandler;
};
//# sourceMappingURL=consolidated-tools.d.ts.map