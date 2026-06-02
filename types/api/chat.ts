import type { ConfidenceLevel } from "@/types/chat";

// ─── SSE 이벤트 타입 ───

export interface SourceRef {
  documentId: number;
  documentTitle: string;
  page: number;
  chunkId: number;
}

export interface SSEMetaEvent {
  type: "meta";
  subtype: "document" | "cache" | "chitchat";
  confidence?: ConfidenceLevel;
  sources?: SourceRef[];
}

export interface SSETextEvent {
  type: "text";
  content: string;
}

export interface SSEDoneEvent {
  type: "done";
  messageId: number; // 백엔드 Long 대응
  remaining?: number; // 남은 일일 채팅 횟수
}

export interface SSEFallbackEvent {
  type: "fallback";
  message: string;
  suggestedQuestions: string[];
}

export interface SSEErrorEvent {
  type: "error";
  message: string;
}

export type SSEEvent =
  | SSEMetaEvent
  | SSETextEvent
  | SSEDoneEvent
  | SSEFallbackEvent
  | SSEErrorEvent;

// ─── 기존 프론트엔드 타입 (하위 호환) ───

export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  confidence?: ConfidenceLevel;
  sources?: SourceRef[];
  rawSources?: SourceRef[]; // 본문 마커 {{N}} 매핑용 (dedup X, AI 송신 순서 그대로)
  suggestedQuestions?: string[];
  createdAt: string;
}

export interface RecommendedQuestion {
  questionId: string;
  content: string;
}

// ─── 백엔드 DTO 대응 타입 ───

/** 백엔드 ChatSessionCreateResponse 대응 */
export interface ChatSessionCreateResponse {
  sessionId: number;
  title: string;
  sourceType: string;
  createdAt: string;
}

/** 백엔드 ChatSessionListResponse 대응 */
export interface ChatSessionListResponse {
  sessionId: number;
  title: string;
  sourceType: string;
  createdAt: string;
}

/** 백엔드 ChatSessionDetailResponse 대응 */
export interface ChatSessionDetailResponse {
  sessionId: number;
  title: string;
  sourceType: string;
  messages: ChatMessageResponse[];
}

/** 백엔드 ChatMessageResponse 대응 (ChatSessionDetailResponse 내부) */
export interface ChatMessageResponse {
  messageId: number;
  role: "user" | "assistant";
  content: string;
  sources: ChatMessageSourceResponse[];
  confidence: string | null;
  partial: boolean;
  createdAt: string;
}

/** 백엔드 ChatMessageSourceResponse 대응 */
export interface ChatMessageSourceResponse {
  documentId: number;
  documentTitle: string;
  page: number;
  chunkId: number;
}

/** 백엔드 ChatSessionUpdateRequest 대응 */
export interface ChatSessionUpdateRequest {
  title: string;
}

/** 백엔드 ChatSessionUpdateResponse 대응 */
export interface ChatSessionUpdateResponse {
  sessionId: number;
  title: string;
}

/** 백엔드 ChatMessageRequest 대응 */
export interface ChatMessageRequest {
  content: string;
}

/** 채팅 세션 목록 요청 파라미터 */
export interface ChatSessionListRequest {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/** 채팅 세션 목록 페이지 응답 */
export interface ChatSessionListPageResponse {
  data: ChatSessionListResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 추천 질문 목록 응답 */
export interface RecommendedQuestionsResponse {
  questions: RecommendedQuestion[];
}
