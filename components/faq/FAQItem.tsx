"use client";

import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { FAQAnswer } from "@/components/faq/FAQAnswer";
import type { FAQItem as FAQItemType } from "@/types/api/faq";

const TOPIC_STYLES: Record<string, { label: string; bg: string; fg: string }> = {
  academic: { label: "학사", bg: "bg-topic-academic-bg", fg: "text-topic-academic-fg" },
  graduation: { label: "졸업", bg: "bg-topic-graduation-bg", fg: "text-topic-graduation-fg" },
  enrollment_status: { label: "휴학·복학·자퇴", bg: "bg-topic-leave-bg", fg: "text-topic-leave-fg" },
  scholarship: { label: "장학", bg: "bg-topic-scholarship-bg", fg: "text-topic-scholarship-fg" },
  registration: { label: "등록·학적", bg: "bg-topic-registration-bg", fg: "text-topic-registration-fg" },
  curriculum: { label: "전공·교과", bg: "bg-topic-major-bg", fg: "text-topic-major-fg" },
  career: { label: "취업·현장실습", bg: "bg-topic-career-bg", fg: "text-topic-career-fg" },
  event: { label: "행사·특강", bg: "bg-topic-event-bg", fg: "text-topic-event-fg" },
  other: { label: "기타", bg: "bg-topic-other-bg", fg: "text-topic-other-fg" },
};

const DEFAULT_TOPIC = { label: "", bg: "bg-muted", fg: "text-foreground" };

function getTopicStyle(topic: string) {
  return TOPIC_STYLES[topic] ?? DEFAULT_TOPIC;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

function isNew(dateString: string): boolean {
  const now = new Date();
  const date = new Date(dateString);
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 7;
}

interface FAQItemProps {
  faq: FAQItemType;
  isOpen: boolean;
  onToggle: () => void;
  feedback: "up" | "down" | null;
  onFeedback: (faqId: string, type: "up" | "down") => void;
  onOpenPDF?: (documentId: number, page: number) => void;
}

export function FAQItem({
  faq,
  isOpen,
  onToggle,
  feedback,
  onFeedback,
  onOpenPDF,
}: FAQItemProps) {
  const showNew = isNew(faq.createdAt);

  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              getTopicStyle(faq.topic).bg,
              getTopicStyle(faq.topic).fg
            )}>
              {getTopicStyle(faq.topic).label}
            </span>
            {showNew && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                NEW
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {getRelativeTime(faq.createdAt)}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {faq.question}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <FAQAnswer
              answer={faq.answer}
              faqId={faq.faqId}
              question={faq.question}
              feedback={feedback}
              onFeedback={onFeedback}
              onOpenPDF={onOpenPDF}
              upCount={faq.helpful}
              downCount={faq.notHelpful}
              sources={faq.sources}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
