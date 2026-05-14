"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Upload,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminDocuments } from "@/hooks/useAdminDocuments";
import { uploadDocument } from "@/lib/api/services/admin.service";
import {
  getCategoryTree,
  getDocumentDetail,
} from "@/lib/api/services/document.service";
import { ApiError, ERROR_MESSAGES } from "@/lib/api/errors";
import { flattenLeafCategories, type FlatCategory } from "@/lib/categories";
import type { AdminDocument } from "@/types/api/admin";

const PDFViewer = dynamic(
  () => import("@/components/shared/PDFViewer").then((m) => m.PDFViewer),
  { ssr: false },
);

// ─── 상수 ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AdminDocument["status"],
  { label: string; bg: string; fg: string; icon: React.ReactNode }
> = {
  uploaded: {
    label: "업로드 완료",
    bg: "bg-status-uploaded-bg",
    fg: "text-status-uploaded-fg",
    icon: <Clock size={11} />,
  },
  processing: {
    label: "처리 중",
    bg: "bg-status-processing-bg",
    fg: "text-status-processing-fg",
    icon: <Loader2 size={11} className="animate-spin" />,
  },
  completed: {
    label: "완료",
    bg: "bg-status-completed-bg",
    fg: "text-status-completed-fg",
    icon: <CheckCircle2 size={11} />,
  },
  failed: {
    label: "실패",
    bg: "bg-status-failed-bg",
    fg: "text-status-failed-fg",
    icon: <XCircle size={11} />,
  },
  reprocessing: {
    label: "재처리 중",
    bg: "bg-status-reprocessing-bg",
    fg: "text-status-reprocessing-fg",
    icon: <RotateCcw size={11} className="animate-spin" />,
  },
};

const CATEGORY_STYLE: Record<string, { bg: string; fg: string }> = {
  "SW 학사공지": { bg: "bg-topic-academic-bg", fg: "text-topic-academic-fg" },
  "SW 취업공지": { bg: "bg-topic-career-bg", fg: "text-topic-career-fg" },
  "SW 장학공지": {
    bg: "bg-topic-scholarship-bg",
    fg: "text-topic-scholarship-fg",
  },
  "SW 특강 및 행사": { bg: "bg-topic-event-bg", fg: "text-topic-event-fg" },
  "SW 졸업요건": {
    bg: "bg-topic-graduation-bg",
    fg: "text-topic-graduation-fg",
  },
  "국민대학교 공지": { bg: "bg-topic-major-bg", fg: "text-topic-major-fg" },
};

const DEFAULT_CAT_STYLE = { bg: "bg-muted", fg: "text-muted-foreground" };

const STATUS_OPTIONS = [
  { value: "all", label: "전체 상태" },
  { value: "uploaded", label: "업로드 완료" },
  { value: "processing", label: "처리 중" },
  { value: "completed", label: "완료" },
  { value: "failed", label: "실패" },
  { value: "reprocessing", label: "재처리 중" },
] as const;

// ─── 헬퍼 ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ─── SectionTitle ───────────────────────────────────────────────────────────

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
  );
}

// ─── PDF 뷰어 상태 타입 ─────────────────────────────────────────────────────

interface PDFViewerState {
  open: boolean;
  fileUrl: string;
  title: string;
}

// ─── 업로드 모달 ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  categories: FlatCategory[];
  onClose: () => void;
  onUploaded: () => void;
}

