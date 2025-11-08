"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextType {
  sessionId: string | null;
  login: (loginId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const login = (loginId: string) => {
    setSessionId(loginId); // Set session ID to the login ID
  };

  const logout = () => {
    setSessionId(null); // Clear session ID
  };

  return (
    <AuthContext.Provider value={{ sessionId, login, logout }}>
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
