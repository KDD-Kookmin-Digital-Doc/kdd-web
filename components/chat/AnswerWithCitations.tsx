"use client";

import { useRef, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCitations } from "@/lib/parseCitations";
import type { Source } from "@/types/chat";

interface AnswerWithCitationsProps {
  content: string;
  rawSources: Source[];
  onOpenPDF?: (documentId: number, page: number, chunkId?: number) => void;
  streaming?: boolean;
}

/**
 * 구글 AI Overview 스타일 인라인 citation 컴포넌트.
 * - 본문 내 {{N}} 마커를 인라인 뱃지로 렌더
 * - 연속된 마커는 그룹으로 묶어 "문서명 +N" 형태로 표시
 * - 뱃지 클릭 시 출처 카드 팝업 표시
 */
export function AnswerWithCitations({
  content,
  rawSources,
  onOpenPDF,
  streaming,
}: AnswerWithCitationsProps) {
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const segments = parseCitations(content, rawSources, streaming);

  // 연속된 마커를 그룹으로 묶기
  const groupedSegments = groupConsecutiveMarkers(segments);

  const handleBadgeClick = (groupIdx: number) => {
    setActivePopup((prev) => (prev === groupIdx ? null : groupIdx));
  };

  const handleOutsideClick = () => {
    setActivePopup(null);
  };

  return (
    <span onClick={handleOutsideClick}>
      {groupedSegments.map((group, groupIdx) => {
        if (group.type === "text") {
          return <span key={groupIdx}>{group.value}</span>;
        }

        // 마커 그룹
        const sources = group.sources;
        const firstSource = sources[0];
        const extraCount = sources.length - 1;
        const isActive = activePopup === groupIdx;

        return (
          <span
            key={groupIdx}
            className="relative inline-block align-baseline"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={cn(
                "ml-0.5 inline-flex items-center gap-1 rounded-full",
                "border border-border/50 bg-muted/60 px-1.5 py-0.5",
                "text-[11px] leading-none text-muted-foreground",
                "transition-all hover:bg-muted hover:text-foreground",
                "align-middle",
                isActive && "bg-muted text-foreground ring-1 ring-primary/30"
              )}
              onClick={() => handleBadgeClick(groupIdx)}
              aria-label={`출처: ${firstSource.documentTitle} p.${firstSource.page}${extraCount > 0 ? ` 외 ${extraCount}건` : ""}`}
            >
              <FileText className="size-3 shrink-0" />
              <span className="max-w-20 truncate">
                {truncateTitle(firstSource.documentTitle)}
              </span>
              {extraCount > 0 && (
                <span className="font-medium text-primary">
                  +{extraCount}
                </span>
              )}
            </button>

            {/* 출처 카드 팝업 */}
            {isActive && (
              <div
                ref={popupRef}
                className={cn(
                  "absolute left-0 top-full z-50 mt-1.5",
                  "w-64 rounded-lg border border-border bg-popover p-0",
                  "shadow-lg animate-in fade-in-0 zoom-in-95"
                )}
              >
                {sources.map((source, srcIdx) => (
                  <button
                    key={srcIdx}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2.5 p-3 text-left",
                      "transition-colors hover:bg-muted/50",
                      srcIdx > 0 && "border-t border-border/50"
                    )}
                    onClick={() => {
                      onOpenPDF?.(source.documentId, source.page, source.chunkId);
                      setActivePopup(null);
                    }}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-popover-foreground">
                        {source.documentTitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        p.{source.page}
                      </p>
                    </div>
                    <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </span>
        );
      })}
    </span>
  );
}

// ─── 유틸리티 ───

interface TextGroup {
  type: "text";
  value: string;
}

interface MarkerGroup {
  type: "markers";
  sources: Source[];
  indices: number[];
}

type GroupedSegment = TextGroup | MarkerGroup;

/**
 * 연속된 마커 세그먼트를 하나의 그룹으로 묶는다.
 * "답변입니다{{1}}{{2}}{{3}}. 다음 문장" → [text, markerGroup(3개), text]
 */
function groupConsecutiveMarkers(
  segments: ReturnType<typeof parseCitations>
): GroupedSegment[] {
  const result: GroupedSegment[] = [];

  for (const seg of segments) {
    if (seg.type === "text") {
      result.push({ type: "text", value: seg.value });
    } else {
      const last = result[result.length - 1];
      if (last && last.type === "markers") {
        last.sources.push(seg.source);
        last.indices.push(seg.n);
      } else {
        result.push({
          type: "markers",
          sources: [seg.source],
          indices: [seg.n],
        });
      }
    }
  }

  return result;
}

/** 문서 제목을 짧게 축약 */
function truncateTitle(title: string): string {
  // 확장자 제거
  const name = title.replace(/\.(pdf|docx?|xlsx?|pptx?|hwp)$/i, "").trim();
  if (name.length <= 12) return name;
  return name.slice(0, 10) + "…";
}
