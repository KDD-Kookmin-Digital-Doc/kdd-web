import { cn } from "@/lib/utils";
import type { Source } from "@/types/chat";

interface SourceCardProps {
  source: Source;
  index?: number;
  onOpenPDF?: (documentId: number, page: number, chunkId?: number) => void;
}

export function SourceCard({ source, index, onOpenPDF }: SourceCardProps) {
  const handleClick = () => {
    onOpenPDF?.(source.documentId, source.page, source.chunkId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!onOpenPDF}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg bg-primary/5 p-3 text-left transition-colors",
        onOpenPDF ? "cursor-pointer hover:bg-primary/10" : "cursor-default",
      )}
    >
      {index !== undefined && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {index + 1}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {source.documentTitle}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        p.{source.page}
      </span>
    </button>
  );
}
