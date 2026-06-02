"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/sidebar/SidebarContext";
import { UsageBubble } from "@/components/chat/UsageBubble";

interface ChatHeaderProps {
  remaining?: number | null;
}

export function ChatHeader({ remaining }: ChatHeaderProps) {
  const { setOpen } = useSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-black/5 px-4">
      <button
        onClick={() => setOpen(true)}
        className="mr-2 flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary md:hidden"
      >
        <Menu className="size-5" />
      </button>
      <h2 className="flex-1 text-lg font-semibold text-foreground md:text-left text-center">
        KDD
      </h2>
      {remaining != null && <UsageBubble remaining={remaining} />}
      {remaining == null && <div className="size-9 md:hidden" />}
    </header>
  );
}
