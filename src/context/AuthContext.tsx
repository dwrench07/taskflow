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
          // A present-but-invalid token (expired, stale, or a leftover
          // "dev-mode" cookie) passes the middleware's presence check but fails
          // here. Left in place, middleware keeps bouncing /login back to / and
          // the user is trapped on the loading placeholder. Clear it so the
          // redirect to /login sticks. Skip on auth pages (nothing to break).
          const onAuthPage =
            typeof window !== "undefined" && isAuthPath(window.location.pathname);
          if (!onAuthPage && (res.status === 401 || res.status === 403 || res.status === 404)) {
            try {
              await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
            } catch {
              /* best-effort cookie clear */
            }
          }
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
