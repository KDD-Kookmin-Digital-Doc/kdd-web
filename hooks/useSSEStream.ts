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

export function useSSEStream(sessionId: string, options?: UseSSEStreamOptions): UseSSEStreamReturn {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageCountRef = useRef(0);

  const reset = useCallback(() => {
    setEvents([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  const sendMessageMock = useCallback((content: string) => {
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
  }, [options]);

  const sendMessageReal = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsStreaming(true);
      setEvents([]);
      setError(null);

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
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            options?.onRateLimit?.();
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
            dataLines.push(line.startsWith("data: ") ? line.slice(6) : line.slice(5));
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
                : `raw=${jsonStr.slice(0, 120)}`
            );
            setEvents((prev) => [...prev, event]);
            if (event.type === "done") {
              options?.onDone?.(event.remaining);
            }
          } catch (e) {
            // silent fail 을 막기 위해 항상 경고 — 마지막 이벤트가 부분 JSON 으로 도착하는
            // 케이스를 진단하려면 이 로그가 핵심이다.
            console.warn(
              "[SSE] JSON parse 실패 — frame 누락 가능. raw frame:",
              jsonStr,
              "error:",
              e
            );
          }
        };

        while (true) {
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
          diagLog("chunk recv", `bytes=${value.byteLength}`, `buf_len=${buffer.length}`, `tail=${previewTail(buffer)}`);

          // SSE 이벤트 경계는 빈 줄(\n\n 또는 \r\n\r\n)
          let boundary = buffer.search(/\r?\n\r?\n/);
          while (boundary !== -1) {
            const frame = buffer.slice(0, boundary);
            const match = buffer.slice(boundary).match(/^\r?\n\r?\n/);
            buffer = buffer.slice(boundary + (match ? match[0].length : 2));
            processFrame(frame);
            boundary = buffer.search(/\r?\n\r?\n/);
          }
        }

        diagLog("stream ended", `leftover_buf_len=${buffer.length}`, `leftover=${previewTail(buffer)}`);

        // 스트림 종료 후 남은 프레임 처리
        if (buffer.trim().length > 0) {
          processFrame(buffer);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        setError(message);
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, options]
  );

  const sendMessage = USE_MOCK ? sendMessageMock : sendMessageReal;

  return { events, isStreaming, error, sendMessage, reset };
}
