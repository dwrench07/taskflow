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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate user session on mount
  useEffect(() => {
    // DEVELOPMENT OVERRIDE: automatically log in
    document.cookie = "token=dev-mode; path=/;";
    setUser({ id: "user-1", email: "dev@example.com", name: "Developer", roles: ["user", "admin"] });
    setIsLoading(false);
  }, []);

  // Enforce redirects if session is invalid or expired
  useEffect(() => {
    // DEVELOPMENT OVERRIDE: disabled redirects
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
