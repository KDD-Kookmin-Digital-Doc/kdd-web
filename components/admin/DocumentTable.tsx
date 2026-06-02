"use client";

import { Search, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminDocument } from "@/types/api/admin";

interface DocumentTableProps {
  documents: AdminDocument[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDelete: (id: number) => void;
  onReprocess: (id: number) => void;
}

const STATUS_LABEL: Record<AdminDocument["status"], string> = {
  completed: "완료",
  processing: "처리 중",
  uploaded: "업로드됨",
  failed: "실패",
  reprocessing: "재처리 중",
};

const STATUS_CLASS: Record<AdminDocument["status"], string> = {
  completed: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-muted text-muted-foreground border-border",
  uploaded: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  reprocessing: "bg-muted text-muted-foreground border-border",
};

const SOURCE_CLASS: Record<AdminDocument["source"], string> = {
  SW: "bg-muted text-muted-foreground border-border",
  KMU: "bg-primary/10 text-primary border-primary/20",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function DocumentTable({
  documents,
  searchQuery,
  onSearchChange,
  onDelete,
  onReprocess,
}: DocumentTableProps) {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="문서명 또는 카테고리 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          삭제된 문서 보기
        </button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">문서명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>소스</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  문서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-[240px] truncate font-medium">
                    {doc.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.categoryName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        STATUS_CLASS[doc.status]
                      )}
                    >
                      {STATUS_LABEL[doc.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                        SOURCE_CLASS[doc.source]
                      )}
                    >
                      {doc.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onReprocess(doc.id)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        title="재처리"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="삭제"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
