"use client";

import { useState } from "react";
import {
  MessageSquare,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";

// ─── 카테고리 색상 (CSS 변수) ────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { fg: string; bg: string }> = {
  학사: { fg: "var(--topic-academic-fg)", bg: "var(--topic-academic-bg)" },
  "휴학·복학·자퇴": { fg: "var(--topic-leave-fg)", bg: "var(--topic-leave-bg)" },
  졸업: { fg: "var(--topic-graduation-fg)", bg: "var(--topic-graduation-bg)" },
  장학: { fg: "var(--topic-scholarship-fg)", bg: "var(--topic-scholarship-bg)" },
  "등록·학적": {
    fg: "var(--topic-registration-fg)",
    bg: "var(--topic-registration-bg)",
  },
  "전공·교과": { fg: "var(--topic-major-fg)", bg: "var(--topic-major-bg)" },
  "취업·현장실습": { fg: "var(--topic-career-fg)", bg: "var(--topic-career-bg)" },
  "행사·특강": { fg: "var(--topic-event-fg)", bg: "var(--topic-event-bg)" },
  기타: { fg: "var(--topic-other-fg)", bg: "var(--topic-other-bg)" },
};

const DEFAULT_COLOR = { fg: "var(--muted-foreground)", bg: "var(--muted)" };

// 사용자 유형 차트 색상 (차트 inline style 예외)
const USER_COLORS = {
  student: "#004F9F",
  staff: "#6D28D9",
} as const;

// ─── 공통: SectionTitle ──────────────────────────────────────────────────────

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

// ─── 공통: StatCard ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </div>
      <p className="text-[28px] font-extrabold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── StatsTab ────────────────────────────────────────────────────────────────

export function StatsTab() {
  const { statistics, isLoading } = useAdminStats();
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  if (isLoading || !statistics) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="text-sm text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  const { overview, categories, users } = statistics;
  const maxCount = Math.max(...categories.map((c) => c.questionCount));
  const totalCategoryCount = categories.reduce(
    (s, c) => s + c.questionCount,
    0
  );

  const studentCount = users.byUserType.student ?? 0;
  const staffCount = users.byUserType.staff ?? 0;
  const totalUsers = studentCount + staffCount;
  const studentPct =
    totalUsers > 0
      ? ((studentCount / totalUsers) * 100).toFixed(1)
      : "0.0";
  const staffPct =
    totalUsers > 0
      ? ((staffCount / totalUsers) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── 전체 서비스 사용 통계 ── */}
        <section>
          <SectionTitle
            icon={<MessageSquare className="size-4" />}
            title="전체 서비스 사용 통계"
          />
          <div className="mt-3 grid grid-cols-2 gap-4">
            <StatCard
              icon={<MessageSquare className="size-5 text-primary" />}
              value={overview.totalQuestions.toLocaleString()}
              label="총 질문 수"
            />
            <StatCard
              icon={<FileText className="size-5 text-primary" />}
              value={overview.totalDocuments.toString()}
              label="업로드된 문서 수"
            />
          </div>
        </section>

        {/* ── 카테고리별 질문 통계 ── */}
        <section>
          <SectionTitle
            icon={<FileText className="size-4" />}
            title="카테고리별 질문 통계"
          />
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            {/* 수직 바 차트 */}
            <div className="px-5 pb-3 pt-5">
              <div className="flex h-40 items-end gap-1.5">
                {categories.map((c) => {
                  const color = CATEGORY_COLORS[c.category] ?? DEFAULT_COLOR;
                  const heightPct =
                    maxCount > 0 ? (c.questionCount / maxCount) * 100 : 0;
                  const isHovered = hoveredCat === c.category;
                  return (
                    <div
                      key={c.category}
                      className="relative flex h-full flex-1 flex-col items-center justify-end"
                      onMouseEnter={() => setHoveredCat(c.category)}
                      onMouseLeave={() => setHoveredCat(null)}
                    >
                      {isHovered && (
                        <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-semibold text-background">
                          {c.questionCount.toLocaleString()}건
                        </div>
                      )}
                      <div
                        className="w-full cursor-pointer rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max(heightPct, 4)}%`,
                          backgroundColor: color.fg,
                          opacity: isHovered ? 1 : 0.75,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5">
                {categories.map((c) => (
                  <div key={c.category} className="flex-1 text-center">
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                      {c.category}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 카테고리 테이블 */}
            <div className="border-t border-border">
              {categories.map((c, i) => {
                const color = CATEGORY_COLORS[c.category] ?? DEFAULT_COLOR;
                const pct =
                  totalCategoryCount > 0
                    ? ((c.questionCount / totalCategoryCount) * 100).toFixed(1)
                    : "0.0";
                return (
                  <div
                    key={c.category}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50 ${
                      i < categories.length - 1
                        ? "border-b border-border/40"
                        : ""
                    }`}
                  >
                    <span className="w-6 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: color.bg,
                        color: color.fg,
                      }}
                    >
                      {c.category}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color.fg,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[13px] font-semibold text-foreground">
                      {c.questionCount.toLocaleString()}
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 사용자 유형별 통계 ── */}
        <section>
          <SectionTitle
            icon={<Users className="size-4" />}
            title="사용자 유형별 통계"
          />
          <div className="mt-3 grid grid-cols-2 gap-4">
            {(
              [
                {
                  key: "학생",
                  icon: GraduationCap,
                  color: USER_COLORS.student,
                  bgColor: "#EFF6FF",
                },
                {
                  key: "교직원",
                  icon: Briefcase,
                  color: USER_COLORS.staff,
                  bgColor: "#F5F3FF",
                },
              ] as const
            ).map(({ key, icon: Icon, color, bgColor }) => {
              const count = key === "학생" ? studentCount : staffCount;
              const pct =
                totalUsers > 0
                  ? ((count / totalUsers) * 100).toFixed(1)
                  : "0.0";
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: bgColor,
                        color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        전체의 {pct}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative size-20 shrink-0">
                      <svg
                        viewBox="0 0 36 36"
                        className="-rotate-90"
                        style={{ width: "100%", height: "100%" }}
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="var(--secondary)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke={color}
                          strokeWidth="4"
                          strokeDasharray={`${parseFloat(pct) * 0.88} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-foreground">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold tracking-tight text-foreground">
                        {count.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        총 질문 수
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 비율 바 */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                사용자 유형 비율
              </span>
              <span className="text-[13px] font-semibold text-foreground">
                총 {totalUsers.toLocaleString()}건
              </span>
            </div>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
              <div
                className="rounded-l-full"
                style={{
                  width: `${totalUsers > 0 ? (studentCount / totalUsers) * 100 : 0}%`,
                  backgroundColor: USER_COLORS.student,
                }}
              />
              <div
                className="rounded-r-full"
                style={{
                  width: `${totalUsers > 0 ? (staffCount / totalUsers) * 100 : 0}%`,
                  backgroundColor: USER_COLORS.staff,
                }}
              />
            </div>
            <div className="mt-2.5 flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: USER_COLORS.student }}
                />
                <span className="text-xs text-muted-foreground">
                  학생 {studentPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: USER_COLORS.staff }}
                />
                <span className="text-xs text-muted-foreground">
                  교직원 {staffPct}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
