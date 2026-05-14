"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatItemMenuProps {
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ChatItemMenu({
  onRename,
  onDelete,
  onClose,
}: ChatItemMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 삭제 확인 다이얼로그(Radix Portal — DOM상 menuRef 바깥)가 열려 있을 땐
      // 바깥 클릭 감지를 비활성화해야 다이얼로그 버튼 클릭이 먹힌다.
      if (deleteDialogOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteDialogOpen) onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, deleteDialogOpen]);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete();
    onClose();
  };

  return (
    <>
      <div
        ref={menuRef}
        className="absolute right-0 top-full z-50 mt-1 min-w-35 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg"
      >
        <button
          onClick={() => {
            onRename();
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-secondary"
        >
          <Pencil className="size-3.5" />
          이름 변경
        </button>
        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive transition-colors hover:bg-secondary"
        >
          <Trash2 className="size-3.5" />
          삭제
        </button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>채팅방 삭제</DialogTitle>
            <DialogDescription>
              이 채팅방을 삭제하시겠습니까? 삭제된 채팅은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
