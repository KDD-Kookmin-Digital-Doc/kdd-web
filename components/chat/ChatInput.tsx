"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  /** 마운트 시 입력창에 채워넣을 초기 텍스트 (자동 전송 안 함) */
  initialValue?: string;
  /** 기본 placeholder를 대체할 커스텀 텍스트 */
  placeholder?: string;
  /** disabled 상태에서 사용자가 입력/전송을 시도했을 때 호출 */
  onDisabledAttempt?: () => void;
}

/**
 * 채팅 입력창 컴포넌트.
 *
 * 자동 높이 조절(textarea), Enter 전송(Shift+Enter는 줄바꿈), 중복 전송 방지를
 * 처리한다. `disabled` 상태(예: 일일 한도 소진, 스트리밍 중)에서 입력/전송을
 * 시도하면 {@link ChatInputProps.onDisabledAttempt}가 호출되어 안내를 띄울 수 있다.
 *
 * @param props.onSend            전송 버튼/Enter로 메시지를 보낼 때 호출
 * @param props.disabled          입력·전송 비활성화 여부
 * @param props.className         래퍼에 추가할 클래스
 * @param props.initialValue      마운트 시 채워넣을 초기 텍스트 (자동 전송 안 함)
 * @param props.placeholder       기본 placeholder를 대체할 텍스트
 * @param props.onDisabledAttempt disabled 상태에서 입력/전송을 시도했을 때 호출
 */
export function ChatInput({
  onSend,
  disabled,
  className,
  initialValue,
  placeholder,
  onDisabledAttempt,
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 동기 중복 전송 가드는 ref(렌더에 영향 없음), 버튼 활성 표시는 state로 분리한다.
  const isSendingRef = useRef(false);

  // initialValue가 비동기로 늦게 결정되는 경우(예: FAQ에서 넘어온 초기 질문)를 위한 동기화.
  // 이펙트 대신 "값이 바뀌면 렌더 중 상태 보정"하는 React 권장 패턴을 사용한다.
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // 최초 1회만 적용하고, 이후 사용자의 입력을 덮어쓰지 않는다.
  const [initialValueApplied, setInitialValueApplied] = useState(false);
  if (initialValue && !initialValueApplied) {
    setInitialValueApplied(true);
    setValue(initialValue);
  }

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled || isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);
    onSend?.(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    setTimeout(() => {
      isSendingRef.current = false;
      setIsSending(false);
    }, 100);
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      onDisabledAttempt?.();
      return;
    }
    if ((e.target as HTMLElement).tagName !== "BUTTON") {
      textareaRef.current?.focus();
    }
  };

  const handleSendClick = () => {
    if (disabled) {
      onDisabledAttempt?.();
      return;
    }
    handleSend();
  };

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        "flex cursor-text items-center gap-4 rounded-[28px] border border-border bg-background px-5 py-3 shadow-md",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "메시지를 입력하세요..."}
        disabled={disabled}
        rows={1}
        className={cn(
          "max-h-40 flex-1 resize-none overflow-y-auto scrollbar-none bg-transparent text-base leading-6 text-foreground outline-none field-sizing-content placeholder:text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50",
        )}
      />
      <button
        onClick={handleSendClick}
        disabled={!canSend && !disabled}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          canSend
            ? "bg-primary text-primary-foreground hover:bg-primary/85"
            : "bg-primary/30 text-primary-foreground",
        )}
      >
        <ArrowUp className="size-5" />
      </button>
    </div>
  );
}
