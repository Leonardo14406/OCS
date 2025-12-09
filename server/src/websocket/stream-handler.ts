import { WebSocket } from 'ws';
import { OmbudsmanAgent } from '../agent/ombudsman-agent';
import { logger } from '../lib/logger';
import type { LocationContext, MediaContext } from '../agent/tools/types';

export interface WebSocketMessage {
  sessionId: string;
  userId?: string;
  message: string;
  locationContext?: LocationContext;
  mediaContext?: MediaContext;
  userName?: string;
  userEmail?: string;
}

export interface StreamChunk {
  delta?: string;
  done?: boolean;
  error?: string;
}

export class WebSocketStreamHandler {
  private agent: OmbudsmanAgent;

  constructor(agent: OmbudsmanAgent) {
    this.agent = agent;
  }

  async handleStreamMessage(
    ws: WebSocket,
    data: WebSocketMessage
  ): Promise<void> {
    const { sessionId, userId, message, locationContext, mediaContext, userName, userEmail } = data;

    try {
      logger.info(
        { sessionId, userId, userName, messageLength: message.length },
        'Starting WebSocket stream processing'
      );

      // Initialize agent if needed
      await this.agent.initialize();

      // Process the message and stream the response
      await this.streamAgentResponse(
        ws,
        message,
        sessionId,
        locationContext,
        mediaContext,
        userName,
        userEmail
      );

    } catch (error: any) {
      logger.error(
        { error: error.message, sessionId },
        'WebSocket stream processing failed'
      );

      // Send error to client
      this.sendChunk(ws, {
        error: `Processing failed: ${error.message}`,
        done: true
      });

      // Close connection on error
      ws.close(1011, 'Processing error');
    }
  }

  private async streamAgentResponse(
    ws: WebSocket,
    userMessage: string,
    sessionId: string,
    locationContext?: LocationContext,
    mediaContext?: MediaContext,
    userName?: string,
    userEmail?: string
  ): Promise<void> {
    try {
      // Get the agent's response
      const response = await this.agent.processMessage(
        userMessage,
        sessionId,
        locationContext,
        mediaContext,
        { userName, userEmail }
      );

      // Stream the response character by character for real-time effect
      await this.streamText(ws, response, sessionId);

    } catch (error: any) {
      logger.error(
        { error: error.message, sessionId },
        'Agent response generation failed'
      );

      this.sendChunk(ws, {
        error: `Agent error: ${error.message}`,
        done: true
      });
    }
  }

  private async streamText(ws: WebSocket, text: string, sessionId: string): Promise<void> {
    // For the citizen portal web UI, send the full response in a single
    // message to avoid visually duplicated-looking chunks on the client.
    const success = this.sendChunk(ws, { delta: text, done: true });

    if (!success) {
      logger.warn({ sessionId }, 'WebSocket connection closed while sending response');
    }
  }

  private sendChunk(ws: WebSocket, chunk: StreamChunk): boolean {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(chunk));
        return true;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to send WebSocket chunk');
    }
    return false;
  }

  validateInitialMessage(data: any): data is WebSocketMessage {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.sessionId === 'string' &&
      typeof data.message === 'string' &&
      data.message.length > 0
    );
  }
}
