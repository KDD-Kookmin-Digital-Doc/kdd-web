import { apiClient } from '@/lib/api/client';
import { delay } from '@/lib/api/mock';
import type {
  CategoryTreeListResponse,
  DocumentListRequest,
  DocumentListPageResponse,
  DocumentDetailPublicResponse,
  PopularDocumentsResponse,
  DocumentByCategoryPageResponse,
} from '@/types/api/document';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const MOCK_CATEGORY_TREE: CategoryTreeListResponse = {
  categories: [
    {
      categoryId: 1,
      name: '학사규정',
      children: [
        { categoryId: 11, name: '수강신청', children: [] },
        { categoryId: 12, name: '휴학·복학', children: [] },
        { categoryId: 13, name: '졸업', children: [] },
      ],
    },
    {
      categoryId: 2,
      name: '장학',
      children: [
        { categoryId: 21, name: '교내장학', children: [] },
        { categoryId: 22, name: '국가장학', children: [] },
      ],
    },
    {
      categoryId: 3,
      name: '공지사항',
      children: [
        { categoryId: 31, name: '학사공지', children: [] },
        { categoryId: 32, name: '취업·현장실습', children: [] },
      ],
    },
  ],
};

const MOCK_DOCUMENTS: DocumentListPageResponse = {
  data: [
    { documentId: 1, title: '2026학년도 학사일정', category: '학사공지', updatedAt: '2026-03-01' },
    { documentId: 2, title: '수강신청 안내', category: '수강신청', updatedAt: '2026-02-15' },
    { documentId: 3, title: '장학금 신청 안내', category: '교내장학', updatedAt: '2026-02-10' },
  ],
  totalCount: 3,
  page: 0,
  pageSize: 20,
  totalPages: 1,
};

const MOCK_POPULAR: PopularDocumentsResponse = {
  documents: [
    { documentId: 1, title: '2026학년도 학사일정', category: '학사공지', viewCount: 1523, updatedAt: '2026-03-01' },
    { documentId: 2, title: '수강신청 안내', category: '수강신청', viewCount: 987, updatedAt: '2026-02-15' },
  ],
};

export async function getCategoryTree(): Promise<CategoryTreeListResponse> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_CATEGORY_TREE;
  }
  return apiClient.get<CategoryTreeListResponse>('/documents/categories');
}

export async function getDocuments(params?: DocumentListRequest): Promise<DocumentListPageResponse> {
  if (USE_MOCK) {
    await delay(400);
    return MOCK_DOCUMENTS;
  }
  return apiClient.get<DocumentListPageResponse>('/documents', {
    params: {
      categoryId: params?.categoryId,
      keyword: params?.keyword,
      sort: params?.sort,
      page: params?.page,
      pageSize: params?.pageSize,
    },
  });
}

// 문서 상세 mock — id별로 그럴듯한 제목/카테고리를 반환한다.
// fileUrl은 데모용 정적 PDF(public/mock/)를 가리켜 mock 모드에서도 뷰어가 동작한다.
const MOCK_PDF_URL = '/mock/sample-regulation.pdf';

const MOCK_DOCUMENT_DETAILS: Record<number, { title: string; category: string }> = {
  1: { title: '2026학년도 학사일정', category: '학사공지' },
  2: { title: '수강신청 안내', category: '수강신청' },
  3: { title: '장학금 신청 안내', category: '교내장학' },
  13: { title: '소프트웨어융합대학 졸업요건 안내', category: '졸업' },
};

export async function getDocumentDetail(documentId: number): Promise<DocumentDetailPublicResponse> {
  if (USE_MOCK) {
    await delay(300);
    const meta = MOCK_DOCUMENT_DETAILS[documentId] ?? {
      title: '국민대학교 학사 안내 문서',
      category: '학사규정',
    };
    return {
      documentId,
      title: meta.title,
      category: meta.category,
      fileUrl: MOCK_PDF_URL,
      viewCount: 1242,
      createdAt: '2026-02-01T00:00:00',
      updatedAt: '2026-03-01T00:00:00',
    };
  }
  return apiClient.get<DocumentDetailPublicResponse>(`/documents/${documentId}`);
}

export async function getPopularDocuments(): Promise<PopularDocumentsResponse> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_POPULAR;
  }
  return apiClient.get<PopularDocumentsResponse>('/documents/popular');
}

export async function getDocumentsByCategory(
  categoryId: number,
  params?: Omit<DocumentListRequest, 'categoryId' | 'keyword' | 'sort'>
): Promise<DocumentByCategoryPageResponse> {
  if (USE_MOCK) {
    await delay(300);
    return {
      data: [],
      totalCount: 0,
      page: 0,
      pageSize: 20,
      totalPages: 0,
    };
  }
  return apiClient.get<DocumentByCategoryPageResponse>('/documents/by-category', {
    params: {
      categoryId,
      page: params?.page,
      pageSize: params?.pageSize,
    },
  });
}
