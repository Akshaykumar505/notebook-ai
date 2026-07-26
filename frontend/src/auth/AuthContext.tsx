import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import * as authApi from "@/api/auth";
import { setAuthToken, getAuthToken } from "@/api/client";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// We can't verify a stored JWT without a /me endpoint, so on load we just
// trust that a token in storage means "probably logged in" and let the
// first API call fail (-> redirect to login) if it's actually expired.
const storedUser = localStorage.getItem("notebook-ai-user");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    storedUser && getAuthToken() ? JSON.parse(storedUser) : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuthToken(result.token);
      localStorage.setItem("notebook-ai-user", JSON.stringify(result.user));
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.signup(email, password, name);
      setAuthToken(result.token);
      localStorage.setItem("notebook-ai-user", JSON.stringify(result.user));
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem("notebook-ai-user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
