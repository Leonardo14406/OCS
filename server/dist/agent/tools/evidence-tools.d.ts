import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { ToolContext, ToolResult } from "./types";
export declare const evidenceTools: ChatCompletionTool[];
export declare function uploadEvidenceHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare function attachEvidenceToComplaintHandler(args: any, context: ToolContext): Promise<ToolResult>;
export declare const evidenceToolHandlers: {
    upload_evidence: typeof uploadEvidenceHandler;
    attach_evidence_to_complaint: typeof attachEvidenceToComplaintHandler;
};
//# sourceMappingURL=evidence-tools.d.ts.map