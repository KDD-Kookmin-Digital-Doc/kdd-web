"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { resetUserUsage } from "@/lib/api/services/admin.service";
import type { AdminUserItem } from "@/types/api/admin";

interface ResetUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
  onSuccess: (userId: number) => void;
  onError: (message: string) => void;
}

export function ResetUsageDialog({ open, onOpenChange, user, onSuccess, onError }: ResetUsageDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!user) return;
    setSubmitting(true);
    try {
      await resetUserUsage(user.id);
      onSuccess(user.id);
      onOpenChange(false);
    } catch {
      onOpenChange(false);
      onError("사용량 초기화에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사용량 초기화</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{user.name}</span> ({user.email})의 오늘 사용량을 초기화하시겠습니까?
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "초기화 중..." : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
