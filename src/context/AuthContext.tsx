"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_PATHS = ["/login", "/register"];
export const isAuthPath = (pathname: string | null) =>
  !!pathname && AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate user session on mount from the server (HttpOnly token cookie).
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Enforce redirects once the session state is known.
  useEffect(() => {
    if (isLoading) return;

    if (!user && !isAuthPath(pathname)) {
      router.replace("/login");
    } else if (user && isAuthPath(pathname)) {
      router.replace("/");
    }
  }, [isLoading, user, pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
