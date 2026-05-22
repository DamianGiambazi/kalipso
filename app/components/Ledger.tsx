"use client";

import type { WallEntry } from "@/lib/types";
import { LedgerEntry } from "./LedgerEntry";

interface LedgerProps {
  entries: WallEntry[];
  isLoading: boolean;
  error: string | null;
}

export function Ledger({ entries, isLoading, error }: LedgerProps) {
  const topicId = process.env.NEXT_PUBLIC_KALIPSO_TOPIC_ID ?? "0.0.9020209";

  return (
    <section className="mt-16" aria-label="Recent notarisations">
      <header
        className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b pb-3"
        style={{ borderColor: "var(--border)" }}
      >
        <h2
          className="m-0 text-lg font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          The Ledger
        </h2>
        <span
          className="text-xs"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
          }}
        >
          Topic {topicId} · {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </header>

      {error && entries.length === 0 && (
        <div
          className="rounded-md border p-5 text-center text-sm"
          style={{
            color: "var(--text-muted)",
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          {error}
        </div>
      )}

      {isLoading && entries.length === 0 && (
        <div
          className="rounded-md border p-5 text-center text-sm"
          style={{
            color: "var(--text-muted)",
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          Loading the ledger…
        </div>
      )}

      {entries.length > 0 && (
        <ol
          className="m-0 list-none overflow-hidden rounded-lg border p-0"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          {entries.map((entry) => (
            <LedgerEntry key={entry.sequenceNumber} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  );
}
