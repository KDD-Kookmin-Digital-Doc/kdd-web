"use client";

import { useState } from "react";
import { Folder, FolderOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQItem } from "@/components/faq/FAQItem";
import type { FAQItem as FAQItemType } from "@/types/api/faq";

interface FAQTopicTreeProps {
  faqs: FAQItemType[];
  openFaqId: string | null;
  onToggleFaq: (faqId: string) => void;
  feedbacks: Record<string, "up" | "down" | null>;
  onFeedback: (faqId: string, type: "up" | "down") => void;
  onOpenPDF?: (documentId: number, page: number) => void;
}

const TOPIC_LABELS: Record<string, string> = {
  academic: "학사",
  graduation: "졸업",
  enrollment_status: "휴학·복학·자퇴",
  scholarship: "장학",
  registration: "등록·학적",
  curriculum: "전공·교과",
  career: "취업·현장실습",
  event: "행사·특강",
  other: "기타",
};

function getTopicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic;
}

export function FAQTopicTree({
  faqs,
  openFaqId,
  onToggleFaq,
  feedbacks,
  onFeedback,
  onOpenPDF,
}: FAQTopicTreeProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // topic별 그룹핑
  const grouped = faqs.reduce<Record<string, FAQItemType[]>>((acc, faq) => {
    const topic = faq.topic || "etc";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(faq);
    return acc;
  }, {});

  // FAQ 개수 많은 순으로 토픽 정렬
  const sortedTopics = Object.keys(grouped).sort(
    (a, b) => grouped[b].length - grouped[a].length
  );

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  if (sortedTopics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">검색 결과가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedTopics.map((topic) => {
        const items = grouped[topic];
        const isExpanded = expandedTopics.has(topic);

        return (
          <div
            key={topic}
            className="overflow-hidden rounded-lg border border-border bg-background"
          >
            <button
              onClick={() => toggleTopic(topic)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
            >
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
              {isExpanded ? (
                <FolderOpen className="size-4 shrink-0 text-primary" />
              ) : (
                <Folder className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 text-sm font-medium text-foreground">
                {getTopicLabel(topic)}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-border pl-8">
                {items.map((faq) => (
                  <FAQItem
                    key={faq.faqId}
                    faq={faq}
                    isOpen={openFaqId === faq.faqId}
                    onToggle={() => onToggleFaq(faq.faqId)}
                    feedback={feedbacks[faq.faqId] ?? null}
                    onFeedback={onFeedback}
                    onOpenPDF={onOpenPDF}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
