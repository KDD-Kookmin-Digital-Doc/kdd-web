"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authManager } from "@/lib/api/auth";
import { googleLogin, logout as logoutService } from "@/lib/api/services/auth.service";
import { getMyInfo } from "@/lib/api/services/user.service";
import type { UserResponse } from "@/types/api/user";

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(code: string): Promise<{ isProfileCompleted: boolean }>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ isProfileCompleted: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

function setAuthCookies(role: string | null, profileCompleted: boolean): void {
  const roleValue = role ?? "";
  document.cookie = `user_role=${roleValue}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; samesite=strict`;
  document.cookie = `profile_completed=${profileCompleted}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; samesite=strict`;
}

function clearAuthCookies(): void {
  document.cookie = "user_role=; path=/; max-age=0";
  document.cookie = "profile_completed=; path=/; max-age=0";
}

/**
 * 전역 인증 상태 Provider.
 *
 * 앱 마운트 시 메모리에 Access Token이 없으면 Refresh Token으로 세션 복원을 시도하고,
 * 성공하면 사용자 정보를 로드해 컨텍스트에 채운다. 미들웨어 라우팅 가드를 위해
 * `user_role`·`profile_completed` 쿠키도 동기화한다.
 *
 * 제공 값: `user`, `isLoading`, `isAuthenticated`와 `login`/`logout`/`refreshUser` 액션.
 * 하위 컴포넌트는 {@link useAuth} 훅으로 접근한다.
 *
 * @param props.children Provider로 감쌀 하위 트리
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 마운트 시 기존 인증 상태 복원
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 메모리에 토큰이 없으면 refresh 시도
        if (!authManager.isAuthenticated()) {
          await authManager.refreshAccessToken();
        }

        const me = await getMyInfo();
        setUser(me);
        setAuthCookies(me.role, me.profileCompleted);
      } catch {
        authManager.clearToken();
        clearAuthCookies();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(
    async (code: string): Promise<{ isProfileCompleted: boolean }> => {
      const response = await googleLogin(code);
      authManager.setToken(response.accessToken);
      const me = await getMyInfo();
      setUser(me);
      setAuthCookies(me.role, me.profileCompleted);
      return { isProfileCompleted: response.isProfileCompleted };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      // 토큰이 필요하므로 clearToken 전에 먼저 호출
      await logoutService();
    } finally {
      authManager.clearToken();
      clearAuthCookies();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMyInfo();
      setUser(me);
      setAuthCookies(me.role, me.profileCompleted);
    } catch {
      authManager.clearToken();
      clearAuthCookies();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
