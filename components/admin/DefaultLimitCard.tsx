"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultChatLimit, updateDefaultChatLimit } from "@/lib/api/services/admin.service";

export function DefaultLimitCard() {
  const [defaultLimit, setDefaultLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    loadDefaultLimit();
  }, []);

  async function loadDefaultLimit() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getDefaultChatLimit();
      setDefaultLimit(res.defaultDailyChatLimit);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleStartEdit() {
    setEditValue(String(defaultLimit ?? ""));
    setUpdateError(null);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
    setUpdateError(null);
  }

  const numValue = Number(editValue);
  const isValid = editValue !== "" && Number.isInteger(numValue) && numValue >= 0;
  const validationError = editValue !== "" && !isValid ? "0 이상의 정수를 입력해주세요." : null;

  async function handleConfirm() {
    if (!isValid) return;
    setSubmitting(true);
    setUpdateError(null);
    try {
      const res = await updateDefaultChatLimit({ defaultDailyChatLimit: numValue });
      setDefaultLimit(res.defaultDailyChatLimit);
      setEditing(false);
    } catch {
      setUpdateError("기본 한도 변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={14} className="text-muted-foreground" />
        <span className="text-[13px] font-medium text-foreground">기본 한도</span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>불러오는 중...</span>
        </div>
      )}

      {loadError && !loading && (
        <p className="text-xs text-destructive">기본 한도를 불러올 수 없습니다.</p>
      )}

      {!loading && !loadError && defaultLimit != null && (
        <>
          {!editing ? (
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-foreground">{defaultLimit}회/일</span>
              <Button variant="outline" size="xs" onClick={handleStartEdit}>
                변경
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={editValue}
                onChange={(e) => { setEditValue(e.target.value); setUpdateError(null); }}
                className="w-24 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="0 이상"
              />
              <Button size="xs" onClick={handleConfirm} disabled={!isValid || submitting}>
                {submitting ? "..." : "확인"}
              </Button>
              <Button variant="ghost" size="xs" onClick={handleCancelEdit} disabled={submitting}>
                취소
              </Button>
            </div>
          )}
          {validationError && editing && (
            <p className="mt-1 text-xs text-destructive">{validationError}</p>
          )}
          {updateError && (
            <p className="mt-1 text-xs text-destructive">{updateError}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            ※ 기본 한도 변경은 기존 사용자에게 영향을 주지 않습니다
          </p>
        </>
      )}
    </div>
  );
}
