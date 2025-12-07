import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../lib/logger';
import { OmbudsmanAgent } from '../agent/ombudsman-agent';
import { WebSocketStreamHandler, WebSocketMessage } from './stream-handler';

export class WebSocketGateway {
  private wss: WebSocketServer;
  private streamHandler: WebSocketStreamHandler;

  constructor(agent: OmbudsmanAgent) {
    this.wss = new WebSocketServer({ noServer: true });
    this.streamHandler = new WebSocketStreamHandler(agent);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', (error: Error) => {
      logger.error({ error }, 'WebSocket server error');
    });
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const clientId = this.generateClientId();
    
    logger.info(
      { clientId, userAgent: request.headers['user-agent'] },
      'New WebSocket connection established'
    );

    // Set up connection-specific handlers
    ws.on('message', async (data: Buffer) => {
      await this.handleMessage(ws, data, clientId);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      logger.info(
        { clientId, code, reason: reason.toString() },
        'WebSocket connection closed'
      );
    });

    ws.on('error', (error: Error) => {
      logger.error(
        { clientId, error: error.message },
        'WebSocket connection error'
      );
    });

    // Send welcome message
    this.sendSafe(ws, {
      type: 'connected',
      clientId,
      message: 'WebSocket connection established. Send your message in format: { sessionId, message, ... }'
    });
  }

  private async handleMessage(ws: WebSocket, data: Buffer, clientId: string): Promise<void> {
    try {
      const messageStr = data.toString();
      logger.debug({ clientId, messageLength: messageStr.length }, 'Received WebSocket message');

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(messageStr);
      } catch (parseError) {
        this.sendSafe(ws, {
          type: 'error',
          message: 'Invalid JSON format'
        });
        return;
      }

      // Validate message structure
      if (!this.streamHandler.validateInitialMessage(parsedMessage)) {
        this.sendSafe(ws, {
          type: 'error',
          message: 'Invalid message format. Required: sessionId (string), message (string)'
        });
        return;
      }

      // Process the message through the stream handler
      await this.streamHandler.handleStreamMessage(ws, parsedMessage);

    } catch (error: any) {
      logger.error(
        { clientId, error: error.message },
        'Error handling WebSocket message'
      );

      this.sendSafe(ws, {
        type: 'error',
        message: 'Internal server error'
      });
    }
  }

  private sendSafe(ws: WebSocket, data: any): boolean {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        return true;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to send WebSocket message');
    }
    return false;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Method to handle WebSocket upgrade from HTTP server
  handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): void {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }

  // Graceful shutdown
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        logger.info({}, 'WebSocket server closed');
        resolve();
      });
    });
  }

  getStats() {
    return {
      connectedClients: this.wss.clients.size,
      serverState: 'running'
    };
  }
}
