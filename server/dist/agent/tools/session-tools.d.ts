import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
export declare const getSessionOrCreateTool: ChatCompletionTool[];
export declare function getOrCreateSessionHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function updateSessionDataHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function getSessionStatusHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare const sessionToolHandlers: {
    get_or_create_session: typeof getOrCreateSessionHandler;
    update_session_data: typeof updateSessionDataHandler;
    get_session_status: typeof getSessionStatusHandler;
};
//# sourceMappingURL=session-tools.d.ts.map