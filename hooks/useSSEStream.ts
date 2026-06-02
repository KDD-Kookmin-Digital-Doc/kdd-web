"use client";

import { useState, useCallback, useRef } from "react";
import { authManager } from "@/lib/api/auth";
import type { SSEEvent } from "@/types/api/chat";
import {
  MOCK_SSE_SEQUENCE_HIGH,
  MOCK_SSE_SEQUENCE_LOW,
  MOCK_SSE_FALLBACK,
} from "@/constants/mock-chat";

interface UseSSEStreamOptions {
  onDone?: (remaining?: number) => void;
  onRateLimit?: () => void;
  onError?: (message: string) => void;
}

interface UseSSEStreamReturn {
  events: SSEEvent[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
  reset: () => void;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// 진단 모드 — NEXT_PUBLIC_SSE_DIAG=true 일 때만 raw 청크/프레임 로그를 찍는다.
// JSON 파싱 실패 경고는 진단 모드와 무관하게 항상 노출하여 silent fail 을 막는다.
const SSE_DIAG = process.env.NEXT_PUBLIC_SSE_DIAG === "true";

const diagLog = (...args: unknown[]) => {
  if (SSE_DIAG) console.log("[SSE-DIAG]", ...args);
};

const previewTail = (s: string, n = 60) => {
  const tail = s.length > n ? s.slice(s.length - n) : s;
  return JSON.stringify(tail);
};

/**
 * 채팅 메시지 전송과 SSE(Server-Sent Events) 스트리밍 응답을 관리하는 훅.
 *
 * `fetch` + `ReadableStream`으로 `text/event-stream`을 직접 파싱한다. (EventSource는
 * POST·Authorization 헤더를 못 쓰므로 사용하지 않는다.) 멀티바이트(한국어 등) 청크 경계,
 * 부분 JSON 프레임, terminal 이벤트(done/error/fallback) 이후의 거짓 에러를 모두 방어한다.
 *
 * `NEXT_PUBLIC_USE_MOCK=true`이면 네트워크 없이 mock 시퀀스를 재생한다.
 *
 * @param sessionId - 메시지를 전송할 채팅 세션 ID
 * @param options   - 콜백: `onDone`(남은 횟수 수신), `onRateLimit`(429), `onError`(네트워크 오류)
 * @returns 누적 이벤트 배열, 스트리밍 여부, 에러, `sendMessage`, `reset`
 */
export function useSSEStream(
  sessionId: string,
  options?: UseSSEStreamOptions,
): UseSSEStreamReturn {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageCountRef = useRef(0);

  const reset = useCallback(() => {
    setEvents([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  const sendMessageMock = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      messageCountRef.current += 1;
      const count = messageCountRef.current;

      const sequence =
        count % 10 === 0
          ? [MOCK_SSE_FALLBACK]
          : count % 3 === 0
            ? MOCK_SSE_SEQUENCE_LOW
            : MOCK_SSE_SEQUENCE_HIGH;

      setIsStreaming(true);
      setEvents([]);
      setError(null);

      sequence.forEach((event, index) => {
        const delayMs = 100 + index * (150 + Math.random() * 150);
        setTimeout(() => {
          setEvents((prev) => [...prev, event]);
          if (event.type === "done") {
            options?.onDone?.(event.remaining);
          }
          if (index === sequence.length - 1) {
            setIsStreaming(false);
          }
        }, delayMs);
      });
    },
    [options],
  );

  const sendMessageReal = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsStreaming(true);
      setEvents([]);
      setError(null);

      // terminal 이벤트(done/error/fallback)를 수신하면 true로 설정.
      // catch/finally에서 참조해야 하므로 try 바깥에 선언한다.
      let terminated = false;

      try {
        // SSE는 Next.js rewrites 프록시의 버퍼링 문제를 피하기 위해 백엔드에 직접 요청
        const baseUrl = (
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
        ).replace(/\/+$/, "");

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        };
        const token = authManager.getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${baseUrl}/chat/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ content }),
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            options?.onRateLimit?.();
            // 429: 일일 채팅 횟수 초과. 사용자에게 명확한 안내가 필요하므로
            // SSE error 이벤트를 합성해 [id] 페이지의 FallbackMessage가 노출되도록 한다.
            setEvents((prev) => [
              ...prev,
              {
                type: "error",
                message:
                  "오늘의 채팅 횟수를 모두 사용했습니다. 내일 00:00(KST)에 초기화됩니다.",
              },
            ]);
            setIsStreaming(false);
            return;
          }
          throw new Error(`SSE 요청 실패: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processFrame = (frame: string) => {
          const dataLines: string[] = [];
          for (const rawLine of frame.split("\n")) {
            const line = rawLine.replace(/\r$/, "");
            if (!line.startsWith("data:")) continue;
            dataLines.push(
              line.startsWith("data: ") ? line.slice(6) : line.slice(5),
            );
          }
          if (dataLines.length === 0) {
            diagLog("frame has no data: lines, skip", JSON.stringify(frame));
            return;
          }
          const jsonStr = dataLines.join("\n");
          try {
            const event = JSON.parse(jsonStr) as SSEEvent;
            diagLog(
              "frame parsed",
              `type=${event.type}`,
              event.type === "text"
                ? `len=${event.content.length} preview=${JSON.stringify(event.content)}`
                : `raw=${jsonStr.slice(0, 120)}`,
            );
            setEvents((prev) => [...prev, event]);
            if (event.type === "done") {
              options?.onDone?.(event.remaining);
              // done/error/fallback 같은 terminal 이벤트를 setEvents와 같은 동기 블록에서
              // setIsStreaming(false)를 호출해야 React가 두 setState를 하나의 batch로 커밋한다.
              // finally에서만 호출하면 await 경계로 인해 별도 batch가 되어 useLayoutEffect가
              // 마지막 text 이벤트를 포함하지 않은 events로 메시지를 확정하는 race가 생긴다.
              setIsStreaming(false);
              terminated = true;
            } else if (event.type === "error" || event.type === "fallback") {
              setIsStreaming(false);
              terminated = true;
            }
          } catch (e) {
            // silent fail 을 막기 위해 항상 경고 — 마지막 이벤트가 부분 JSON 으로 도착하는
            // 케이스를 진단하려면 이 로그가 핵심이다.
            console.warn(
              "[SSE] JSON parse 실패 — frame 누락 가능. raw frame:",
              jsonStr,
              "error:",
              e,
            );
          }
        };

        while (true) {
          // terminal 이벤트를 이미 수신했으면 reader를 cancel하고 루프를 탈출한다.
          // 서버가 연결을 닫는 과정에서 reader.read()가 throw하는 것을 방지.
          if (terminated) {
            reader.cancel().catch(() => {});
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            // stream:true 로 누적된 디코더 내부 잔여 바이트를 flush 한다.
            // 청크 경계가 한 글자 중간(예: 한국어 3바이트)에서 끊긴 경우 이 호출 없이는 마지막 글자가 사라진다.
            const tail = decoder.decode();
            if (tail.length > 0) {
              diagLog("decoder tail flush", JSON.stringify(tail));
              buffer += tail;
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          diagLog(
            "chunk recv",
            `bytes=${value.byteLength}`,
            `buf_len=${buffer.length}`,
            `tail=${previewTail(buffer)}`,
          );

          // SSE 이벤트 경계는 빈 줄(\n\n 또는 \r\n\r\n)
          let boundary = buffer.search(/\r?\n\r?\n/);
          while (boundary !== -1) {
            const frame = buffer.slice(0, boundary);
            const match = buffer.slice(boundary).match(/^\r?\n\r?\n/);
            buffer = buffer.slice(boundary + (match ? match[0].length : 2));
            processFrame(frame);
            if (terminated) break;
            boundary = buffer.search(/\r?\n\r?\n/);
          }
        }

        diagLog(
          "stream ended",
          `leftover_buf_len=${buffer.length}`,
          `leftover=${previewTail(buffer)}`,
        );

        // 스트림 종료 후 남은 프레임 처리 (terminal 이벤트 미수신 시에만)
        if (!terminated && buffer.trim().length > 0) {
          processFrame(buffer);
        }
      } catch (err) {
        // terminal 이벤트(done/error/fallback)를 이미 정상 수신한 뒤 서버가 연결을
        // 닫으면서 reader.cancel()이나 후속 처리에서 에러가 발생할 수 있다.
        // 이 경우 사용자에게 거짓 에러를 보여주면 안 되므로 무시한다.
        if (terminated) return;

        const message =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setError(message);
        // 네트워크 오류나 기타 예외도 UI에 노출시켜 silent fail을 방지한다.
        // 429는 위에서 별도 처리했으므로 여기 도달하지 않는다.
        const fallbackMessage =
          "응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.";
        setEvents((prev) => {
          // 이미 error/fallback 이벤트가 있다면 중복 추가하지 않는다.
          if (prev.some((e) => e.type === "error" || e.type === "fallback")) {
            return prev;
          }
          return [
            ...prev,
            {
              type: "error",
              message: fallbackMessage,
            },
          ];
        });
        options?.onError?.(fallbackMessage);
      } finally {
        // terminated가 true면 processFrame 내에서 이미 setIsStreaming(false)를 호출했다.
        if (!terminated) {
          setIsStreaming(false);
        }
      }
    },
    [sessionId, options],
  );

  const sendMessage = USE_MOCK ? sendMessageMock : sendMessageReal;

  return { events, isStreaming, error, sendMessage, reset };
}
