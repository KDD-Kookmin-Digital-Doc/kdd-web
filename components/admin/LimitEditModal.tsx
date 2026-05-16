"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateUserChatLimit } from "@/lib/api/services/admin.service";
import type { AdminUserItem } from "@/types/api/admin";

interface LimitEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
  onSuccess: (userId: number, newLimit: number) => void;
}

export function LimitEditModal({ open, onOpenChange, user, onSuccess }: LimitEditModalProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with a new user
  useEffect(() => {
    if (open && user) {
      setValue(String(user.dailyChatLimit));
      setError(null);
      setSubmitting(false);
    }
  }, [open, user]);

  const numValue = Number(value);
  const isValid = value !== "" && Number.isInteger(numValue) && numValue >= 0 && numValue <= 10000;

  const validationError = value !== "" && !isValid
    ? "0 이상 10,000 이하의 정수를 입력해주세요."
    : null;

  async function handleConfirm() {
    if (!user || !isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateUserChatLimit(user.userId, { dailyChatLimit: numValue });
      onSuccess(user.userId, res.dailyChatLimit);
      onOpenChange(false);
    } catch {
      setError("한도 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>한도 변경</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {user.name} ({user.email})의 일일 채팅 한도를 변경합니다.
            </p>
            <div>
              <input
                type="number"
                min={0}
                max={10000}
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(null); }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="새 한도 (0~10000)"
              />
              {validationError && (
                <p className="mt-1 text-xs text-destructive">{validationError}</p>
              )}
              {error && (
                <p className="mt-1 text-xs text-destructive">{error}</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || submitting}>
            {submitting ? "변경 중..." : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
