import { PrismaClient } from "@prisma/client";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface LocationContext {
  hasLocation?: boolean;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
}

export interface MediaContext {
  hasMedia?: boolean;
  data?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export interface ToolContext {
  prisma: PrismaClient;
  currentSessionId: string;
  currentLocationContext?: LocationContext;
  currentMediaContext?: MediaContext;
}

export interface ToolHandler {
  (args: any, context: ToolContext): Promise<any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
