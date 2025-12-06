import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
export declare const classificationTools: ChatCompletionTool[];
export declare function classifyComplaintHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function getMinistryInfoHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare const classificationToolHandlers: {
    classify_complaint: typeof classifyComplaintHandler;
    get_ministry_info: typeof getMinistryInfoHandler;
};
//# sourceMappingURL=classification-tools.d.ts.map