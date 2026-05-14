"use client";

import { useState } from "react";
import { Copy, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourceCard } from "./SourceCard";
import { StreamingMessage } from "./StreamingMessage";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { AnswerWithCitations } from "./AnswerWithCitations";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onSelectQuestion?: (question: string) => void;
  onOpenPDF?: (documentId: number, page: number, chunkId?: number) => void;
}

export function ChatMessage({
  message,
  isStreaming = false,
  onSelectQuestion,
  onOpenPDF,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSuggestedQuestions =
    !isUser &&
    message.suggestedQuestions &&
    message.suggestedQuestions.length > 0;
  const hasRawSources =
    !isUser && message.rawSources && message.rawSources.length > 0;
  // rawSources가 있으면 인라인 citation으로 출처 표시 → 하단 출처 카드 불필요
  // rawSources가 없는 레거시 메시지만 기존 하단 출처 카드 표시
  const showLegacySourceCards =
    !isUser && !hasRawSources && message.sources && message.sources.length > 0;

  const handleCopy = () => {
    // 복사 시 {{N}} 마커 제거
    const clean = message.content
      .replace(/\s*\{\{\d+\}\}\s*/g, " ")
      .replace(/\s+([.,!?])/g, "$1")
      .trim();
    navigator.clipboard.writeText(clean);
  };

  const renderContent = () => {
    if (isStreaming && !message.content) {
      return <StreamingMessage />;
    }
    if (!isUser && hasRawSources) {
      return (
        <AnswerWithCitations
          content={message.content}
          rawSources={message.rawSources!}
          onOpenPDF={onOpenPDF}
        />
      );
    }
    return message.content;
  };

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%]",
          isUser && "flex flex-col items-end",
        )}
      >
        {!isUser && message.confidence && (
          <div className="mb-1.5">
            <ConfidenceBadge level={message.confidence} />
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground",
          )}
        >
          {renderContent()}
        </div>

        {/* 레거시 메시지 (rawSources 없음) — 기존 하단 출처 카드 유지 */}
        {showLegacySourceCards && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setSourcesOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText className="size-3" />
              출처 {message.sources!.length}개
              {sourcesOpen ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>

            {sourcesOpen && (
              <div className="mt-2 flex flex-col gap-2">
                {message.sources!.map((source, idx) => (
                  <SourceCard
                    key={`${source.documentId}-${idx}`}
                    source={source}
                    index={idx}
                    onOpenPDF={onOpenPDF}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {hasSuggestedQuestions && onSelectQuestion && (
          <div className="mt-3">
            <SuggestedQuestions
              questions={message.suggestedQuestions!}
              onSelect={onSelectQuestion}
            />
          </div>
        )}

        {!isUser && (
          <div className="mt-2 flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="복사"
            >
              <Copy className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
