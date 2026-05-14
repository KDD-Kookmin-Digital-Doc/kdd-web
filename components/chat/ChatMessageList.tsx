"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { StreamingMessage } from "./StreamingMessage";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isStreaming?: boolean;
  onSelectQuestion?: (question: string) => void;
  onOpenPDF?: (documentId: number, page: number, chunkId?: number) => void;
}

export function ChatMessageList({
  messages,
  isStreaming = false,
  onSelectQuestion,
  onOpenPDF,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  return (
    <div className="flex flex-col gap-6">
      {messages.map((message) => (
        <ChatMessage
          key={message.messageId}
          message={message}
          onSelectQuestion={onSelectQuestion}
          onOpenPDF={onOpenPDF}
        />
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-secondary">
            <StreamingMessage />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
