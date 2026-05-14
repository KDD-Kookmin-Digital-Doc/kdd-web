"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, FileText, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarContext } from "@/components/sidebar/SidebarContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import type { LucideIcon } from "lucide-react";

const ADMIN_TABS: readonly { href: string; label: string; icon: LucideIcon }[] =
  [
    { href: "/admin", label: "통계", icon: MessageSquare },
    { href: "/admin/documents", label: "문서 관리", icon: FileText },
    { href: "/admin/faq", label: "FAQ 관리", icon: CheckSquare },
  ];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && user?.role !== "admin") {
    router.replace("/chat");
    return null;
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <AdminGuard>
        <SidebarContext.Provider
          value={{ open: sidebarOpen, setOpen: setSidebarOpen }}
        >
          <ChatProvider>
            <div className="flex h-dvh bg-white">
              <Sidebar />
              <Suspense>
                <div className="flex min-w-0 flex-1 flex-col">
                  {/* Header */}
                  <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
                    <h1 className="text-lg font-semibold text-foreground">
                      관리자 대시보드
                    </h1>
                  </header>

                  {/* Tabs */}
                  <nav className="shrink-0 border-b border-border bg-background px-4">
                    <div className="mx-auto flex max-w-4xl gap-1">
                      {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
                        const isActive =
                          href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(href);

                        return (
                          <Link
                            key={href}
                            href={href}
                            className={cn(
                              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors",
                              isActive
                                ? "border-primary font-semibold text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="size-3.5" />
                            {label}
                          </Link>
                        );
                      })}
                    </div>
                  </nav>

                  {/* Content */}
                  <main className="flex-1 overflow-y-auto bg-background">
                    {children}
                  </main>
                </div>
              </Suspense>
            </div>
          </ChatProvider>
        </SidebarContext.Provider>
      </AdminGuard>
    </AuthProvider>
  );
}
