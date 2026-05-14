"use client";

import { use, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { FallbackMessage } from "@/components/chat/FallbackMessage";
import { AnswerWithCitations } from "@/components/chat/AnswerWithCitations";
import { useChatContext } from "@/components/chat/ChatContext";
import { useSSEStream } from "@/hooks/useSSEStream";
import { getSessionDetail } from "@/lib/api/services/chat.service";
import { getDocumentDetail } from "@/lib/api/services/document.service";
import type { ChatMessage, Source } from "@/types/chat";
import type { SSEEvent, ChatMessageResponse } from "@/types/api/chat";

// react-pdf는 DOMMatrix 같은 브라우저 전용 API를 모듈 평가 시점에 참조하므로
// SSR을 비활성화한 동적 import로만 로드한다.
const PDFViewer = dynamic(
  () =>
    import("@/components/shared/PDFViewer").then((m) => ({
      default: m.PDFViewer,
    })),
  { ssr: false },
);

type Props = { params: Promise<{ id: string }> };

interface PDFViewerState {
  open: boolean;
  fileUrl: string;
  title: string;
  initialPage?: number;
}

function buildMessagesFromEvents(events: SSEEvent[]): Partial<ChatMessage> {
  let content = "";
  let confidence: ChatMessage["confidence"] | undefined;
  let sources: ChatMessage["sources"] | undefined;
  let rawSources: ChatMessage["rawSources"] | undefined;
  let suggestedQuestions: string[] | undefined;

  for (const event of events) {
    if (event.type === "text") {
      content += event.content;
    } else if (event.type === "meta") {
      confidence = event.confidence;
      if (event.sources) {
        // 본문 마커 {{N}} → rawSources[N-1] 매핑용. AI 송신 순서·길이 그대로 보존.
        rawSources = event.sources.map((s) => ({
          documentId: s.documentId,
          documentTitle: s.documentTitle,
          page: s.page,
          chunkId: s.chunkId,
        }));

        // 메시지 밑 출처 카드용. 기존 (documentId, page) dedup 유지.
        const seen = new Map<string, Source>();
        for (const s of event.sources) {
          const key = `${s.documentId}-${s.page}`;
          if (!seen.has(key)) {
            seen.set(key, {
              documentId: s.documentId,
              documentTitle: s.documentTitle,
              page: s.page,
              chunkId: s.chunkId,
            });
          }
        }
        sources = Array.from(seen.values());
      }
    } else if (event.type === "fallback") {
      suggestedQuestions = event.suggestedQuestions;
    }
  }

  return { content, confidence, sources, rawSources, suggestedQuestions };
}

function mapApiMessageToLocal(msg: ChatMessageResponse): ChatMessage {
  // 재조회 응답은 BE가 chat_message_sources에 chunk 단위로 저장한 데이터를
  // 그대로 반환한다 (BE @OrderBy("id ASC")로 저장 순서 == AI 송신 순서 보장).
  // 본문 마커 매핑용 rawSources와 출처 카드용 sources(page dedup) 둘 다 구성.
  const rawSources: Source[] = msg.sources.map((s) => ({
    documentId: s.documentId,
    documentTitle: s.documentTitle,
    page: s.page,
    chunkId: s.chunkId,
  }));

  const seen = new Map<string, Source>();
  for (const s of rawSources) {
    const key = `${s.documentId}-${s.page}`;
    if (!seen.has(key)) seen.set(key, s);
  }
  const dedupedSources = Array.from(seen.values());

  return {
    messageId: String(msg.messageId),
    role: msg.role,
    content: msg.content,
    confidence: (msg.confidence as ChatMessage["confidence"]) ?? undefined,
    sources: dedupedSources,
    rawSources,
    createdAt: msg.createdAt,
  };
}

export default function ChatDetailPage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { renameChat } = useChatContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const initialQueryHandled = useRef(false);

  const [pdfViewer, setPdfViewer] = useState<PDFViewerState>({
    open: false,
    fileUrl: "",
    title: "",
    initialPage: undefined,
  });

  const { events, isStreaming, sendMessage, reset } = useSSEStream(id);

  // 세션 상세 로드 (히스토리 메시지)
  // 초기 1회만 서버 응답으로 채운다. fetch가 늦게 resolve돼서 유저가 이미 새 메시지를 추가한
  // 상태를 덮어쓰면 방금 나눈 대화가 통째로 사라진다 (StrictMode 중복 fetch에서 특히 잘 터짐).
  useEffect(() => {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      setSessionLoaded(true);
      return;
    }
    let cancelled = false;
    getSessionDetail(numericId)
      .then((res) => {
        if (cancelled) return;
        if (res.messages.length === 0) return;
        setMessages((prev) =>
          prev.length === 0 ? res.messages.map(mapApiMessageToLocal) : prev,
        );
      })
      .catch(() => {
        // 세션 로드 실패 시 빈 메시지로 시작
      })
      .finally(() => {
        if (!cancelled) setSessionLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // SSE 이벤트로부터 fallback/error 이벤트 추출
  const fallbackEvent = events.find((e) => e.type === "fallback");
  const errorEvent = events.find((e) => e.type === "error");

  // 스트리밍 완료 시 메시지 목록에 추가 + 서버 제목 동기화
  // done 이벤트가 누락되거나 포맷이 스펙과 달라도 누적된 텍스트가 있으면 반드시 확정한다.
  // useLayoutEffect로 paint 전에 commit → isStreaming=false로 전환된 프레임과 동일 프레임에
  // messages도 갱신돼서 스트리밍 버블이 사라지며 응답이 통째로 보이지 않게 되는 짧은 gap을 제거한다.
  useLayoutEffect(() => {
    if (isStreaming) return;
    if (fallbackEvent || errorEvent) return;

    const partial = buildMessagesFromEvents(events);
    if (!partial.content) return;

    const assistantMessage: ChatMessage = {
      messageId: `${id}-${Date.now()}-reply`,
      role: "assistant",
      content: partial.content,
      confidence: partial.confidence,
      sources: partial.sources,
      rawSources: partial.rawSources,
      suggestedQuestions: partial.suggestedQuestions,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
    reset();

    // 백엔드가 생성한 세션 제목으로 사이드바 동기화
    const numericId = Number(id);
    if (!isNaN(numericId)) {
      getSessionDetail(numericId)
        .then((res) => renameChat(id, res.title))
        .catch(() => {
          // 제목 동기화 실패는 UX에 영향 없음 — 사이드바 제목이 임시값으로 유지됨
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // 첫 메시지 전송 시 제목 자동 갱신 (15자)
    const isFirstMessage = messages.length === 0;
    if (isFirstMessage) {
      const newTitle = trimmed.slice(0, 15);
      renameChat(id, newTitle);
    }

    const userMessage: ChatMessage = {
      messageId: `${id}-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    sendMessage(trimmed);
  };

  const handleOpenPDF = async (
    documentId: number,
    page: number,
    _chunkId?: number,
  ) => {
    try {
      const detail = await getDocumentDetail(documentId);
      if (!detail.fileUrl) return;
      setPdfViewer({
        open: true,
        fileUrl: detail.fileUrl,
        title: detail.title,
        initialPage: page,
      });
    } catch {
      // 실패 시 모달 안 띄움
    }
  };

  const handleClosePDF = () => {
    setPdfViewer((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (!sessionLoaded) return;
    if (initialQueryHandled.current) return;
    const q = searchParams.get("q");
    const autosend = searchParams.get("autosend");
    if (q && messages.length === 0) {
      initialQueryHandled.current = true;
      handleSend(q);
      // autosend 파라미터가 있으면 URL에서 q/autosend 제거
      if (autosend === "1") {
        router.replace(`/chat/${id}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoaded]);

  const isEmpty = messages.length === 0 && !isStreaming;

  // 스트리밍 중 현재 누적된 텍스트
  const streamingText = events
    .filter((e) => e.type === "text")
    .map((e) => (e.type === "text" ? e.content : ""))
    .join("");

  // 스트리밍 중 rawSources (meta 이벤트에서 추출)
  const streamingRawSources: Source[] = (() => {
    const metaEvent = events.find((e) => e.type === "meta");
    if (metaEvent?.type === "meta" && metaEvent.sources) {
      return metaEvent.sources.map((s) => ({
        documentId: s.documentId,
        documentTitle: s.documentTitle,
        page: s.page,
        chunkId: s.chunkId,
      }));
    }
    return [];
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader />
      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-y-auto pb-24">
          {isEmpty ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col px-4 pt-6">
              <ChatWelcome onSuggestionClick={handleSend} />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 pt-6">
              <ChatMessageList
                messages={messages}
                isStreaming={
                  isStreaming && !streamingText && !fallbackEvent && !errorEvent
                }
                onSelectQuestion={handleSend}
                onOpenPDF={handleOpenPDF}
              />

              {isStreaming && streamingText && (
                <div className="mt-6 flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-secondary px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground md:max-w-[70%]">
                    {streamingRawSources.length > 0 ? (
                      <AnswerWithCitations
                        content={streamingText}
                        rawSources={streamingRawSources}
                        onOpenPDF={handleOpenPDF}
                        streaming
                      />
                    ) : (
                      streamingText
                    )}
                  </div>
                </div>
              )}

              {!isStreaming && fallbackEvent && (
                <div className="mt-6">
                  <FallbackMessage
                    type="fallback"
                    message={fallbackEvent.message}
                    suggestedQuestions={fallbackEvent.suggestedQuestions}
                    onSelectQuestion={handleSend}
                  />
                </div>
              )}

              {!isStreaming && errorEvent && (
                <div className="mt-6">
                  <FallbackMessage type="error" message={errorEvent.message} />
                </div>
              )}
            </div>
          )}
        </div>
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          className="absolute inset-x-0 bottom-6 mx-auto w-[calc(100%-2rem)] max-w-184"
        />
      </div>

      <PDFViewer
        open={pdfViewer.open}
        onClose={handleClosePDF}
        fileUrl={pdfViewer.fileUrl}
        title={pdfViewer.title}
        initialPage={pdfViewer.initialPage}
      />
    </div>
  );
}
