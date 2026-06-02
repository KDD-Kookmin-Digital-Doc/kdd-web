"use client";

import { use, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Eye,
  ExternalLink,
  Bot,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { getDocumentDetail } from "@/lib/api/services/document.service";
import { getFAQList } from "@/lib/api/services/faq.service";
import type { DocumentDetailPublicResponse } from "@/types/api/document";
import type { FAQItem } from "@/types/api/faq";

const PDFViewer = dynamic(
  () => import("@/components/shared/PDFViewer").then((m) => ({ default: m.PDFViewer })),
  { ssr: false }
);

interface PDFViewerState {
  open: boolean;
}

export default function ResourceFilePage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = use(params);
  const router = useRouter();

  const [document, setDocument] = useState<DocumentDetailPublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfViewer, setPdfViewer] = useState<PDFViewerState>({ open: false });
  const [relatedFaqs, setRelatedFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    // setState를 이펙트 본문에서 동기 호출하면 cascading render 경고가 발생한다.
    // 비동기 함수로 감싸 모든 상태 갱신이 await 경계 또는 콜백 안에서 일어나도록 한다.
    async function load() {
      const docId = Number(fileId);
      if (!Number.isInteger(docId)) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const detail = await getDocumentDetail(docId);
        if (cancelled) return;
        setDocument(detail);

        // 관련 FAQ 로드: 전체 목록을 받아 카테고리명 기반으로 클라이언트 필터링
        // (백엔드 topic enum과 프론트 카테고리명이 일치하지 않으므로 전체 로드 후 fuzzy 매칭)
        try {
          const res = await getFAQList();
          if (cancelled) return;
          const categoryLower = detail.category.toLowerCase();
          const matched = res.data.filter(
            (f) =>
              f.topic === detail.category ||
              f.question.toLowerCase().includes(categoryLower) ||
              f.answer.toLowerCase().includes(categoryLower),
          );
          setRelatedFaqs(matched.slice(0, 5));
        } catch {
          if (!cancelled) setRelatedFaqs([]);
        }
      } catch {
        if (!cancelled) setDocument(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const handleOpenPDF = () => {
    setPdfViewer({ open: true });
  };

  const handleClosePDF = () => {
    setPdfViewer({ open: false });
  };

  // 어디서 진입했는지에 관계없이 직전 페이지로 복귀.
  // 히스토리가 비어 있으면 자료 루트(인기 문서)로 폴백.
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/resources");
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="이전 페이지로"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-[18px] font-semibold text-foreground">문서 상세</span>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">문서를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const hasFile = !!document.fileUrl;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* 상단 헤더 바 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="이전 페이지로"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-[18px] font-semibold text-foreground">
          문서 상세
        </span>
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* 카테고리 배지 */}
          {document.category && (
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {document.category}
            </span>
          )}

          {/* 제목 */}
          <h1 className="mb-3 text-xl font-bold leading-snug text-foreground">
            {document.title}
          </h1>

          {/* 메타 정보 */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {document.updatedAt && (
              <span>
                {new Date(document.updatedAt).toLocaleDateString("ko-KR")}
              </span>
            )}
            {document.viewCount !== undefined && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  {document.viewCount.toLocaleString()}
                </span>
              </>
            )}
          </div>

          {/* 뷰어에서 열기 */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-border px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {hasFile
                ? "문서를 PDF 뷰어에서 확인하세요."
                : "API 연동 후 PDF 뷰어에서 열 수 있습니다."}
            </p>
            <button
              onClick={handleOpenPDF}
              disabled={!hasFile}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              aria-label="뷰어에서 열기"
            >
              <ExternalLink className="size-4" />
              뷰어에서 열기
            </button>
          </div>

          {/* 첨부파일 카드 */}
          <div className="mb-6 rounded-xl border border-border">
            <div className="border-b border-border px-4 py-3">
              <span className="text-sm font-medium text-foreground">
                첨부파일
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {document.title}
                  </p>
                </div>
              </div>
              {hasFile && document.fileUrl && (
                <a
                  href={document.fileUrl}
                  download
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  aria-label="다운로드"
                >
                  다운로드
                </a>
              )}
            </div>
          </div>

          {/* 통계 푸터 */}
          <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border border-border px-4 py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="size-4" />
              <span>조회수</span>
              <span className="font-medium text-foreground">
                {document.viewCount?.toLocaleString() ?? "0"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bot className="size-4" />
              <span>AI 참조 횟수</span>
              <span className="font-medium text-foreground">-</span>
            </div>
          </div>

          {/* 관련 FAQ 섹션 */}
          {relatedFaqs.length > 0 && (
            <div className="rounded-xl border border-border">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <HelpCircle className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  관련 FAQ
                </span>
              </div>
              <div>
                {relatedFaqs.map((faq) => (
                  <button
                    key={faq.faqId}
                    onClick={() =>
                      router.push(`/faq?q=${encodeURIComponent(faq.question)}`)
                    }
                    className="flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-secondary/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {faq.question}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PDFViewer
        open={pdfViewer.open}
        onClose={handleClosePDF}
        fileUrl={document.fileUrl ?? ""}
        title={document.title}
        initialPage={1}
      />
    </div>
  );
}
