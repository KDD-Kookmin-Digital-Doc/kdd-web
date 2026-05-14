"use client";

import { useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Folder,
  FolderOpen,
  ChevronRight,
  FileText,
  Eye,
  Download,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import type { CategoryNodeItem, DocumentItem } from "@/hooks/useDocuments";

const PAGE_SIZE = 10;

// ──────────────────────────────────────────────
// 카테고리 트리 노드 (인라인 문서 포함)
// ──────────────────────────────────────────────

interface CategoryTreeNodeProps {
  node: CategoryNodeItem;
  expandedNodes: Set<string>;
  selectedCategoryId: string | null;
  onToggleNode: (id: string) => void;
  onSelectCategory: (id: string | null) => void;
  onDocumentClick: (documentId: string) => void;
  categoryDocumentsMap: Map<string, DocumentItem[]>;
  depth?: number;
}

function CategoryTreeNode({
  node,
  expandedNodes,
  selectedCategoryId,
  onToggleNode,
  onSelectCategory,
  onDocumentClick,
  categoryDocumentsMap,
  depth = 0,
}: CategoryTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.categoryId);
  const isSelected = selectedCategoryId === node.categoryId;

  const inlineDocs =
    isExpanded && !hasChildren
      ? (categoryDocumentsMap.get(node.categoryId) ?? null)
      : null;

  const handleClick = () => {
    onToggleNode(node.categoryId);
    onSelectCategory(isSelected ? null : node.categoryId);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-lg py-2.5 pr-3 text-sm transition-all duration-150",
          isExpanded
            ? "bg-primary/8 text-primary font-medium shadow-sm"
            : isSelected
              ? "bg-accent text-primary font-medium"
              : "text-foreground hover:bg-secondary/50",
        )}
        aria-expanded={isExpanded}
      >
        {/* 펼쳐진 노드 좌측 활성 인디케이터 바 */}
        {isExpanded && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
          />
        )}
        <ChevronRight
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            isExpanded ? "rotate-90 text-primary" : "text-muted-foreground",
          )}
        />
        {isExpanded ? (
          <FolderOpen className="size-4 shrink-0 text-primary" />
        ) : (
          <Folder
            className={cn(
              "size-4 shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground",
            )}
          />
        )}
        <span className="flex-1 text-left">{node.name}</span>
      </button>

      {/* 자식 노드: 좌측 가이드 라인 */}
      {hasChildren && isExpanded && (
        <div
          className="relative ml-3 border-l border-border/60 pl-1"
          style={{ marginLeft: `${depth * 20 + 18}px` }}
        >
          {node.children!.map((child) => (
            <CategoryTreeNode
              key={child.categoryId}
              node={child}
              expandedNodes={expandedNodes}
              selectedCategoryId={selectedCategoryId}
              onToggleNode={onToggleNode}
              onSelectCategory={onSelectCategory}
              onDocumentClick={onDocumentClick}
              categoryDocumentsMap={categoryDocumentsMap}
              depth={0}
            />
          ))}
        </div>
      )}

      {/* 리프 노드 인라인 문서 목록 */}
      {inlineDocs !== null && (
        <div
          style={{ paddingLeft: `${depth * 20 + 32}px` }}
          className="border-l border-border/40 ml-3 pb-1"
        >
          {inlineDocs.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              이 카테고리에 문서가 없습니다
            </p>
          ) : (
            inlineDocs.map((doc) => (
              <button
                key={doc.documentId}
                onClick={() => onDocumentClick(doc.documentId)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/50"
              >
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-foreground">
                  {doc.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {doc.updatedAt}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 문서 행
// ──────────────────────────────────────────────

interface DocRowProps {
  document: {
    documentId: string;
    title: string;
    category: string;
    updatedAt: string;
    viewCount?: number;
  };
  onClick: () => void;
}

function DocRow({ document, onClick }: DocRowProps) {
  return (
    <div
      className="flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-secondary/30"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{document.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {document.category && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {document.category}
            </span>
          )}
          <span>{document.updatedAt}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
        {document.viewCount !== undefined && (
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {document.viewCount.toLocaleString()}
          </span>
        )}
        <button
          className="rounded p-1 transition-colors hover:bg-secondary"
          onClick={(e) => e.stopPropagation()}
          aria-label="다운로드"
        >
          <Download className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────────

export default function ResourcesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const {
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    selectedCategoryId,
    setSelectedCategoryId,
    activeTab,
    setActiveTab,
    page,
    setPage,
    expandedNodes,
    toggleNode,
    documents,
    categoryDocumentsMap,
    categoryTree,
    popularDocuments,
    totalCount,
    totalPages,
    isLoading,
    isPopularLoading,
    listError,
    popularError,
  } = useDocuments();

  // URL의 tab 파라미터 ↔ activeTab 동기화
  // 뒤로가기/북마크 등으로 URL이 먼저 바뀌는 경우를 처리 (이전 탭 복원)
  useEffect(() => {
    if (tabParam === "list" || tabParam === "popular" || tabParam === "tree") {
      if (tabParam !== activeTab) setActiveTab(tabParam);
    }
    // 의도: tabParam 변경 시에만 activeTab을 끌어올림. 반대 방향은 handleTabChange가 담당.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // 탭 클릭 시 상태 + URL을 함께 갱신 (뒤로가기 시 복원 가능하도록)
  const handleTabChange = useCallback(
    (tab: "popular" | "tree" | "list") => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [setActiveTab, searchParams, router, pathname],
  );

  const handleDocumentClick = useCallback(
    (documentId: string) => {
      router.push(`/resources/${documentId}`);
    },
    [router],
  );

  const handleSelectCategory = useCallback(
    (id: string | null) => {
      setSelectedCategoryId(id);
    },
    [setSelectedCategoryId],
  );

  const rootCategoryNames = useMemo(
    () => categoryTree.map((n) => n.name),
    [categoryTree],
  );

  const totalPagesCalc = Math.max(
    totalPages,
    Math.ceil(documents.length / PAGE_SIZE),
  );
  const pagedDocuments = documents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* 상단 헤더 바 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-[18px] font-semibold text-foreground">자료</span>
      </header>

      {/* 탭 바 */}
      <div className="flex shrink-0 border-b border-border bg-background px-4">
        {(["popular", "tree", "list"] as const).map((tab) => {
          const labels = {
            popular: "인기 문서",
            tree: "카테고리 탐색",
            list: "전체 문서 목록",
          };
          return (
            <button
              key={tab}
              className={cn(
                "px-3 py-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleTabChange(tab)}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4">
          {/* ── 카테고리 탐색 탭 ── */}
          {activeTab === "tree" && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                카테고리를 선택하면 해당 카테고리에 속한 문서를 확인할 수
                있습니다.
              </p>
              {categoryTree.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  카테고리를 불러오는 중...
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {categoryTree.map((node) => (
                    <CategoryTreeNode
                      key={node.categoryId}
                      node={node}
                      expandedNodes={expandedNodes}
                      selectedCategoryId={selectedCategoryId}
                      onToggleNode={toggleNode}
                      onSelectCategory={handleSelectCategory}
                      onDocumentClick={handleDocumentClick}
                      categoryDocumentsMap={categoryDocumentsMap}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 문서 목록 탭 ── */}
          {activeTab === "list" && (
            <div>
              {/* 검색바 */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="문서 제목으로 검색..."
                  className="w-full rounded-lg bg-muted py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* 카테고리 필터 칩 + 정렬 */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex flex-1 flex-wrap gap-1.5">
                  <button
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      !selectedCategoryId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary",
                    )}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    전체
                  </button>
                  {rootCategoryNames.map((cat) => {
                    const node = categoryTree.find((n) => n.name === cat);
                    return (
                      <button
                        key={cat}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          selectedCategoryId === node?.categoryId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-secondary",
                        )}
                        onClick={() =>
                          setSelectedCategoryId(node?.categoryId ?? null)
                        }
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value as "latest" | "popular")
                  }
                  className="shrink-0 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
              </div>

              <p className="mb-2 text-xs text-muted-foreground">
                총 {totalCount || documents.length}개 문서
              </p>

              {listError ? (
                <div className="flex items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 py-16 text-sm text-destructive">
                  {listError}
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-border py-16 text-sm text-muted-foreground">
                  불러오는 중...
                </div>
              ) : pagedDocuments.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-border py-16 text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </div>
              ) : (
                <div className="rounded-xl border border-border">
                  {pagedDocuments.map((doc) => (
                    <DocRow
                      key={doc.documentId}
                      document={doc}
                      onClick={() => handleDocumentClick(doc.documentId)}
                    />
                  ))}
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPagesCalc > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                  <button
                    className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    이전
                  </button>
                  {Array.from({ length: totalPagesCalc }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        className={cn(
                          "size-7 rounded text-xs transition-colors",
                          p === page
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-secondary",
                        )}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                    onClick={() => setPage(Math.min(totalPagesCalc, page + 1))}
                    disabled={page === totalPagesCalc}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 인기 문서 탭 ── */}
          {activeTab === "popular" && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Flame className="size-4 text-popular-icon" />
                <span className="text-sm font-semibold text-foreground">
                  인기 문서
                </span>
              </div>
              {popularError ? (
                <div className="flex items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 py-16 text-sm text-destructive">
                  {popularError}
                </div>
              ) : isPopularLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-border py-16 text-sm text-muted-foreground">
                  불러오는 중...
                </div>
              ) : popularDocuments.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-border py-16 text-sm text-muted-foreground">
                  인기 문서가 없습니다
                </div>
              ) : (
                <div className="rounded-xl border border-border">
                  {popularDocuments.map((doc) => (
                    <DocRow
                      key={doc.documentId}
                      document={{
                        documentId: String(doc.documentId),
                        title: doc.title,
                        category: doc.category,
                        updatedAt: doc.updatedAt,
                        viewCount: doc.viewCount,
                      }}
                      onClick={() =>
                        handleDocumentClick(String(doc.documentId))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
