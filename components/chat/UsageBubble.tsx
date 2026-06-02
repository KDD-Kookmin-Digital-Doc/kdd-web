import { cn } from "@/lib/utils";

interface UsageBubbleProps {
  remaining: number;
}

export function UsageBubble({ remaining }: UsageBubbleProps) {
  const colorClass =
    remaining === 0
      ? "bg-destructive/10 text-destructive"
      : remaining <= 5
        ? "bg-amber-50 text-amber-700"
        : "bg-secondary text-muted-foreground";

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-medium", colorClass)}>
      남은 횟수: {remaining}회
    </span>
  );
}
