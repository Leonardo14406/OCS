"use client";

import { useEffect, useRef, useState } from "react";

// The backend WebSocket server currently streams chunks shaped like:
// { delta?: string; done?: boolean; error?: string }
// and may later include richer envelopes. Treat messages as a flexible JSON blob.
export interface WebSocketMessage {
  [key: string]: any;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: string, media?: File[]) => Promise<void>;
  messages: WebSocketMessage[];
  error: string | null;
  sessionId: string | null;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        // result is a data URL like "data:...;base64,xxxx" – strip the prefix
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      } else {
        reject(new Error("Unexpected FileReader result"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        // First, get a session ID and websocket URL from our API route
        const sessionResponse = await fetch("/api/agent/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!sessionResponse.ok) {
          const data = await sessionResponse.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get session ID");
        }

        const sessionData = await sessionResponse.json();

        if (!sessionData.sessionId) {
          throw new Error("Failed to get session ID");
        }

        if (cancelled) return;

        setSessionId(sessionData.sessionId);

        const wsUrl: string = `${sessionData.websocketUrl || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"}?sessionId=${sessionData.sessionId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setIsConnected(true);
          setError(null);
          console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setMessages((prev) => [...prev, message]);
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          if (cancelled) return;
          setIsConnected(false);
          console.log("WebSocket disconnected");
        };

        ws.onerror = (event) => {
          if (cancelled) return;
          setError("WebSocket connection error");
          console.error("WebSocket error:", event);
        };
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Connection failed");
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = async (message: string, media?: File[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket is not connected");
      return;
    }

    const mediaPayload = media && media.length > 0
      ? await Promise.all(
          media.map(async (file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            data: await fileToBase64(file),
          }))
        )
      : undefined;

    const payload = {
      // The WebSocket gateway expects { sessionId, message, ...contexts }
      sessionId,
      message,
      media: mediaPayload,
    };

    wsRef.current.send(JSON.stringify(payload));
  };

  return {
    isConnected,
    sendMessage,
    messages,
    error,
    sessionId,
  };
};
