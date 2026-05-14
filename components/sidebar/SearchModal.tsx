"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Search, MessageCircle, X } from "lucide-react";

interface ChatHistoryItem {
  id: string;
  title: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  chatHistory: readonly ChatHistoryItem[];
  triggerRect: DOMRect | null;
}

export function SearchModal({
  open,
  onClose,
  chatHistory,
  triggerRect,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = chatHistory.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const modalRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const modalWidth = Math.min(480, window.innerWidth - 32);
  const modalLeft = (window.innerWidth - modalWidth) / 2;
  const modalTop = window.innerHeight * 0.15;

  const triggerCenterX = triggerRect
    ? triggerRect.left + triggerRect.width / 2
    : modalLeft;
  const triggerCenterY = triggerRect
    ? triggerRect.top + triggerRect.height / 2
    : modalTop;

  const originPercX = ((triggerCenterX - modalLeft) / modalWidth) * 100;
  const originPercY = ((triggerCenterY - modalTop) / 48) * 100;
  const transformOrigin = `${originPercX}% ${Math.max(0, originPercY)}%`;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <motion.div
        ref={modalRef}
        className="relative w-full max-w-120 px-4"
        initial={{ scale: 0.35, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.35, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
        style={{ borderRadius: 16, transformOrigin }}
        onAnimationComplete={() => inputRef.current?.focus()}
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="size-[18px] shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="채팅 검색..."
              className="flex-1 bg-transparent text-sm caret-primary outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleClose}
              className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <motion.div
            className="max-h-[50vh] overflow-y-auto p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
          >
            {filtered.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-xs text-muted-foreground">
                  {query ? "검색 결과" : "지난 30일"}
                </p>
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(`/chat/${item.id}`);
                      handleClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </>
            )}

            {query && filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
