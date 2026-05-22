"use client";

import { useState } from "react";
import type { KalipsoNotarization } from "@/lib/types";

interface StatementFormProps {
  onResult: (result: KalipsoNotarization) => void;
  onError: (error: { code: string; message: string; correlationId?: string }) => void;
  onRecording: (isRecording: boolean) => void;
  isRecording: boolean;
}

const MAX_CHARS = 500;

export function StatementForm({
  onResult,
  onError,
  onRecording,
  isRecording,
}: StatementFormProps) {
  const [statement, setStatement] = useState("");

  const charCount = statement.length;
  const overLimit = charCount > MAX_CHARS;
  const canSubmit = statement.trim().length > 0 && !overLimit && !isRecording;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    onRecording(true);

    try {
      const response = await fetch("/api/notarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({
          error: { code: "INTERNAL", message: "Unknown error" },
        }));
        onError(errBody.error);
        return;
      }

      const result: KalipsoNotarization = await response.json();
      onResult(result);
      setStatement(""); // clear the input on success
    } catch (err) {
      onError({
        code: "INTERNAL",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      onRecording(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Notarise a statement" className="mb-12">
      {/* Privacy notice */}
      <p
        className="mb-3 flex items-start gap-2 text-[13px] leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-70"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Whatever you type goes to a public, permanent record on Hedera. Anyone
          can read it forever. Don&apos;t put real secrets here.
        </span>
      </p>

      {/* Input */}
      <label htmlFor="statement" className="sr-only">
        Your statement
      </label>
      <textarea
        id="statement"
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder="A promise, a claim, a commitment…"
        maxLength={MAX_CHARS + 50} /* allow slight overshoot for visual feedback */
        rows={3}
        disabled={isRecording}
        className="w-full min-h-[5rem] resize-y rounded-md border p-4 text-base leading-relaxed transition-colors focus:outline-none disabled:opacity-60"
        style={{
          fontFamily: "var(--font-sans)",
          backgroundColor: "var(--bg-input)",
          color: "var(--text)",
          borderColor: "var(--border)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Actions row */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className="text-xs tabular-nums"
          style={{
            fontFamily: "var(--font-mono)",
            color: overLimit ? "var(--status-err-text)" : "var(--text-faint)",
          }}
        >
          {charCount} / {MAX_CHARS}
        </span>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: canSubmit ? "var(--accent)" : "var(--text-faint)",
          }}
          onMouseEnter={(e) => {
            if (canSubmit) e.currentTarget.style.backgroundColor = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            if (canSubmit) e.currentTarget.style.backgroundColor = "var(--accent)";
          }}
        >
          {isRecording ? (
            <>
              <span className="animate-spin inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" />
              Recording…
            </>
          ) : (
            <>
              Notarise
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
