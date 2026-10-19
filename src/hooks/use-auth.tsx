"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let active = true;
    api
      .get<{ data: AdminUser }>("/auth/me")
      .then((response) => {
        if (active) setUser(response.data.data);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await api.post<{ data: { token: string; user: AdminUser } }>(
        "/auth/login",
        credentials,
      );
      setToken(response.data.data.token);
      setUser(response.data.data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
