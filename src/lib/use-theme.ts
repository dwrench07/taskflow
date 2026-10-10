"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Reads and controls the app theme. The initial class is applied by the inline
 * script in layout.tsx (before paint) to avoid a flash; this hook keeps React
 * state in sync and persists changes to localStorage.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable (private mode, etc.) — theme still applies this session */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
