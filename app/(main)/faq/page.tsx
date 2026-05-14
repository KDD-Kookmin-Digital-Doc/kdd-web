"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFAQ } from "@/hooks/useFAQ";
import { getDocumentDetail } from "@/lib/api/services/document.service";
import { ApiError, ERROR_MESSAGES } from "@/lib/api/errors";
import { FAQSearch } from "@/components/faq/FAQSearch";
import { FAQCategoryFilter } from "@/components/faq/FAQCategoryFilter";
import { FAQList } from "@/components/faq/FAQList";
import { FAQTopicTree } from "@/components/faq/FAQTopicTree";

const PDFViewer = dynamic(
  () =>
    import("@/components/shared/PDFViewer").then((m) => ({
      default: m.PDFViewer,
    })),
  { ssr: false },
);

interface PDFViewerState {
  open: boolean;
  fileUrl: string;
  title: string;
  initialPage: number;
}

export default function FaqPage() {
  const router = useRouter();

  const {
    searchQuery,
    setSearchQuery,
    selectedTopic,
    setSelectedTopic,
    sort,
    setSort,
    openFaqId,
    toggleFaq,
    feedbacks,
    setFeedback,
    filteredFAQs,
    topics,
    isLoading,
  } = useFAQ();

  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  const [pdfViewer, setPdfViewer] = useState<PDFViewerState>({
    open: false,
    fileUrl: "",
    title: "",
    initialPage: 1,
  });
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleOpenPDF = async (documentId: number, page: number) => {
    setPdfError(null);
    try {
      const detail = await getDocumentDetail(documentId);
      if (!detail.fileUrl) {
        setPdfError("파일을 사용할 수 없습니다.");
        return;
      }
      setPdfViewer({
        open: true,
        fileUrl: detail.fileUrl,
        title: detail.title,
        initialPage: page,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (ERROR_MESSAGES[err.code] ?? err.message)
          : "문서를 불러올 수 없습니다.";
      setPdfError(msg);
    }
  };

  const handleClosePDF = () => {
    setPdfViewer((prev) => ({ ...prev, open: false }));
  };

  const newCount = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now는 관측용(7일 이내 FAQ 뱃지 계산)이며 결정적 출력이 필요 없음
    const now = Date.now();
    return filteredFAQs.filter((f) => {
      const diffDays = Math.floor(
        (now - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays <= 7;
    }).length;
  }, [filteredFAQs]);

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* 헤더 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-[18px] font-semibold text-foreground">
          자주 묻는 질문
        </span>
        {newCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            +{newCount} NEW
          </span>
        )}
      </header>

      {/* 뷰 모드 탭 */}
      <div className="flex shrink-0 border-b border-border bg-background px-4">
        <button
          className={cn(
            "px-3 py-3 text-sm font-medium transition-colors",
            viewMode === "tree"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setViewMode("tree")}
        >
          카테고리별
        </button>
        <button
          className={cn(
            "px-3 py-3 text-sm font-medium transition-colors",
            viewMode === "list"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setViewMode("list")}
        >
          전체 질문 목록
        </button>
      </div>

      {/* 검색 + 정렬 (두 탭에서 동일 높이 유지) */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-stretch gap-2">
          <div className="flex-1">
            <FAQSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "popular")}
            className="h-10 shrink-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="정렬 기준"
          >
            <option value="newest">최신순</option>
            <option value="popular">도움순</option>
          </select>
        </div>
      </div>

      {/* PDF 에러 메시지 */}
      {pdfError && (
        <div className="shrink-0 bg-destructive/5 px-4 py-2">
          <p className="mx-auto max-w-4xl text-sm text-destructive">
            {pdfError}
          </p>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            </div>
          ) : viewMode === "list" ? (
            <>
              <FAQCategoryFilter
                topics={topics}
                selectedTopic={selectedTopic}
                onSelect={setSelectedTopic}
              />
              <FAQList
                faqs={filteredFAQs}
                openFaqId={openFaqId}
                onToggleFaq={toggleFaq}
                feedbacks={feedbacks}
                onFeedback={setFeedback}
                onOpenPDF={handleOpenPDF}
              />
            </>
          ) : (
            <FAQTopicTree
              faqs={filteredFAQs}
              openFaqId={openFaqId}
              onToggleFaq={toggleFaq}
              feedbacks={feedbacks}
              onFeedback={setFeedback}
              onOpenPDF={handleOpenPDF}
            />
          )}
        </div>
      </div>

      <PDFViewer
        open={pdfViewer.open}
        onClose={handleClosePDF}
        fileUrl={pdfViewer.fileUrl}
        title={pdfViewer.title}
        initialPage={pdfViewer.initialPage}
      />
    </div>
  );
}
