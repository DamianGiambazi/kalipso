"use client";

import { toggleTheme } from "./ThemeProvider";

export function TopBar() {
  return (
    <div
      className="sticky top-0 z-10 border-b backdrop-blur-sm"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: "var(--border-soft)",
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-medium tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text)" }}
          >
            Kalipso
          </span>
          <span
            className="rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-mono)",
              backgroundColor: "var(--bg-mono)",
              color: "var(--text-muted)",
              borderColor: "var(--border)",
            }}
          >
            Testnet
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <GitHubLink />
        </div>
      </div>
    </div>
  );
}

function ThemeToggleButton() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors hover:border-[var(--border)]"
      style={{ color: "var(--text-muted)" }}
    >
      {/* Moon icon — shown in light mode */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 dark-hidden"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      {/* Sun icon — shown in dark mode */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 light-hidden"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      <style jsx>{`
        :global([data-theme="dark"]) .dark-hidden {
          display: none;
        }
        :global([data-theme="light"]) .light-hidden {
          display: none;
        }
      `}</style>
    </button>
  );
}

function GitHubLink() {
  return (
    <a
      href="https://github.com/DamianGiambazi/kalipso"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub repository"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors hover:border-[var(--border)]"
      style={{ color: "var(--text-muted)" }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    </a>
  );
}
