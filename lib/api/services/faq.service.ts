import { apiClient } from "@/lib/api/client";
import { delay } from "@/lib/api/mock";
import type {
  FAQListRequest,
  FAQListResponse,
  FAQDetailResponse,
  FAQTopicsResponse,
  FAQVoteRequest,
  FAQItem,
  FAQTopic,
} from "@/types/api/faq";
import { MOCK_FAQ_TOPICS } from "@/constants/mock-faq";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── 백엔드 응답 shape ────────────────────────────────────────────
interface BackendFaqResponse {
  faqId: number;
  question: string;
  answer: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendPageResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BackendFaqTopicResponse {
  topic: string;
  label: string;
}

function toFaqItem(r: BackendFaqResponse): FAQItem {
  return {
    faqId: String(r.faqId),
    question: r.question,
    answer: r.answer,
    topic: r.topic,
    createdAt: r.createdAt,
    // 백엔드에 아직 집계 필드 없음 — 0으로 채운다
    helpful: 0,
    notHelpful: 0,
  };
}

// ── 공개 API ──────────────────────────────────────────────────────

export async function getFAQList(
  params?: FAQListRequest,
): Promise<FAQListResponse> {
  if (USE_MOCK) {
    await delay(300);
    const { MOCK_FAQ_ITEMS } = await import("@/constants/mock-faq");
    let items = [...MOCK_FAQ_ITEMS];
    if (params?.topic && params.topic !== "all") {
      items = items.filter((f) => f.topic === params.topic);
    }
    if (params?.sort === "popular") {
      items = [...items].sort((a, b) => b.helpful - a.helpful);
    } else {
      items = [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return {
      data: items,
      totalCount: items.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: Math.ceil(items.length / (params?.pageSize ?? 10)),
    };
  }

  // 백엔드는 popular 정렬을 아직 지원하지 않음 — latest(default)만 사용
  const res = await apiClient.get<BackendPageResponse<BackendFaqResponse>>(
    "/faqs",
    {
      params: {
        topic:
          params?.topic && params.topic !== "all" ? params.topic : undefined,
        page:
          params?.page !== undefined ? Math.max(0, params.page - 1) : undefined,
        pageSize: params?.pageSize,
      },
    },
  );

  let items = res.data.map(toFaqItem);
  // 정렬은 백엔드가 이미 createdAt desc이므로 newest는 그대로, popular는 helpful 필드가 없어
  // 실질적으로 동일 순서로 내려간다 (추후 백엔드 집계 추가 시 정렬 파라미터 전달)
  if (params?.sort === "popular") {
    items = [...items].sort((a, b) => b.helpful - a.helpful);
  }

  return {
    data: items,
    totalCount: res.totalCount,
    page: res.page + 1,
    pageSize: res.pageSize,
    totalPages: res.totalPages,
  };
}

export async function getFAQDetail(
  faqId: number | string,
): Promise<FAQDetailResponse> {
  if (USE_MOCK) {
    await delay(200);
    const { MOCK_FAQ_ITEMS } = await import("@/constants/mock-faq");
    const found = MOCK_FAQ_ITEMS.find((f) => f.faqId === String(faqId));
    if (found) {
      return {
        faqId: found.faqId,
        question: found.question,
        answer: found.answer,
        topic: found.topic,
        createdAt: found.createdAt,
      };
    }
    return {
      faqId: String(faqId),
      question: "질문을 찾을 수 없습니다",
      answer: "",
      topic: "etc",
      createdAt: new Date().toISOString(),
    };
  }

  const res = await apiClient.get<BackendFaqResponse>(`/faqs/${faqId}`);
  return {
    faqId: String(res.faqId),
    question: res.question,
    answer: res.answer,
    topic: res.topic,
    createdAt: res.createdAt,
  };
}

export async function getTopics(): Promise<FAQTopicsResponse> {
  if (USE_MOCK) {
    await delay(200);
    return { topics: MOCK_FAQ_TOPICS };
  }

  const res = await apiClient.get<{ topics: BackendFaqTopicResponse[] }>(
    "/faqs/topics",
  );
  // 프론트 UI에서 "전체" 필터를 쓰도록 "all" 항목을 맨 앞에 넣는다
  const topics: FAQTopic[] = [{ topic: "all", label: "전체" }, ...res.topics];
  return { topics };
}

// ── 투표 API (백엔드 미구현) ───────────────────────────────────────
// /faqs/{id}/vote 엔드포인트가 백엔드에 없어 호출 시 no-op 처리한다.
// 백엔드 구현 후 apiClient.post 호출로 교체한다.
export async function voteFAQ(
  _faqId: string,
  _data: FAQVoteRequest,
): Promise<void> {
  await delay(100);
}
