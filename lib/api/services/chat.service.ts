import { apiClient } from '@/lib/api/client';
import { delay } from '@/lib/api/mock';
import type {
  ChatSessionListPageResponse,
  ChatSessionCreateResponse,
  ChatSessionDetailResponse,
  ChatSessionUpdateResponse,
  RecommendedQuestionsResponse,
  ChatSessionListRequest,
} from '@/types/api/chat';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const MOCK_SESSIONS_PAGE: ChatSessionListPageResponse = {
  data: [
    { sessionId: 2, title: '1학기 휴학 신청 기간', sourceType: 'normal', createdAt: '2026-03-20T10:00:00' },
    { sessionId: 3, title: '수강신청 일정 문의', sourceType: 'normal', createdAt: '2026-03-19T14:00:00' },
    { sessionId: 4, title: '성적 이의신청 기간 문의', sourceType: 'normal', createdAt: '2026-03-18T09:00:00' },
    { sessionId: 5, title: '장학금 종류 알려줘', sourceType: 'normal', createdAt: '2026-03-17T11:00:00' },
    { sessionId: 6, title: '타 대학 학점 인정 문의', sourceType: 'normal', createdAt: '2026-03-16T15:00:00' },
    { sessionId: 7, title: '복수전공 신청 조건', sourceType: 'normal', createdAt: '2026-03-15T13:00:00' },
    { sessionId: 8, title: '조기졸업 가능 여부', sourceType: 'normal', createdAt: '2026-03-14T16:00:00' },
  ],
  totalCount: 7,
  page: 0,
  pageSize: 20,
  totalPages: 1,
};

let mockSessionIdCounter = 100;

export async function getSessions(params?: ChatSessionListRequest): Promise<ChatSessionListPageResponse> {
  if (USE_MOCK) {
    await delay(300);
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      const filtered = MOCK_SESSIONS_PAGE.data.filter((s) =>
        s.title.toLowerCase().includes(kw)
      );
      return { ...MOCK_SESSIONS_PAGE, data: filtered, totalCount: filtered.length };
    }
    return MOCK_SESSIONS_PAGE;
  }
  return apiClient.get<ChatSessionListPageResponse>('/chat/sessions', {
    params: {
      keyword: params?.keyword,
      page: params?.page,
      pageSize: params?.pageSize,
    },
  });
}

export async function createSession(): Promise<ChatSessionCreateResponse> {
  if (USE_MOCK) {
    await delay(300);
    mockSessionIdCounter += 1;
    return {
      sessionId: mockSessionIdCounter,
      title: `새 대화 ${new Date().toLocaleDateString('ko-KR')}`,
      sourceType: 'normal',
      createdAt: new Date().toISOString(),
    };
  }
  return apiClient.post<ChatSessionCreateResponse>('/chat/sessions');
}

export async function getSessionDetail(sessionId: number): Promise<ChatSessionDetailResponse> {
  if (USE_MOCK) {
    await delay(300);
    return {
      sessionId,
      title: '채팅 세션',
      sourceType: 'normal',
      messages: [],
    };
  }
  return apiClient.get<ChatSessionDetailResponse>(`/chat/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: number): Promise<void> {
  if (USE_MOCK) {
    await delay(200);
    return;
  }
  await apiClient.delete<void>(`/chat/sessions/${sessionId}`);
}

export async function updateSessionTitle(
  sessionId: number,
  title: string
): Promise<ChatSessionUpdateResponse> {
  if (USE_MOCK) {
    await delay(200);
    return { sessionId, title };
  }
  return apiClient.patch<ChatSessionUpdateResponse>(`/chat/sessions/${sessionId}`, { title });
}

// 추천 질문 — 백엔드 GET /chat/recommended-questions 연결
const RECOMMENDED_QUESTIONS_MOCK: RecommendedQuestionsResponse = {
  questions: [
    { questionId: 'rq-001', content: '이번 학기 수강신청 기간이 언제인가요?' },
    { questionId: 'rq-002', content: '휴학 신청은 어떻게 하나요?' },
    { questionId: 'rq-003', content: '성적우수 장학금 기준이 무엇인가요?' },
    { questionId: 'rq-004', content: '복수전공 신청 조건이 어떻게 되나요?' },
    { questionId: 'rq-005', content: '졸업 이수학점은 몇 학점인가요?' },
  ],
};

export async function getRecommendedQuestions(): Promise<RecommendedQuestionsResponse> {
  if (USE_MOCK) {
    await delay(300);
    return RECOMMENDED_QUESTIONS_MOCK;
  }
  return apiClient.get<RecommendedQuestionsResponse>('/chat/recommended-questions');
}
