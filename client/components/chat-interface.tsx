"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  trackingNumber?: string;
  state?: string;
}

interface ChatInterfaceProps {
  onCompleted?: (trackingNumber: string) => void;
  userName?: string | null;
  userEmail?: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onCompleted, userName: propsUserName, userEmail }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { isConnected, sendMessage, messages, error, sessionId, userName } = useWebSocket({
    userName: propsUserName,
    userEmail,
  });

  // Scroll to bottom when chatMessages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Process WebSocket messages from the server
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const latest = messages[messages.length - 1];

    // Case 1: Streaming chunks from WebSocketStreamHandler: { delta?, done?, error? }
    if (typeof latest === "object" && ("delta" in latest || "done" in latest || "error" in latest)) {
      if (latest.error) {
        const chatMsg: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: String(latest.error),
          sender: "agent",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, chatMsg]);
        return;
      }

      if (latest.delta) {
        setChatMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];

          if (last && last.sender === "agent") {
            // Append to existing agent message
            last.content = `${last.content}${latest.delta}`;
          } else {
            // Start a new agent message
            updated.push({
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              content: latest.delta,
              sender: "agent",
              timestamp: new Date(),
            });
          }

          return updated;
        });
      }

      // latest.done indicates end of current response; we don't need extra handling here
      return;
    }

    // Case 2: Future-proof: envelope style { type: 'message', data: { message, trackingNumber, state } }
    if (latest && typeof latest === "object" && latest.type === "message") {
      const trackingNumber: string | undefined = latest.data?.trackingNumber;
      const state: string | undefined = latest.data?.state;

      const chatMsg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: latest.data?.message ?? "",
        sender: "agent",
        timestamp: new Date(),
        trackingNumber,
        state,
      };

      setChatMessages((prev) => [...prev, chatMsg]);

      if (state === "completed" && trackingNumber && onCompleted) {
        onCompleted(trackingNumber);
      }
    }
  }, [messages, onCompleted]);

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !isConnected) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    await sendMessage(trimmed, selectedFiles);

    setInputMessage("");
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  return (
    <Card className="flex max-h-[70vh] flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Leoma AI Complaint Assistant</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chat with an AI agent to file and refine your complaint in real time.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="text-xs text-muted-foreground">Session</div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Connected" : "Connecting..."}
            </Badge>
          </div>
          {sessionId && (
            <div className="text-[10px] text-muted-foreground max-w-[180px] truncate">
              ID: {sessionId}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className="flex-1 space-y-3 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {chatMessages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground text-xs">
              Start by describing your situation or concern. The AI assistant will guide you step by step to file a
              formal complaint.
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background border rounded-bl-none"
                  }`}
              >
                <div className="text-xs mb-1 opacity-75">
                  {msg.sender === "user" ? "You" : "Leoma AI"}
                </div>
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span>{msg.timestamp.toLocaleTimeString()}</span>
                  <div className="flex gap-2">
                    {msg.trackingNumber && <span>Tracking: {msg.trackingNumber}</span>}
                    {msg.state && <span>Status: {msg.state}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {selectedFiles.length > 0 && (
          <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
            <div className="mb-1 font-medium">Attached files</div>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <span key={`${file.name}-${index}`} className="rounded bg-muted px-2 py-1">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              ))}
            </div>
          </div>
        )}

        <form
          className="flex flex-col gap-2 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMessage();
          }}
        >
          <div className="flex gap-2">
            <Input
              placeholder={isConnected ? "Describe your situation..." : "Connecting to assistant..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
            />
            <Button type="submit" disabled={!isConnected || !inputMessage.trim()}>
              {isConnected ? (
                "Send"
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="text-xs"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              <span>Optional: attach evidence or supporting documents.</span>
            </div>
            <span>Press Enter to send.</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
