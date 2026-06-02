"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = "default",
      durationMs = DEFAULT_DURATION,
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => {
        // 동일 메시지 중복 방지: 직전 토스트와 같으면 무시
        if (prev.length > 0 && prev[prev.length - 1].message === message) {
          return prev;
        }
        return [...prev, { id, message, variant }];
      });
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const error = useCallback(
    (message: string, durationMs?: number) => show(message, "error", durationMs),
    [show],
  );
  const success = useCallback(
    (message: string, durationMs?: number) =>
      show(message, "success", durationMs),
    [show],
  );
  const warning = useCallback(
    (message: string, durationMs?: number) =>
      show(message, "warning", durationMs),
    [show],
  );

  // 언마운트 시 모든 타이머 정리
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show, error, success, warning }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-100 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <ToastBubble key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const styles = {
    default: "bg-foreground text-background",
    success: "bg-emerald-600 text-white",
    error: "bg-destructive text-destructive-foreground",
    warning: "bg-amber-500 text-white",
  } as const;

  const Icon = {
    default: Info,
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
  }[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      className={cn(
        "pointer-events-auto flex max-w-md cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium shadow-lg",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        styles[toast.variant],
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{toast.message}</span>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
