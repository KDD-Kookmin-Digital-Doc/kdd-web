import type { Source } from "@/types/chat";

export interface FAQItem {
  faqId: string;
  question: string;
  answer: string;
  topic: string;
  createdAt: string;
  helpful: number;
  notHelpful: number;
  isNew?: boolean;
  sources?: Source[];
}

export interface FAQTopic {
  topic: string;
  label: string;
}

/** FAQ 투표 요청 */
export interface FAQVoteRequest {
  voteType: "up" | "down";
}

/** FAQ 토픽 목록 응답 */
export interface FAQTopicsResponse {
  topics: FAQTopic[];
}

/** FAQ 목록 요청 파라미터 */
export interface FAQListRequest {
  topic?: string;
  sort?: "newest" | "popular";
  page?: number;
  pageSize?: number;
}

/** FAQ 목록 응답 */
export interface FAQListResponse {
  data: FAQItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** FAQ 상세 응답 */
export interface FAQDetailResponse {
  faqId: string;
  question: string;
  answer: string;
  topic: string;
  createdAt: string;
}

/** FAQ 기반 채팅 시작 응답 (POST /faqs/{faqId}/chat) */
export interface FAQChatStartResponse {
  sessionId: string;
  messages: FAQChatMessage[];
}

export interface FAQChatMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    documentId: number;
    documentTitle: string;
    page: number;
    chunkId?: number;
  }>;
  confidence?: string | null;
  createdAt: string;
}
