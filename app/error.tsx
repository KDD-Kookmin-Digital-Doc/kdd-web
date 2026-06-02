"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4">
      <h2 className="text-lg font-semibold text-foreground">
        문제가 발생했습니다
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        예상치 못한 오류가 발생했습니다. 다시 시도하거나 페이지를 새로고침해주세요.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          새로고침
        </Button>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
