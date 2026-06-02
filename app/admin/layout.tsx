"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, FileText, CheckSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarContext } from "@/components/sidebar/SidebarContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/toast";
import type { LucideIcon } from "lucide-react";

const ADMIN_TABS: readonly { href: string; label: string; icon: LucideIcon }[] =
  [
    { href: "/admin", label: "통계", icon: MessageSquare },
    { href: "/admin/documents", label: "문서 관리", icon: FileText },
    { href: "/admin/faq", label: "FAQ 관리", icon: CheckSquare },
    { href: "/admin/users", label: "사용자 관리", icon: Users },
  ];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isUnauthorized = !isLoading && user?.role !== "admin";

  // 리다이렉트는 렌더 중이 아니라 커밋 후 이펙트에서 수행한다.
  // (렌더 중 router.replace 호출 시 "Cannot update a component while rendering" 에러 발생)
  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/chat");
    }
  }, [isUnauthorized, router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">불러오는 중...</span>
      </div>
    );
  }

  if (isUnauthorized) return null;

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
        <ToastProvider>
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
        </ToastProvider>
      </AdminGuard>
    </AuthProvider>
  );
}
