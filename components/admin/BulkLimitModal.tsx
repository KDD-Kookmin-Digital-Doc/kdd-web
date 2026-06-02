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
import { bulkUpdateChatLimit } from "@/lib/api/services/admin.service";

interface BulkLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSuccess: (newLimit: number) => void;
}

export function BulkLimitModal({ open, onOpenChange, selectedIds, onSuccess }: BulkLimitModalProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setValue("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const numValue = Number(value);
  const isValid = value !== "" && Number.isInteger(numValue) && numValue >= 0;
  const validationError = value !== "" && !isValid ? "0 이상의 정수를 입력해주세요." : null;

  async function handleConfirm() {
    if (!isValid || selectedIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await bulkUpdateChatLimit({ userIds: selectedIds, dailyChatLimit: numValue });
      onSuccess(res.dailyChatLimit);
      onOpenChange(false);
    } catch {
      setError("일괄 한도 변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>일괄 한도 변경</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            선택된 {selectedIds.length}명의 사용자에게 동일한 일일 채팅 한도를 적용합니다.
          </p>
          <div>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="새 한도 (0 이상 정수)"
            />
            {validationError && (
              <p className="mt-1 text-xs text-destructive">{validationError}</p>
            )}
            {error && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>
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
