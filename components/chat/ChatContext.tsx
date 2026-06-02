"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getSessions,
  createSession,
  deleteSession,
  updateSessionTitle,
} from "@/lib/api/services/chat.service";

interface ChatHistoryItem {
  id: string;
  title: string;
}

interface ChatContextValue {
  chatHistory: ChatHistoryItem[];
  isLoading: boolean;
  addChat: (id: string, title: string) => void;
  createNewSession: () => Promise<string>;
  deleteChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
}

const ChatContext = createContext<ChatContextValue>({
  chatHistory: [],
  isLoading: false,
  addChat: () => {},
  createNewSession: async () => "",
  deleteChat: () => {},
  renameChat: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 인증 완료 후 세션 목록 로드
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    getSessions({ page: 0, pageSize: 50 })
      .then((res) => {
        setChatHistory(
          res.data.map((s) => ({
            id: String(s.sessionId),
            title: s.title,
          }))
        );
      })
      .catch(() => {
        setChatHistory([]);
      })
      .finally(() => setIsLoading(false));
  }, [authLoading, isAuthenticated]);

  const addChat = useCallback((id: string, title: string) => {
    setChatHistory((prev) => {
      if (prev.some((c) => c.id === id)) return prev;
      return [{ id, title }, ...prev];
    });
  }, []);

  const createNewSession = useCallback(async (): Promise<string> => {
    const res = await createSession();
    const id = String(res.sessionId);
    setChatHistory((prev) => {
      if (prev.some((c) => c.id === id)) return prev;
      return [{ id, title: res.title }, ...prev];
    });
    return id;
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    setChatHistory((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteSession(Number(id));
    } catch {
      // 실패해도 로컬 상태는 유지 (UX 우선)
    }
  }, []);

  const renameChat = useCallback(async (id: string, newTitle: string) => {
    setChatHistory((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    try {
      await updateSessionTitle(Number(id), newTitle);
    } catch {
      // 실패해도 로컬 상태는 유지
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{ chatHistory, isLoading, addChat, createNewSession, deleteChat, renameChat }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}
