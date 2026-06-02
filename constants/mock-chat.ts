// TODO: 실제 API 연동 시 제거

import type { ChatSession } from "@/types/chat";
import type {
  SSEMetaEvent,
  SSETextEvent,
  SSEDoneEvent,
  SSEFallbackEvent,
  SSEEvent,
  RecommendedQuestion,
} from "@/types/api/chat";

export const MOCK_CHAT_SESSIONS: Record<string, ChatSession> = {
  "2": {
    id: "2",
    title: "1학기 휴학 신청 기간",
    messages: [
      {
        messageId: "2-1",
        role: "user",
        content: "이번 학기 휴학 신청 기간이 언제까지야?",
        createdAt: "2026-03-20T10:00:00",
      },
      {
        messageId: "2-2",
        role: "assistant",
        content:
          "이번 학기(2026학년도 1학기) 휴학 신청 기간은 3월 3일부터 3월 14일까지입니다.{{1}}\n\n일반 휴학의 경우 학기당 1회, 연속 2학기까지 신청 가능하며, 재학 중 통산 6학기(군휴학 제외)를 초과할 수 없습니다.{{1}}\n\n휴학 신청은 학사정보시스템(KLAS)을 통해 온라인으로 신청하실 수 있으며, 질병휴학의 경우 의사 진단서를 제출해야 합니다.{{2}}",
        confidence: "high",
        sources: [
          {
            documentId: 1,
            documentTitle: "학칙 제35조 (휴학)",
            page: 8,
          },
          {
            documentId: 2,
            documentTitle: "2026학년도 학사일정 — 휴학 신청 기간",
            page: 4,
          },
        ],
        createdAt: "2026-03-20T10:00:05",
      },
      {
        messageId: "2-3",
        role: "user",
        content: "군휴학도 같은 기간에 신청해?",
        createdAt: "2026-03-20T10:01:00",
      },
      {
        messageId: "2-4",
        role: "assistant",
        content:
          "군휴학은 일반 휴학과 신청 기간이 다릅니다.{{1}}\n\n군휴학은 입영통지서를 받은 후 입영일 전까지 수시로 신청 가능합니다. 별도의 정해진 기간이 아니라, 입영통지서 수령 후 즉시 신청하시면 됩니다.{{1}}",
        confidence: "high",
        sources: [
          {
            documentId: 1,
            documentTitle: "학칙 제35조 (휴학)",
            page: 8,
          },
        ],
        createdAt: "2026-03-20T10:01:05",
      },
    ],
  },
  "3": {
    id: "3",
    title: "수강신청 일정 문의",
    messages: [
      {
        messageId: "3-1",
        role: "user",
        content: "수강신청 방법 알려줘",
        createdAt: "2026-03-19T14:00:00",
      },
      {
        messageId: "3-2",
        role: "assistant",
        content:
          "수강신청은 학사정보시스템(KLAS)에서 진행됩니다.\n\n1. KLAS 로그인 (klas.kookmin.ac.kr)\n2. 수강신청 메뉴 클릭\n3. 희망 과목 검색 후 신청\n\n수강신청 기간은 학년별로 상이하며, 4학년부터 순차적으로 진행됩니다. 정정 기간에는 과목 변경이 가능합니다.",
        confidence: "high",
        createdAt: "2026-03-19T14:00:05",
      },
    ],
  },
  "4": {
    id: "4",
    title: "성적 이의신청 기간 문의",
    messages: [
      {
        messageId: "4-1",
        role: "user",
        content: "성적 이의신청 기간이 언제야?",
        createdAt: "2026-03-18T09:00:00",
      },
      {
        messageId: "4-2",
        role: "assistant",
        content:
          "성적 이의신청은 매 학기 성적 공시 후 3일 이내에 가능합니다.\n\n성적 공시일은 학사일정에서 확인하실 수 있으며, KLAS에서 온라인으로 이의신청서를 제출하시면 됩니다. 담당 교수님의 검토 후 결과가 통보됩니다.",
        confidence: "medium",
        createdAt: "2026-03-18T09:00:05",
      },
    ],
  },
  "5": {
    id: "5",
    title: "장학금 종류 알려줘",
    messages: [
      {
        messageId: "5-1",
        role: "user",
        content: "장학금 종류 알려줘",
        createdAt: "2026-03-17T11:00:00",
      },
      {
        messageId: "5-2",
        role: "assistant",
        content:
          "국민대학교에서 제공하는 주요 장학금 종류는 다음과 같습니다.\n\n• 성적우수 장학금: 직전 학기 성적 기준\n• 국가장학금 (Ⅰ·Ⅱ유형): 한국장학재단 신청\n• 교내 근로장학금: 교내 근로 참여\n• 특기자 장학금: 체육·예술 특기자\n• 보훈장학금: 국가유공자 자녀\n• 외국인 유학생 장학금\n\n자세한 신청 자격과 금액은 학생지원팀에 문의하시기 바랍니다.",
        confidence: "medium",
        createdAt: "2026-03-17T11:00:05",
      },
    ],
  },
  "6": {
    id: "6",
    title: "타 대학 학점 인정 문의",
    messages: [
      {
        messageId: "6-1",
        role: "user",
        content: "다른 대학교에서 들은 계절학기 학점 인정돼?",
        createdAt: "2026-03-16T15:00:00",
      },
      {
        messageId: "6-2",
        role: "assistant",
        content:
          '타 대학 계절학기 학점 인정은 가능하지만, 여러 조건이 있습니다.\n\n• 사전에 학과장 및 교학처장의 승인 필요\n• 해당 과목이 본교 교육과정과 동등하다고 인정되어야 함\n• 학점 인정 상한: 재학 중 최대 12학점{{1}}\n\n"제29조(학점인정) ① 타 대학에서 이수한 학점은 교학처장 및 학과장의 승인을 받아 인정"',
        confidence: "high",
        sources: [
          {
            documentId: 3,
            documentTitle: "학칙 제29조 (학점 인정)",
            page: 8,
          },
        ],
        createdAt: "2026-03-16T15:00:05",
      },
      {
        messageId: "6-3",
        role: "user",
        content: "전공 과목도 인정받을 수 있어?",
        createdAt: "2026-03-16T15:01:00",
      },
      {
        messageId: "6-4",
        role: "assistant",
        content:
          "전공 과목의 타 대학 학점 인정은 매우 제한적입니다.\n\n규정상으로는 가능하다고 되어 있으나, 실제로는 학과장의 재량에 따라 결정되며 대부분 자유선택 학점으로 인정되는 경우가 많습니다. 전공필수 과목은 인정이 어려울 수 있으니, 사전에 학과 사무실에 문의하시는 것을 권장합니다.",
        confidence: "low",
        createdAt: "2026-03-16T15:01:05",
      },
    ],
  },
  "7": {
    id: "7",
    title: "복수전공 신청 조건",
    messages: [
      {
        messageId: "7-1",
        role: "user",
        content: "복수전공 신청 조건이 어떻게 돼?",
        createdAt: "2026-03-15T13:00:00",
      },
      {
        messageId: "7-2",
        role: "assistant",
        content:
          '복수전공 신청 조건은 다음과 같습니다.\n\n• 2학년 이상 재학생\n• 직전 학기 평점평균 2.5 이상\n• 소속 학과(부)장의 승인\n• 복수전공 희망 학과(부)장의 승인{{1}}\n\n"제24조(복수전공) ① 학생은 소속 학과 외에 타 학과의 전공을 복수전공으로 이수할 수 있다"',
        confidence: "high",
        sources: [
          {
            documentId: 4,
            documentTitle: "학칙 제24조 (복수전공)",
            page: 10,
          },
        ],
        createdAt: "2026-03-15T13:00:05",
      },
      {
        messageId: "7-3",
        role: "user",
        content: "복수전공 포기하면 들은 과목은 어떻게 돼?",
        createdAt: "2026-03-15T13:01:00",
      },
      {
        messageId: "7-4",
        role: "assistant",
        content:
          "복수전공을 포기할 경우, 이미 이수한 과목은 자유선택 학점으로 인정됩니다.\n\n• 전공필수/전공선택으로 인정받던 학점이 자유선택으로 변경\n• 졸업학점에는 포함 가능\n• 포기 신청은 매 학기 수강신청 기간에 가능",
        confidence: "high",
        createdAt: "2026-03-15T13:01:05",
      },
    ],
  },
  "8": {
    id: "8",
    title: "조기졸업 가능 여부",
    messages: [
      {
        messageId: "8-1",
        role: "user",
        content: "조기졸업 가능한지 알고 싶어",
        createdAt: "2026-03-14T16:00:00",
      },
      {
        messageId: "8-2",
        role: "assistant",
        content:
          "조기졸업 제도는 다음과 같습니다.\n\n• 6학기 또는 7학기 만에 졸업 가능\n• 평점평균 3.5 이상 유지\n• 졸업에 필요한 모든 학점 및 요건 충족\n• 학과장 및 교학처장의 승인 필요\n\n조기졸업을 희망하는 경우, 최소 1학기 전에 학과 사무실에 상담을 받으시는 것을 권장합니다.",
        confidence: "medium",
        createdAt: "2026-03-14T16:00:05",
      },
    ],
  },
};

