# WebSocket Integration Guide for Next.js

This guide explains how to integrate the Citizen Interface WebSocket server with a Next.js frontend application.

## Overview

The Citizen Interface server now uses WebSockets for real-time communication instead of HTTP REST endpoints for chat functionality. This provides better performance, real-time updates, and a more responsive user experience.

## Server Setup

The WebSocket server runs on the same port as the HTTP server and handles WebSocket upgrade requests automatically.

### Environment Variables

```env
PORT=3000
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key
```

## Next.js Client Integration

### 1. Install Required Dependencies

```bash
npm install ws @types/ws
# or
yarn add ws @types/ws
```

### 2. Create WebSocket Hook

Create a custom hook for managing WebSocket connections:

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: 'message' | 'error' | 'status' | 'typing';
  data: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: string, media?: File[]) => void;
  messages: WebSocketMessage[];
  error: string | null;
  sessionId: string | null;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        // First, get a session ID
        const sessionResponse = await fetch('/api/agent/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.sessionId) {
          throw new Error('Failed to get session ID');
        }

        setSessionId(sessionData.sessionId);

        // Connect WebSocket
        const wsUrl = `${url}?sessionId=${sessionData.sessionId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
        };

        ws.onerror = (event) => {
          setError('WebSocket connection error');
          console.error('WebSocket error:', event);
        };

        return () => {
          ws.close();
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    };

    connect();
  }, [url]);

  const sendMessage = (message: string, media?: File[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        data: {
          message,
          sessionId,
          media: media ? media.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            // Convert file to base64 for transmission
            data: Buffer.from(new Uint8Array(await file.arrayBuffer())).toString('base64')
          })) : undefined
        }
      };
      
      wsRef.current.send(JSON.stringify(payload));
    } else {
      setError('WebSocket is not connected');
    }
  };

  return {
    isConnected,
    sendMessage,
    messages,
    error,
    sessionId
  };
};
```

### 3. Create Chat Component

```typescript
// components/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  media?: string[];
}

export const ChatInterface: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isConnected,
    sendMessage,
    messages,
    error,
    sessionId
  } = useWebSocket(`ws://localhost:3000`);

  // Process WebSocket messages
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.type === 'message') {
        const chatMsg: ChatMessage = {
          id: Date.now().toString(),
          content: msg.data.message,
          sender: 'agent',
          timestamp: new Date(),
          trackingNumber: msg.data.trackingNumber,
          state: msg.data.state
        };
        setChatMessages(prev => [...prev, chatMsg]);
      }
    });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      // Add user message to chat
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        content: inputMessage,
        sender: 'user',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMsg]);

      // Send message via WebSocket
      sendMessage(inputMessage, selectedFiles);
      
      // Clear input
      setInputMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Leoma AI Assistant</h2>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">Connected</span>
          ) : (
            <span className="disconnected">Connecting...</span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="chat-messages">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender}`}
          >
            <div className="message-content">
              {msg.content}
            </div>
            <div className="message-timestamp">
              {msg.timestamp.toLocaleTimeString()}
            </div>
            {msg.trackingNumber && (
              <div className="tracking-number">
                Tracking: {msg.trackingNumber}
              </div>
            )}
            {msg.state && (
              <div className="session-state">
                Status: {msg.state}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,application/pdf,.doc,.docx"
        />
        
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !inputMessage.trim()}
        >
          Send
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              {file.name} ({file.type})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 4. API Route for Session Creation (Next.js App Router)

```typescript
// app/api/agent/session/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the backend server
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    const response = await fetch(`${backendUrl}/api/agent/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Update WebSocket URL for client-side connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
    data.websocketUrl = wsUrl;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```

### 5. Environment Variables for Next.js

```env
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3000
BACKEND_URL=http://localhost:3000
```

## WebSocket Message Protocol

### Client to Server Messages

```typescript
interface ClientMessage {
  type: 'message';
  data: {
    message: string;
    sessionId: string;
    media?: {
      name: string;
      type: string;
      size: number;
      data: string; // base64 encoded
    }[];
  };
}
```

### Server to Client Messages

```typescript
interface ServerMessage {
  type: 'message' | 'error' | 'status' | 'typing';
  data: {
    message?: string;
    sessionId?: string;
    trackingNumber?: string;
    state?: string;
    error?: string;
    isTyping?: boolean;
  };
}
```

## Features

- **Real-time messaging**: Instant communication with the AI assistant
- **File upload support**: Send images, PDFs, and documents as evidence
- **Session management**: Persistent conversation state
- **Error handling**: Robust error recovery and reconnection
- **Connection status**: Visual feedback for connection state
- **Tracking numbers**: Get complaint tracking numbers for follow-up

## Deployment Considerations

1. **CORS Configuration**: Ensure your WebSocket server allows connections from your Next.js domain
2. **SSL/TLS**: Use `wss://` for production deployments
3. **Load Balancing**: Configure sticky sessions if using multiple server instances
4. **Rate Limiting**: Implement rate limiting on WebSocket connections
5. **Authentication**: Add JWT or session-based authentication if required

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check that the server is running and the URL is correct
2. **CORS Errors**: Verify CORS configuration on the server
3. **Session Issues**: Ensure session ID is properly passed in WebSocket URL
4. **File Upload Problems**: Check file size limits and supported formats

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=websocket:*
```

## Migration from HTTP REST

If you're migrating from the previous HTTP REST endpoints:

| Old Endpoint | WebSocket Equivalent |
|-------------|---------------------|
| POST /api/agent/message | WebSocket message with type 'message' |
| POST /api/agent/chat | WebSocket message with type 'message' |
| GET /api/agent/session/:id/status | WebSocket status messages |

The WebSocket approach provides better real-time capabilities and reduces server load compared to polling HTTP endpoints.
