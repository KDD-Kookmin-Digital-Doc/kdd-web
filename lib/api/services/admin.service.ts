import { apiClient } from '@/lib/api/client';
import { delay } from '@/lib/api/mock';
import type {
  AdminDocumentListRequest,
  AdminDocumentListPageResponse,
  AdminStatisticsResponse,
  FAQCandidate,
  FAQCandidateListRequest,
  FAQCandidateListResponse,
  DocumentResponse,
  AdminUserListRequest,
  AdminUserListPageResponse,
  UpdateUserChatLimitRequest,
  UpdateUserChatLimitResponse,
  BulkUpdateChatLimitRequest,
  BulkUpdateChatLimitResponse,
  ResetUserUsageResponse,
  DefaultChatLimitResponse,
  UpdateDefaultChatLimitRequest,
  UpdateDefaultChatLimitResponse,
} from "@/types/api/admin";
import type { FAQListRequest, FAQListResponse, FAQItem } from "@/types/api/faq";
import {
  MOCK_ADMIN_DOCUMENTS,
  MOCK_ADMIN_STATISTICS,
  MOCK_FAQ_CANDIDATES,
} from "@/constants/mock-admin";
import { MOCK_FAQ_ITEMS } from "@/constants/mock-faq";
import { MOCK_ADMIN_USERS, MOCK_DEFAULT_CHAT_LIMIT } from '@/constants/mock-admin-users';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function getAdminDocuments(
  params?: AdminDocumentListRequest,
): Promise<AdminDocumentListPageResponse> {
  if (USE_MOCK) {
    await delay(400);
    return {
      data: MOCK_ADMIN_DOCUMENTS,
      totalCount: MOCK_ADMIN_DOCUMENTS.length,
      page: params?.page ?? 0,
      pageSize: params?.pageSize ?? 20,
      totalPages: Math.ceil(
        MOCK_ADMIN_DOCUMENTS.length / (params?.pageSize ?? 20),
      ),
    };
  }
  return apiClient.get<AdminDocumentListPageResponse>("/admin/documents", {
    params: {
      page: params?.page,
      size: params?.pageSize,
    },
  });
}

export async function deleteDocument(fileId: number): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await apiClient.delete<void>(`/admin/documents/${fileId}`);
}

export async function reprocessDocument(fileId: number): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await apiClient.post<void>(`/admin/documents/${fileId}/reprocess`);
}

export async function uploadDocument(
  data: FormData,
): Promise<DocumentResponse> {
  if (USE_MOCK) {
    await delay(800);
    return {
      id: Date.now(),
      title: (data.get("title") as string | null) ?? "업로드된 문서",
      categoryId: Number(data.get("categoryId")) || 1,
      categoryName: "기타",
      status: "uploaded",
      source: "SW",
      originalFilename: "document.pdf",
      fileSize: 0,
      createdAt: new Date().toISOString(),
    };
  }
  return apiClient.postFormData<DocumentResponse>("/admin/documents", data);
}

export async function updateDocumentCategory(
  fileId: number,
  categoryId: number,
): Promise<DocumentResponse> {
  if (USE_MOCK) {
    await delay(300);
    return {
      id: fileId,
      title: "문서",
      categoryId,
      categoryName: "기타",
      status: "completed",
      source: "SW",
      originalFilename: "document.pdf",
      fileSize: 0,
      createdAt: new Date().toISOString(),
    };
  }
  return apiClient.patch<DocumentResponse>(
    `/admin/documents/${fileId}/category`,
    { categoryId },
  );
}

// ── 백엔드 구현 완료 엔드포인트 ─────────────────────
// getStatistics, getFAQCandidates, approveCandidate, rejectCandidate

export async function getStatistics(): Promise<AdminStatisticsResponse> {
  if (USE_MOCK) {
    await delay(400);
    return MOCK_ADMIN_STATISTICS;
  }
  return apiClient.get<AdminStatisticsResponse>('/admin/statistics');
}

/** 백엔드 FAQ 후보 응답 DTO — answerDraft 필드명 주의 */
interface BackendFaqCandidateItem {
  candidateId: number;
  question: string;
  answerDraft?: string;
  topic?: string;
  status: string;
  frequency: number;
  createdAt: string;
}

