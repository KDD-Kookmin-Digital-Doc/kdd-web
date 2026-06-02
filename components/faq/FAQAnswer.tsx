"use client";

import { useState } from "react";
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SourceCard } from "@/components/chat/SourceCard";
import { startFaqChat } from "@/lib/api/services/faq.service";
import { useChatContext } from "@/components/chat/ChatContext";
import type { Source } from "@/types/chat";

interface FAQAnswerProps {
  answer: string;
  faqId: string;
  question: string;
  feedback: "up" | "down" | null;
  onFeedback: (faqId: string, type: "up" | "down") => void;
  onOpenPDF?: (documentId: number, page: number) => void;
  upCount?: number;
  downCount?: number;
  sources?: Source[];
}

export function FAQAnswer({
  answer,
  faqId,
  question,
  feedback,
  onFeedback,
  onOpenPDF,
  upCount = 0,
  downCount = 0,
  sources,
}: FAQAnswerProps) {
  const router = useRouter();
  const { addChat } = useChatContext();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleContinueChat = async () => {
    if (isStartingChat) return;
    setIsStartingChat(true);

    try {
      const res = await startFaqChat(faqId);
      // 사이드바에 새 세션 추가
      addChat(res.sessionId, question);
      // FAQ 초기 메시지를 쿼리 파라미터로 전달하여 채팅방에서 바로 렌더링
      router.push(`/chat/${res.sessionId}?source=faq`);
    } catch {
      // 실패 시 기존 동작으로 폴백 (질문 prefill)
      router.push(`/chat?q=${encodeURIComponent(question)}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
        <Sparkles className="size-3.5" />
        AI 생성 답변
      </div>
      <p className="text-sm leading-relaxed text-foreground">{answer}</p>
      {sources && sources.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            참고 문서
          </p>
          <div className="flex flex-col gap-2">
            {sources.map((source, idx) => (
              <SourceCard
                key={`${source.documentId}-${source.page}`}
                source={source}
                index={idx}
                onOpenPDF={onOpenPDF}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">
          이 답변이 도움이 되었나요?
        </span>
        <button
          type="button"
          onClick={() => onFeedback(faqId, "up")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
            feedback === "up"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
          aria-label="도움이 됨"
        >
          <ThumbsUp className="size-3.5" />
          <span>{upCount}</span>
        </button>
        <button
          type="button"
          onClick={() => onFeedback(faqId, "down")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
            feedback === "down"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
          aria-label="도움이 안 됨"
        >
          <ThumbsDown className="size-3.5" />
          <span>{downCount}</span>
        </button>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleContinueChat}
            disabled={isStartingChat}
            className="gap-1.5 text-xs"
          >
            {isStartingChat ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MessageCircle className="size-3.5" />
            )}
            {isStartingChat ? "채팅 시작 중..." : "채팅에서 이어가기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
