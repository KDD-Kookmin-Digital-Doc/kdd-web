export type MessageRole = "user" | "assistant";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Source {
  documentId: number;
  documentTitle: string;
  page: number;
  chunkId?: number;
}

export interface ChatMessage {
  messageId: string;
  role: MessageRole;
  content: string;
  confidence?: ConfidenceLevel;
  sources?: Source[];
  rawSources?: Source[]; // 본문 마커 {{N}} 매핑용 (dedup X, AI 송신 순서 그대로)
  suggestedQuestions?: string[];
  partial?: boolean; // 스트리밍 중 오류로 중단된 부분 답변
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}
