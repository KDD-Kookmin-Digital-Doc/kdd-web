"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[MainLayoutError]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4">
      <h2 className="text-lg font-semibold text-foreground">
        문제가 발생했습니다
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push("/chat")}>
          홈으로
        </Button>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
