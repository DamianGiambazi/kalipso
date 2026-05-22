"use client";

import { useEffect } from "react";

/**
 * ThemeProvider — applies persisted theme on mount.
 *
 * Strategy:
 * 1. Read theme from localStorage if set
 * 2. Otherwise fall back to OS preference
 * 3. Apply data-theme on <html>
 *
 * The ThemeToggle component in the topbar handles user toggling.
 *
 * We deliberately do NOT use React state for the theme value — the source of
 * truth is the data-theme attribute on <html>. This avoids hydration flashes
 * and keeps the toggle logic dead simple.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem("kalipso-theme");
      } catch {
        return null;
      }
    })();

    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial = stored ?? (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  return <>{children}</>;
}

/**
 * Toggle the theme. Called from the ThemeToggle button.
 * Exported so the button can import it directly.
 */
export function toggleTheme(): void {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") ?? "light";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("kalipso-theme", next);
  } catch {
    /* ignore localStorage errors */
  }
}
