"use client";

import { useState, useCallback } from "react";
import {
  MessageSquare,
  CheckSquare,
  Square,
  ChevronDown,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminFAQ } from "@/hooks/useAdminFAQ";
import { MOCK_FAQ_TOPICS } from "@/constants/mock-faq";
import type { FAQCandidate } from "@/types/api/admin";

// ─── 상수 ───────────────────────────────────────────────────────────────────

const CANDIDATE_STATUS_CONFIG: Record<
  NonNullable<FAQCandidate["status"]>,
  { label: string; bg: string; fg: string }
> = {
  pending: { label: "검토 대기", bg: "bg-status-uploaded-bg", fg: "text-status-uploaded-fg" },
  approved: { label: "등록됨", bg: "bg-status-completed-bg", fg: "text-status-completed-fg" },
  rejected: { label: "반려", bg: "bg-status-failed-bg", fg: "text-status-failed-fg" },
  registered: { label: "등록됨", bg: "bg-status-completed-bg", fg: "text-status-completed-fg" },
};

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

// ─── 등록 모달 ──────────────────────────────────────────────────────────────

interface RegisterModalProps {
  count: number;
  onRegister: (topic: string) => void;
  onClose: () => void;
}

function RegisterModal({ count, onRegister, onClose }: RegisterModalProps) {
  const topics = MOCK_FAQ_TOPICS.filter((t) => t.topic !== "all");
  const [registerCategory, setRegisterCategory] = useState(
    topics[0]?.topic ?? "",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">FAQ 등록</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          선택한{" "}
          <span className="font-semibold text-foreground">{count}개</span>{" "}
          항목을 FAQ로 등록합니다.
          <br />
          카테고리를 지정해 주세요.
        </p>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-border bg-secondary px-3 py-2.5 pr-8 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
            value={registerCategory}
            onChange={(e) => setRegisterCategory(e.target.value)}
          >
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onRegister(registerCategory)}
            className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAQTab 메인 ─────────────────────────────────────────────────────────────

export function FAQTab() {
  const { candidates, approveCandidate, rejectCandidate } = useAdminFAQ();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const visibleCandidates = candidates.filter((c) => {
    if (filterStatus !== "all") {
      // "registered" 필터는 낙관적 업데이트 상태 "approved"도 포함
      const matched =
        filterStatus === "registered"
          ? c.status === "registered" || c.status === "approved"
          : c.status === filterStatus;
      if (!matched) return false;
    }
    if (filterTopic !== "all" && c.topic !== filterTopic) return false;
    return true;
  });

  const pendingSelected = [...selectedIds].filter((id) => {
    const c = candidates.find((x) => x.candidateId === id);
    return c && c.status === "pending";
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const pendingVisibleIds = visibleCandidates
      .filter((c) => c.status === "pending")
      .map((c) => c.candidateId);
    const allSelected = pendingVisibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [visibleCandidates, selectedIds]);

  const handleBulkReject = useCallback(() => {
    selectedIds.forEach((id) => rejectCandidate(id));
    showToast(`${selectedIds.size}개 항목이 반려되었습니다.`);
    setSelectedIds(new Set());
  }, [selectedIds, rejectCandidate]);

  const handleBulkApprove = useCallback(
    async (topic: string) => {
      const results = await Promise.allSettled(
        pendingSelected.map((id) => approveCandidate(id, topic)),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        showToast(`${succeeded}개 등록 완료, ${failed}개 실패`);
      } else {
        showToast(`${succeeded}개 FAQ가 등록되었습니다.`);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingSelected.forEach((id) => next.delete(id));
        return next;
      });
      setShowRegisterModal(false);
    },
    [pendingSelected, approveCandidate],
  );

  const pendingVisible = visibleCandidates.filter(
    (c) => c.status === "pending",
  );
  const allPendingSelected =
    pendingVisible.length > 0 &&
    pendingVisible.every((c) => selectedIds.has(c.candidateId));

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle
            icon={<CheckSquare className="size-4" />}
            title="FAQ 후보 관리"
          />
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-7 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="pending">검토 대기</option>
                <option value="rejected">반려</option>
                <option value="registered">등록됨</option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <div className="relative">
              <select
                className="appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-7 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
              >
                {MOCK_FAQ_TOPICS.map((t) => (
                  <option
                    key={t.topic}
                    value={t.topic === "all" ? "all" : t.topic}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* 선택된 항목 액션 바 */}
        {pendingSelected.length > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
            <span className="text-[13px] font-semibold text-blue-700">
              {pendingSelected.length}개 선택됨
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleBulkReject}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/5"
            >
              <X size={13} />
              반려
            </button>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus size={13} />
              FAQ로 등록
            </button>
          </div>
        )}

        {/* 목록 */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* 헤더 */}
          <div className="flex items-center gap-3 border-b border-border bg-secondary px-4 py-2.5">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
            >
              {allPendingSelected ? (
                <CheckSquare size={16} className="text-primary" />
              ) : (
                <Square size={16} />
              )}
            </button>
            <span className="flex-1 text-xs font-semibold text-muted-foreground">
              질문 / 답변
            </span>
            <span className="w-[80px] text-center text-xs font-semibold text-muted-foreground">
              상태
            </span>
            <span className="w-[80px] text-center text-xs font-semibold text-muted-foreground">
              생성일
            </span>
          </div>

          {visibleCandidates.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-muted-foreground">
              <MessageSquare
                size={32}
                className="mx-auto mb-2 text-muted-foreground/30"
              />
              FAQ 후보가 없습니다.
            </div>
          ) : (
            visibleCandidates.map((c, i) => {
              const statusCfg = CANDIDATE_STATUS_CONFIG[c.status ?? "pending"];
              const isExpanded = expandedId === c.candidateId;
              const isSelected = selectedIds.has(c.candidateId);
              const canSelect = c.status === "pending";

              return (
                <div
                  key={c.candidateId}
                  className={cn(
                    "transition-colors",
                    i < visibleCandidates.length - 1 &&
                      "border-b border-border/40",
                    c.status === "rejected"
                      ? "bg-secondary/30 opacity-60"
                      : "hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* 체크박스 */}
                    <button
                      type="button"
                      onClick={() => canSelect && toggleSelect(c.candidateId)}
                      className={cn(
                        "mt-0.5 shrink-0 transition-colors",
                        canSelect
                          ? "cursor-pointer text-muted-foreground hover:text-primary"
                          : "cursor-not-allowed text-muted-foreground/30",
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    {/* 질문/답변 */}
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : c.candidateId)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {c.topic && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                              getTopicStyle(c.topic).bg,
                              getTopicStyle(c.topic).fg,
                            )}
                          >
                            {getTopicStyle(c.topic).label}
                          </span>
                        )}
                        <p className="truncate text-[13px] font-medium text-foreground">
                          Q. {c.question}
                        </p>
                        <ChevronDown
                          size={14}
                          className={cn(
                            "shrink-0 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                      {!isExpanded && c.answerDraft && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          A. {c.answerDraft}
                        </p>
                      )}
                      {isExpanded && c.answerDraft && (
                        <div className="mt-2 rounded-xl bg-secondary p-3">
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">
                            답변 초안
                          </p>
                          <p className="text-[13px] leading-relaxed text-foreground">
                            {c.answerDraft}
                          </p>
                        </div>
                      )}
                    </button>

                    {/* 상태 */}
                    <div className="flex w-[80px] shrink-0 justify-center pt-0.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          statusCfg.bg,
                          statusCfg.fg,
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* 날짜 */}
                    <div className="w-[80px] shrink-0 pt-0.5 text-center">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 카운트 */}
        <p className="mt-3 text-right text-xs text-muted-foreground">
          전체 {candidates.length}개 · 검토 대기{" "}
          {candidates.filter((c) => c.status === "pending").length}개 · 반려{" "}
          {candidates.filter((c) => c.status === "rejected").length}개 · 등록됨{" "}
          {
            candidates.filter(
              (c) => c.status === "approved" || c.status === "registered",
            ).length
          }
          개
        </p>
      </div>

      {/* 등록 모달 */}
      {showRegisterModal && (
        <RegisterModal
          count={pendingSelected.length}
          onRegister={handleBulkApprove}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