function UploadModal({ categories, onClose, onUploaded }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategoryId, setUploadCategoryId] = useState<number | null>(
    categories[0]?.id ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 카테고리 목록이 늦게 로드된 경우 초기값을 채워준다
  useEffect(() => {
    if (uploadCategoryId === null && categories.length > 0) {
      setUploadCategoryId(categories[0].id);
    }
  }, [categories, uploadCategoryId]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setUploadFile(file);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!uploadFile || uploadCategoryId === null) return;
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);

    const data = {
      title: uploadFile.name.replace(/\.pdf$/i, ""),
      categoryId: uploadCategoryId,
      source: "SW",
    };
    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );

    try {
      await uploadDocument(formData);
      onUploaded();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (ERROR_MESSAGES[err.code] ?? err.message)
          : "업로드에 실패했습니다. 다시 시도해주세요.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-105 rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">문서 업로드</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* 드롭존 */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : uploadFile
                ? "border-primary bg-accent"
                : "border-border hover:border-primary hover:bg-accent/50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              setUploadFile(e.target.files?.[0] ?? null);
              setUploadError(null);
            }}
          />
          {uploadFile ? (
            <>
              <FileText size={28} className="mx-auto mb-2 text-primary" />
              <p className="text-[13px] font-semibold text-primary">
                {uploadFile.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <Upload
                size={28}
                className="mx-auto mb-2 text-muted-foreground/50"
              />
              <p className="text-[13px] text-muted-foreground">
                PDF 파일을 선택하거나 여기에 드래그하세요
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                PDF 파일만 지원됩니다
              </p>
            </>
          )}
        </div>

        {/* 카테고리 */}
        <div className="mt-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
            카테고리
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-border bg-secondary px-3 py-2.5 pr-8 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
              value={uploadCategoryId ?? ""}
              onChange={(e) => setUploadCategoryId(Number(e.target.value))}
              disabled={categories.length === 0}
            >
              {categories.length === 0 ? (
                <option value="">카테고리 로딩 중...</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullPath}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        {uploadError && (
          <p className="mt-3 text-xs text-destructive">{uploadError}</p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 rounded-xl border border-border py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!uploadFile || uploadCategoryId === null || isUploading}
            onClick={handleUpload}
            className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 size={13} className="animate-spin" />
                업로드 중...
              </span>
            ) : (
              "업로드"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DocsTab 메인 ────────────────────────────────────────────────────────────

export function DocsTab() {
  const {
    documents,
    searchQuery,
    setSearchQuery,
    deleteDocument,
    reprocessDocument,
    updateCategory,
    updateError,
    reload,
  } = useAdminDocuments();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pdfViewer, setPdfViewer] = useState<PDFViewerState>({
    open: false,
    fileUrl: "",
    title: "",
  });

  // 실제 백엔드 카테고리 트리에서 리프 카테고리 목록을 가져온다
  // (상위 카테고리는 문서에 연결할 수 없음 — DocumentService.PARENT_CATEGORY_NOT_ALLOWED)
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    getCategoryTree()
      .then((res) => setCategories(flattenLeafCategories(res.categories)))
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? (ERROR_MESSAGES[err.code] ?? err.message)
            : "카테고리 목록을 불러올 수 없습니다.";
        setCategoriesError(msg);
        setCategories([]);
      });
  }, []);

  const handleCategoryEdit = useCallback((id: number) => {
    setEditCategoryId((prev) => (prev === id ? null : id));
  }, []);

  const handlePreview = useCallback(async (doc: AdminDocument) => {
    try {
      const detail = await getDocumentDetail(doc.id);
      if (!detail.fileUrl) {
        setPreviewError("파일을 사용할 수 없습니다.");
        return;
      }
      setPreviewError(null);
      setPdfViewer({
        open: true,
        fileUrl: detail.fileUrl,
        title: detail.title,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (ERROR_MESSAGES[err.code] ?? err.message)
          : "문서를 불러올 수 없습니다.";
      setPreviewError(msg);
    }
  }, []);

  const filteredDocs = documents.filter((doc) => {
    if (statusFilter !== "all" && doc.status !== statusFilter) return false;
    if (categoryFilter !== "all" && String(doc.categoryId) !== categoryFilter)
      return false;
    return true;
  });

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle
            icon={<FileText className="size-4" />}
            title="문서 관리"
          />
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Upload size={14} />
            문서 업로드
          </button>
        </div>

        {/* 필터 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* 검색 */}
          <div className="flex min-w-40 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
              placeholder="문서명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-8 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-8 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.fullPath}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          {/* 삭제된 문서 토글 */}
          <button
            type="button"
            onClick={() => setShowDeleted((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] transition-colors",
              showDeleted
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-border text-muted-foreground",
            )}
          >
            <Trash2 size={13} />
            삭제된 문서 {showDeleted ? "숨기기" : "보기"}
          </button>
        </div>

        {/* 문서 목록 */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 border-b border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span>문서명</span>
            <span className="w-27.5 text-center">카테고리</span>
            <span className="w-22.5 text-center">상태</span>
            <span className="w-22.5 text-center">업로드일</span>
            <span className="w-25 text-center">작업</span>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-muted-foreground">
              <FileText
                size={32}
                className="mx-auto mb-2 text-muted-foreground/30"
              />
              조건에 맞는 문서가 없습니다.
            </div>
          ) : (
            filteredDocs.map((doc, i) => {
              const statusCfg = STATUS_CONFIG[doc.status];
              const catStyle =
                CATEGORY_STYLE[doc.categoryName] ?? DEFAULT_CAT_STYLE;

              return (
                <div
                  key={doc.id}
                  className={cn(
                    "grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                    i < filteredDocs.length - 1 && "border-b border-border/40",
                  )}
                >
                  {/* 문서명 */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText
                        size={14}
                        className="shrink-0 text-muted-foreground"
                      />
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {doc.title}
                      </p>
                    </div>
                  </div>

                  {/* 카테고리 */}
                  <div className="flex w-27.5 justify-center">
                    {editCategoryId === doc.id ? (
                      <select
                        autoFocus
                        className="appearance-none rounded-full border border-primary bg-background px-2 py-0.5 text-[11px] outline-none"
                        defaultValue={doc.categoryId}
                        onBlur={() => setEditCategoryId(null)}
                        onChange={async (e) => {
                          const newCategoryId = Number(e.target.value);
                          setEditCategoryId(null);
                          if (newCategoryId === doc.categoryId) return;
                          await updateCategory(doc.id, newCategoryId);
                        }}
                        disabled={categories.length === 0}
                      >
                        {categories.length === 0 ? (
                          <option value={doc.categoryId}>로딩 중...</option>
                        ) : (
                          categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.fullPath}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCategoryEdit(doc.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all hover:ring-2 hover:ring-primary/20",
                          catStyle.bg,
                          catStyle.fg,
                        )}
                        title="카테고리 수정"
                      >
                        {doc.categoryName}
                        <Edit2 size={9} />
                      </button>
                    )}
                  </div>

                  {/* 상태 */}
                  <div className="flex w-22.5 justify-center">
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        statusCfg.bg,
                        statusCfg.fg,
                      )}
                    >
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* 업로드일 */}
                  <div className="w-22.5 text-center">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>

                  {/* 작업 */}
                  <div className="flex w-25 items-center justify-center gap-1.5">
                    {/* 미리보기 */}
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="flex size-7 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
                      title="미리보기"
                    >
                      <Eye size={13} />
                    </button>

                    {(doc.status === "failed" ||
                      doc.status === "completed") && (
                      <button
                        type="button"
                        onClick={() => reprocessDocument(doc.id)}
                        className="flex size-7 items-center justify-center rounded-lg bg-accent text-primary transition-colors hover:bg-accent/80"
                        title="재처리"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                    {confirmDeleteId === doc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteDocument(doc.id);
                            setConfirmDeleteId(null);
                          }}
                          className="flex size-6 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                          title="삭제 확인"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex size-6 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80"
                          title="취소"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(doc.id)}
                        className="flex size-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 카테고리 로드 에러 */}
        {categoriesError && (
          <p className="mt-2 text-xs text-destructive">{categoriesError}</p>
        )}

        {/* 카테고리 변경 에러 */}
        {updateError && (
          <p className="mt-2 text-xs text-destructive">{updateError}</p>
        )}

        {/* 미리보기 에러 */}
        {previewError && (
          <p className="mt-2 text-xs text-destructive">{previewError}</p>
        )}

        {/* 카운트 */}
        <p className="mt-3 text-right text-xs text-muted-foreground">
          {filteredDocs.length}개 문서 표시 중 · 완료:{" "}
          {documents.filter((d) => d.status === "completed").length}개
        </p>
      </div>

      {showUploadModal && (
        <UploadModal
          categories={categories}
          onClose={() => setShowUploadModal(false)}
          onUploaded={reload}
        />
      )}

      <PDFViewer
        open={pdfViewer.open}
        onClose={() => setPdfViewer((prev) => ({ ...prev, open: false }))}
        fileUrl={pdfViewer.fileUrl}
        title={pdfViewer.title}
      />
    </div>
  );
}
