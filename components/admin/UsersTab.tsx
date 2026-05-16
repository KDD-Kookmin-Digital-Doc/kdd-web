"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Users, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/admin/UserTable";
import { LimitEditModal } from "@/components/admin/LimitEditModal";
import { BulkLimitModal } from "@/components/admin/BulkLimitModal";
import { ResetUsageDialog } from "@/components/admin/ResetUsageDialog";
import { DefaultLimitCard } from "@/components/admin/DefaultLimitCard";
import { getAdminUsers } from "@/lib/api/services/admin.service";
import type { AdminUserItem } from "@/types/api/admin";
import type { PageResponse } from "@/types/api/common";

// ─── 상수 ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

const USER_TYPE_OPTIONS = [
  { value: "", label: "전체 유형" },
  { value: "student", label: "학생" },
  { value: "staff", label: "교직원" },
] as const;

const ROLE_OPTIONS = [
  { value: "", label: "전체 역할" },
  { value: "user", label: "사용자" },
  { value: "admin", label: "관리자" },
] as const;

// ─── UsersTab 메인 ──────────────────────────────────────────────────────────

export function UsersTab() {
  // ── 상태 ──
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userTypeFilter, setUserTypeFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserItem | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // ── 디바운스 타이머 ──
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 데이터 페칭 ──
  const fetchUsers = useCallback(
    async (p: number, userType: string, role: string, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: p,
          size: PAGE_SIZE,
        };
        if (userType) params.userType = userType;
        if (role) params.role = role;
        if (search) params.search = search;

        const res: PageResponse<AdminUserItem> = await getAdminUsers(
          params as Parameters<typeof getAdminUsers>[0],
        );
        setUsers(res.data);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      } catch {
        setError("사용자 목록을 불러오는 데 실패했습니다.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── 마운트 시 초기 로드 ──
  useEffect(() => {
    fetchUsers(page, userTypeFilter, roleFilter, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userTypeFilter, roleFilter, searchQuery]);

  // ── 필터 변경 핸들러 (page 초기화) ──
  function handleUserTypeChange(value: string) {
    setUserTypeFilter(value);
    setPage(0);
    setSelectedIds(new Set());
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value);
    setPage(0);
    setSelectedIds(new Set());
  }

  // ── 검색 디바운스 ──
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(0);
      setSelectedIds(new Set());
    }, DEBOUNCE_MS);
  }

  // ── 페이지네이션 ──
  function handlePrevPage() {
    if (page > 0) setPage(page - 1);
  }

  function handleNextPage() {
    if (page < totalPages - 1) setPage(page + 1);
  }

  // ── 재시도 ──
  function handleRetry() {
    fetchUsers(page, userTypeFilter, roleFilter, searchQuery);
  }

  // ── 콜백 ──
  function handleEditLimit(user: AdminUserItem) {
    setEditUser(user);
  }

  function handleLimitEditSuccess(userId: number, newLimit: number) {
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, dailyChatLimit: newLimit } : u)),
    );
    setEditUser(null);
  }

  function handleResetUsage(user: AdminUserItem) {
    setResetUser(user);
  }

  function handleResetSuccess(userId: number) {
    setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, usedToday: 0 } : u));
    setResetUser(null);
  }

  function handleResetError(message: string) {
    setToastError(message);
    setTimeout(() => setToastError(null), 5000);
  }

  function handleBulkLimitChange() {
    setBulkModalOpen(true);
  }

  function handleBulkSuccess(newLimit: number) {
    setUsers((prev) =>
      prev.map((u) => (selectedIds.has(u.userId) ? { ...u, dailyChatLimit: newLimit } : u)),
    );
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setBulkModalOpen(false);
    setSuccessMessage(`${count}명의 한도가 ${newLimit}회로 변경되었습니다.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  // ── 선택 상태 ──
  const selectedCount = selectedIds.size;
  const bulkDisabled = selectedCount === 0 || selectedCount > 500;

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-5xl">
        {/* 헤더 */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-4" />
          </div>
          <h3 className="text-base font-bold text-foreground">사용자 관리</h3>
        </div>

        {/* 기본 한도 설정 */}
        <DefaultLimitCard />

        {/* 필터 + 검색 + 일괄 변경 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* 검색 */}
          <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search size={14} className="shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
              placeholder="이름 또는 이메일 검색..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* 유형 필터 */}
          <div className="relative">
            <select
              value={userTypeFilter}
              onChange={(e) => handleUserTypeChange(e.target.value)}
              className="appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-8 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {USER_TYPE_OPTIONS.map((opt) => (
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

          {/* 역할 필터 */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-8 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((opt) => (
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

          {/* 일괄 한도 변경 */}
          <Button
            variant="outline"
            size="sm"
            disabled={bulkDisabled}
            onClick={handleBulkLimitChange}
          >
            일괄 한도 변경
            {selectedCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
                {selectedCount}
              </span>
            )}
          </Button>
        </div>

        {/* 500명 초과 안내 */}
        {selectedCount > 500 && (
          <p className="mb-2 text-xs text-destructive">
            최대 500명까지 선택 가능합니다
          </p>
        )}

        {/* 성공 메시지 */}
        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-[13px] text-green-700">{successMessage}</p>
          </div>
        )}

        {/* 에러 토스트 */}
        {toastError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-[13px] text-destructive">{toastError}</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="flex-1 text-[13px] text-destructive">{error}</p>
            <Button variant="outline" size="xs" onClick={handleRetry}>
              재시도
            </Button>
          </div>
        )}

        {/* 테이블 또는 빈 상태 */}
        {!error && users.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <Users size={32} className="mb-2 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">
              검색 결과가 없습니다
            </p>
          </div>
        ) : !error ? (
          <UserTable
            users={users}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEditLimit={handleEditLimit}
            onResetUsage={handleResetUsage}
            loading={loading}
          />
        ) : null}

        {/* 페이지네이션 */}
        {!error && totalPages > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              총 {totalCount}명 · {page + 1} / {totalPages} 페이지
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || loading}
                onClick={handlePrevPage}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1 || loading}
                onClick={handleNextPage}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 한도 변경 모달 */}
      <LimitEditModal
        open={editUser !== null}
        onOpenChange={(open) => { if (!open) setEditUser(null); }}
        user={editUser}
        onSuccess={handleLimitEditSuccess}
      />

      {/* 일괄 한도 변경 모달 */}
      <BulkLimitModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        selectedIds={Array.from(selectedIds)}
        onSuccess={handleBulkSuccess}
      />

      {/* 사용량 초기화 다이얼로그 */}
      <ResetUsageDialog
        open={resetUser !== null}
        onOpenChange={(open) => { if (!open) setResetUser(null); }}
        user={resetUser}
        onSuccess={handleResetSuccess}
        onError={handleResetError}
      />
    </div>
  );
}
