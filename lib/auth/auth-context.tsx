"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { loginRequest, profileRequest } from "@/lib/api/auth";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/lib/auth/tokens";
import type { User } from "@/types/domain";

type AuthState = {
  user: User | null;
  isHydrating: boolean;
};

type AuthContextValue = AuthState & {
  loggedIn: boolean;
  isAdmin: boolean;
  isClient: boolean;
  login: (credentials: { username: string; password: string }) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, isHydrating: true };
  }
  const cached = getStoredUser<User>();
  const hasToken = !!getToken();
  return {
    user: cached,
    isHydrating: hasToken,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(readInitialState);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();

    if (!token) {
      // initial state already had isHydrating: false when there's no token
      return;
    }

    profileRequest()
      .then((user) => {
        if (cancelled) return;
        setStoredUser(user);
        setState({ user, isHydrating: false });
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        setState({ user: null, isHydrating: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      const response = await loginRequest(credentials);
      setToken(response.access_token);
      setStoredUser(response.user);
      setState({ user: response.user, isHydrating: false });
      return response.user;
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setState({ user: null, isHydrating: false });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = state.user;
    return {
      user,
      isHydrating: state.isHydrating,
      loggedIn: !!user,
      isAdmin: !!user && user.isClient === false,
      isClient: !!user && user.isClient === true,
      login,
      logout,
    };
  }, [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
