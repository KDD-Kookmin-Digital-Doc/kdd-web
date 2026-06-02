"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatContext } from "@/components/chat/ChatContext";
import { useChatUsage } from "@/hooks/useChatUsage";
import { useToast } from "@/components/ui/toast";
import { getRecommendedQuestions } from "@/lib/api/services/chat.service";
import type { RecommendedQuestion } from "@/types/api/chat";

const RATE_LIMIT_MESSAGE =
  "오늘의 채팅 횟수를 모두 사용했습니다. 내일 00:00(KST)에 초기화됩니다.";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createNewSession } = useChatContext();
  const { remaining } = useChatUsage();
  const toast = useToast();
  const [recommendations, setRecommendations] = useState<RecommendedQuestion[]>(
    [],
  );
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    useState(true);

  // FAQ "채팅에서 이어가기" 등에서 넘어온 초기 질문
  const initialQuery = searchParams.get("q") ?? undefined;

  // 추천 질문 로드 (마운트 1회). 로딩 상태는 useState(true) 초기값으로 시작하므로
  // 이펙트 본문에서 동기적으로 setState하지 않는다 (cascading render 방지).
  useEffect(() => {
    getRecommendedQuestions()
      .then((res) => setRecommendations(res.questions))
      .catch((err) => {
        console.error("[ChatPage] getRecommendedQuestions 실패", err);
        setRecommendations([]);
      })
      .finally(() => setIsRecommendationsLoading(false));
  }, []);

  const handleSend = async (message: string) => {
    // 일일 사용 한도 소진 시 세션 생성/이동을 막아 빈 세션이 쌓이는 것을 방지한다.
    if (remaining === 0) {
      toast.error(RATE_LIMIT_MESSAGE);
      return;
    }
    try {
      const sessionId = await createNewSession();
      router.push(
        `/chat/${sessionId}?q=${encodeURIComponent(message)}&autosend=1`,
      );
    } catch {
      // 세션 생성 실패 시 임시 id로 이동
      const tempId = `new-${Date.now()}`;
      router.push(
        `/chat/${tempId}?q=${encodeURIComponent(message)}&autosend=1`,
      );
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader remaining={remaining} />
      <div className="relative min-h-0 flex-1">
        <div className="mx-auto flex h-full max-w-3xl flex-col overflow-y-auto px-4 pt-6 pb-24">
          <ChatWelcome
            onSuggestionClick={handleSend}
            recommendations={recommendations}
            isLoading={isRecommendationsLoading}
          />
        </div>
        <ChatInput
          onSend={handleSend}
          disabled={remaining === 0}
          placeholder={remaining === 0 ? RATE_LIMIT_MESSAGE : undefined}
          onDisabledAttempt={() => toast.error(RATE_LIMIT_MESSAGE)}
          initialValue={initialQuery}
          className="absolute inset-x-0 bottom-6 mx-auto w-[calc(100%-2rem)] max-w-184"
        />
      </div>
    </div>
  );
}
