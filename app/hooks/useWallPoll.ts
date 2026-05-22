// app/hooks/useWallPoll.ts
// Polls /api/wall every 3 seconds. Returns deduplicated entries,
// newest first. Supports optimistic prepending of a brand-new
// notarization so the user's own message appears immediately,
// before mirror-node catches up.

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { WallEntry, KalipsoNotarization } from "@/lib/types";

const POLL_INTERVAL_MS = 3_000;

interface UseWallPollResult {
  entries: WallEntry[];
  isLoading: boolean;
  error: string | null;
  prependOptimistic: (notarization: KalipsoNotarization) => void;
  refresh: () => void;
}

export function useWallPoll(): UseWallPollResult {
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optimistic entries that haven't been seen on the mirror node yet.
  // Keyed by sequenceNumber.
  const optimisticRef = useRef<Map<number, WallEntry>>(new Map());

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch("/api/wall?limit=10", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message ?? `Mirror returned ${res.status}`;
        setError(msg);
        return;
      }
      const data: { entries: WallEntry[] } = await res.json();
      const mirrorEntries = data.entries ?? [];

      // Remove any optimistic entries that the mirror has now seen.
      const mirrorSeqs = new Set(mirrorEntries.map((e) => e.sequenceNumber));
      for (const seq of Array.from(optimisticRef.current.keys())) {
        if (mirrorSeqs.has(seq)) {
          optimisticRef.current.delete(seq);
        }
      }

      // Merge optimistic + mirror, then dedupe by sequenceNumber,
      // newest-first by sequenceNumber descending.
      const merged = new Map<number, WallEntry>();
      for (const entry of optimisticRef.current.values()) {
        merged.set(entry.sequenceNumber, entry);
      }
      for (const entry of mirrorEntries) {
        merged.set(entry.sequenceNumber, entry);
      }
      const final = Array.from(merged.values())
        .sort((a, b) => b.sequenceNumber - a.sequenceNumber)
        .slice(0, 10);

      setEntries(final);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mount: fetch once + start polling
  useEffect(() => {
    let active = true;

    const tick = async () => {
      if (!active) return;
      await fetchOnce();
    };

    tick(); // initial fetch
    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchOnce]);

  // Optimistic prepend — called by the form when a notarization
  // succeeds, so the user sees their own message instantly.
  const prependOptimistic = useCallback((notarization: KalipsoNotarization) => {
    const entry: WallEntry = {
      statement: notarization.statement,
      aiComment: notarization.aiComment,
      consensusTimestamp: notarization.consensusTimestamp,
      sequenceNumber: notarization.sequenceNumber,
      transactionId: notarization.transactionId,
    };

    optimisticRef.current.set(entry.sequenceNumber, entry);

    setEntries((prev) => {
      const merged = new Map<number, WallEntry>();
      merged.set(entry.sequenceNumber, entry);
      for (const e of prev) merged.set(e.sequenceNumber, e);
      return Array.from(merged.values())
        .sort((a, b) => b.sequenceNumber - a.sequenceNumber)
        .slice(0, 10);
    });
  }, []);

  return { entries, isLoading, error, prependOptimistic, refresh: fetchOnce };
}