export const MOCK_SSE_SEQUENCE_HIGH: SSEEvent[] = [
  {
    type: "meta",
    subtype: "document",
    confidence: "high",
    sources: [
      {
        documentId: 1,
        documentTitle: "학칙 제35조 (휴학)",
        page: 12,
        chunkId: 101,
      },
    ],
  } satisfies SSEMetaEvent,
  {
    type: "text",
    content: "이번 학기 휴학 신청 기간은 ",
  } satisfies SSETextEvent,
  {
    type: "text",
    content: "3월 3일부터 3월 14일까지입니다.{{1}}",
  } satisfies SSETextEvent,
  {
    type: "text",
    content: "\n\n일반 휴학의 경우 학기당 1회, ",
  } satisfies SSETextEvent,
  {
    type: "text",
    content: "연속 2학기까지 신청 가능합니다.{{1}}",
  } satisfies SSETextEvent,
  {
    type: "text",
    content: "\n\n휴학 신청은 KLAS에서 온라인으로 하시면 됩니다.",
  } satisfies SSETextEvent,
  { type: "done", messageId: 1001, remaining: 14 } satisfies SSEDoneEvent,
];

export const MOCK_SSE_SEQUENCE_LOW: SSEEvent[] = [
  {
    type: "meta",
    subtype: "document",
    confidence: "low",
    sources: [],
  } satisfies SSEMetaEvent,
  {
    type: "text",
    content: "관련 규정을 정확히 파악하기 어렵습니다. ",
  } satisfies SSETextEvent,
  {
    type: "text",
    content: "학과 사무실에 직접 문의하시는 것을 권장합니다.",
  } satisfies SSETextEvent,
  {
    type: "text",
    content: "\n\n담당자 연락처는 학교 홈페이지에서 확인하실 수 있습니다.",
  } satisfies SSETextEvent,
  { type: "done", messageId: 1002, remaining: 13 } satisfies SSEDoneEvent,
];

export const MOCK_SSE_FALLBACK: SSEFallbackEvent = {
  type: "fallback",
  message:
    "죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다. 아래 관련 질문을 참고해 보세요.",
  suggestedQuestions: [
    "휴학 신청 기간이 언제인가요?",
    "수강신청은 어떻게 하나요?",
    "장학금 종류가 어떻게 되나요?",
    "졸업 요건이 무엇인가요?",
  ],
};

export const MOCK_RECOMMENDED_QUESTIONS: RecommendedQuestion[] = [
  { questionId: "rq-001", content: "이번 학기 수강신청 기간이 언제인가요?" },
  { questionId: "rq-002", content: "휴학 신청은 어떻게 하나요?" },
  { questionId: "rq-003", content: "성적우수 장학금 기준이 무엇인가요?" },
  { questionId: "rq-004", content: "복수전공 신청 조건이 어떻게 되나요?" },
  { questionId: "rq-005", content: "졸업 이수학점은 몇 학점인가요?" },
];