interface BackendFaqCandidatePageResponse {
  data: BackendFaqCandidateItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toFaqCandidate(r: BackendFaqCandidateItem): FAQCandidate {
  return {
    candidateId: String(r.candidateId),
    question: r.question,
    answerDraft: r.answerDraft,
    topic: r.topic ?? 'other',
    status: (r.status?.toLowerCase() as FAQCandidate['status']) ?? 'pending',
    frequency: r.frequency,
    createdAt: r.createdAt,
  };
}

export async function getFAQCandidates(
  params?: FAQCandidateListRequest,
): Promise<FAQCandidateListResponse> {
  if (USE_MOCK) {
    await delay(400);
    return {
      data: MOCK_FAQ_CANDIDATES,
      totalCount: MOCK_FAQ_CANDIDATES.length,
      page: params?.page ?? 0,
      pageSize: params?.pageSize ?? 10,
      totalPages: Math.ceil(
        MOCK_FAQ_CANDIDATES.length / (params?.pageSize ?? 10),
      ),
    };
  }
  const res = await apiClient.get<BackendFaqCandidatePageResponse>(
    '/admin/faqs/candidates',
    {
      params: {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 20,
      },
    },
  );
  return {
    data: res.data.map(toFaqCandidate),
    totalCount: res.totalCount,
    page: res.page,
    pageSize: res.pageSize,
    totalPages: res.totalPages,
  };
}

/**
 * FAQ 후보 승인.
 * 백엔드: POST /admin/faqs/candidates/{id}/approve { topic }
 * topic은 관리자가 지정한 카테고리 (예: "academic", "graduation" 등)
 */
export async function approveCandidate(
  candidateId: string,
  topic: string,
): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await apiClient.post<{ faqId: number; question: string; answer: string; topic: string; createdAt: string }>(
    `/admin/faqs/candidates/${candidateId}/approve`,
    { topic },
  );
}

export async function rejectCandidate(candidateId: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await apiClient.patch<{ message: string }>(
    `/admin/faqs/candidates/${candidateId}/reject`,
  );
}

// ── 어드민 FAQ 관리 (실제 API 연결) ────────────────────────────────
// 백엔드에는 어드민 FAQ 목록 전용 엔드포인트는 없고 공개 목록(/faqs)과
// CRUD(/admin/faqs)만 있어 공개 목록을 그대로 재사용한다.

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

function toFaqItem(r: BackendFaqResponse): FAQItem {
  return {
    faqId: String(r.faqId),
    question: r.question,
    answer: r.answer,
    topic: r.topic,
    createdAt: r.createdAt,
    helpful: 0,
    notHelpful: 0,
  };
}

export async function getAdminFAQList(
  params?: FAQListRequest,
): Promise<FAQListResponse> {
  if (USE_MOCK) {
    await delay(400);
    return {
      data: MOCK_FAQ_ITEMS,
      totalCount: MOCK_FAQ_ITEMS.length,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: Math.ceil(MOCK_FAQ_ITEMS.length / (params?.pageSize ?? 10)),
    };
  }

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

  return {
    data: res.data.map(toFaqItem),
    totalCount: res.totalCount,
    page: res.page + 1,
    pageSize: res.pageSize,
    totalPages: res.totalPages,
  };
}

export interface AdminFAQCreateRequest {
  question: string;
  answer: string;
  topic: string;
}

export async function createAdminFAQ(
  data: AdminFAQCreateRequest,
): Promise<FAQItem> {
  if (USE_MOCK) {
    await delay(300);
    return {
      faqId: String(Date.now()),
      question: data.question,
      answer: data.answer,
      topic: data.topic,
      createdAt: new Date().toISOString(),
      helpful: 0,
      notHelpful: 0,
    };
  }
  const res = await apiClient.post<BackendFaqResponse>("/admin/faqs", data);
  return toFaqItem(res);
}

export interface AdminFAQUpdateRequest {
  question?: string;
  answer?: string;
  topic?: string;
}

export async function updateAdminFAQ(
  faqId: string | number,
  data: AdminFAQUpdateRequest,
): Promise<FAQItem> {
  if (USE_MOCK) {
    await delay(300);
    return {
      faqId: String(faqId),
      question: data.question ?? "",
      answer: data.answer ?? "",
      topic: data.topic ?? "other",
      createdAt: new Date().toISOString(),
      helpful: 0,
      notHelpful: 0,
    };
  }
  const res = await apiClient.patch<BackendFaqResponse>(
    `/admin/faqs/${faqId}`,
    data,
  );
  return toFaqItem(res);
}

