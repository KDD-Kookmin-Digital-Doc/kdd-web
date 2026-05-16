"use client";

import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { AdminUserItem } from "@/types/api/admin";

interface UserTableProps {
  users: AdminUserItem[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onEditLimit: (user: AdminUserItem) => void;
  onResetUsage: (user: AdminUserItem) => void;
  loading: boolean;
}

const USER_TYPE_LABEL: Record<AdminUserItem["userType"], string> = {
  student: "학생",
  staff: "교직원",
};

const ROLE_LABEL: Record<AdminUserItem["role"], string> = {
  user: "사용자",
  admin: "관리자",
};

export function UserTable({
  users,
  selectedIds,
  onSelectionChange,
  onEditLimit,
  onResetUsage,
  loading,
}: UserTableProps) {
  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.userId));
  const someSelected = users.some((u) => selectedIds.has(u.userId)) && !allSelected;

  function handleSelectAll() {
    if (allSelected) {
      // Deselect all on current page
      const next = new Set(selectedIds);
      users.forEach((u) => next.delete(u.userId));
      onSelectionChange(next);
    } else {
      // Select all on current page
      const next = new Set(selectedIds);
      users.forEach((u) => next.add(u.userId));
      onSelectionChange(next);
    }
  }

  function handleSelectOne(userId: number) {
    const next = new Set(selectedIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    onSelectionChange(next);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                className="size-4 cursor-pointer rounded border-border accent-primary"
                aria-label="전체 선택"
              />
            </TableHead>
            <TableHead>이름</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>역할</TableHead>
            <TableHead className="text-right">한도</TableHead>
            <TableHead className="text-right">사용량</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.userId}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.userId)}
                  onChange={() => handleSelectOne(user.userId)}
                  className="size-4 cursor-pointer rounded border-border accent-primary"
                  aria-label={`${user.name} 선택`}
                />
              </TableCell>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                  {USER_TYPE_LABEL[user.userType]}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                  {ROLE_LABEL[user.role]}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {user.dailyChatLimit}회
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span
                  className={
                    user.usedToday >= user.dailyChatLimit
                      ? "font-semibold text-destructive"
                      : ""
                  }
                >
                  {user.usedToday}/{user.dailyChatLimit}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onEditLimit(user)}
                  >
                    한도 변경
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onResetUsage(user)}
                  >
                    초기화
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
