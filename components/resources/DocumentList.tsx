"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DocumentCard } from "@/components/resources/DocumentCard";
import type { Document } from "@/types/api/document";

interface DocumentListProps {
  documents: Document[];
  searchQuery: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: "latest" | "popular") => void;
  totalCount: number;
  onDocumentClick?: (documentId: string) => void;
  categories?: string[];
  selectedCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
}

export function DocumentList({
  documents,
  searchQuery,
  onSearchChange,
  totalCount,
  onDocumentClick,
  categories,
  selectedCategory,
  onCategoryChange,
}: DocumentListProps) {
  return (
    <div>
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="문서 제목으로 검색..."
            className="pl-9"
          />
        </div>
      </div>
      {categories && categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
            onClick={() => onCategoryChange?.(null)}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
              onClick={() => onCategoryChange?.(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <p className="mb-1 text-xs text-muted-foreground">
        총 {totalCount}개 문서
      </p>
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.documentId}
              document={doc}
              onClick={() => onDocumentClick?.(doc.documentId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