export async function deleteAdminFAQ(faqId: string | number): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await apiClient.delete<void>(`/admin/faqs/${faqId}`);
}

// ── 관리자 사용자 관리 (채팅 사용량 제한) ──────────────────────────

export async function getAdminUsers(
  params?: AdminUserListRequest,
): Promise<AdminUserListPageResponse> {
  if (USE_MOCK) {
    await delay(400);
    let filtered = [...MOCK_ADMIN_USERS];
    if (params?.userType)
      filtered = filtered.filter((u) => u.userType === params.userType);
    if (params?.role)
      filtered = filtered.filter((u) => u.role === params.role);
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s),
      );
    }
    const page = params?.page ?? 0;
    const size = params?.size ?? 20;
    const start = page * size;
    const paged = filtered.slice(start, start + size);
    return {
      data: paged,
      totalCount: filtered.length,
      page,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size),
    };
  }
  return apiClient.get<AdminUserListPageResponse>("/admin/users", {
    params: {
      page: params?.page,
      size: params?.size,
      userType: params?.userType,
      role: params?.role,
      search: params?.search,
    },
  });
}

export async function updateUserChatLimit(
  userId: number,
  req: UpdateUserChatLimitRequest,
): Promise<UpdateUserChatLimitResponse> {
  if (USE_MOCK) {
    await delay(300);
    const user = MOCK_ADMIN_USERS.find((u) => u.id === userId);
    return {
      id: userId,
      email: user?.email ?? '',
      name: user?.name ?? '',
      role: user?.role ?? 'user',
      userType: user?.userType ?? 'student',
      dailyChatLimit: req.dailyChatLimit,
      todayUsed: user?.todayUsed ?? 0,
    };
  }
  return apiClient.patch<UpdateUserChatLimitResponse>(
    `/admin/users/${userId}/chat-limit`,
    req,
  );
}

export async function bulkUpdateChatLimit(
  req: BulkUpdateChatLimitRequest,
): Promise<BulkUpdateChatLimitResponse> {
  if (USE_MOCK) {
    await delay(500);
    return { updatedCount: req.userIds.length, dailyChatLimit: req.dailyChatLimit };
  }
  return apiClient.patch<BulkUpdateChatLimitResponse>(
    "/admin/users/chat-limit/bulk",
    req,
  );
}

export async function resetUserUsage(
  userId: number,
): Promise<ResetUserUsageResponse> {
  if (USE_MOCK) {
    await delay(300);
    return { dailyChatLimit: 30, todayUsed: 0, remaining: 30, resetsAt: '2026-04-17T00:00:00Z' };
  }
  return apiClient.post<ResetUserUsageResponse>(
    `/admin/users/${userId}/chat-usage/reset`,
  );
}

export async function getDefaultChatLimit(): Promise<DefaultChatLimitResponse> {
  if (USE_MOCK) {
    await delay(200);
    return { defaultChatLimit: MOCK_DEFAULT_CHAT_LIMIT };
  }
  return apiClient.get<DefaultChatLimitResponse>(
    "/admin/settings/default-chat-limit",
  );
}

export async function updateDefaultChatLimit(
  req: UpdateDefaultChatLimitRequest,
): Promise<UpdateDefaultChatLimitResponse> {
  if (USE_MOCK) {
    await delay(300);
    return { defaultChatLimit: req.defaultChatLimit };
  }
  return apiClient.patch<UpdateDefaultChatLimitResponse>(
    "/admin/settings/default-chat-limit",
    req,
  );
}

// ── 관리자 테스트 전용 ─────────────────────────────────────────

export interface ResetMyProfileResponse {
  userId: number;
  email: string;
  role: string;
  profileCompleted: boolean;
  deletedStudentProfile: boolean;
  deletedStaffProfile: boolean;
}

export async function resetMyProfile(): Promise<ResetMyProfileResponse> {
  if (USE_MOCK) {
    await delay(300);
    return {
      userId: 1,
      email: 'admin@kookmin.ac.kr',
      role: 'admin',
      profileCompleted: false,
      deletedStudentProfile: true,
      deletedStaffProfile: false,
    };
  }
  return apiClient.post<ResetMyProfileResponse>(
    '/admin/test/reset-my-profile',
    undefined,
    { params: { confirm: 'RESET-MY-PROFILE' } },
  );
}
