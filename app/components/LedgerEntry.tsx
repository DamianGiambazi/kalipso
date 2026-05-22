import type { WallEntry } from "@/lib/types";
import { toHashscanTransactionUrl } from "@/lib/hashscan-url";

interface LedgerEntryProps {
  entry: WallEntry;
}

export function LedgerEntry({ entry }: LedgerEntryProps) {
  const formattedTime = formatTime(entry.consensusTimestamp);
  const hashscanUrl = toHashscanTransactionUrl(entry.transactionId);

  return (
    <li
      className="border-b px-5 py-5 transition-colors last:border-b-0"
      style={{ borderColor: "var(--border-soft)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Meta row: sequence + time */}
      <div
        className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
            #{entry.sequenceNumber}
          </span>
          <span className="tabular-nums">{formattedTime}</span>
        </div>
      </div>

      {/* Statement */}
      <p
        className="m-0 mb-3 text-[15px] font-medium leading-snug"
        style={{ color: "var(--text)" }}
      >
        &ldquo;{entry.statement}&rdquo;
      </p>

      {/* AI comment */}
      <p
        className="m-0 mb-3 border-l-2 pl-4 text-[15px] leading-relaxed"
        style={{
          fontFamily: "var(--font-serif)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        {entry.aiComment}
      </p>

      {/* Action: HashScan link */}
      <div className="flex justify-end">
        <a
          href={hashscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-colors"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--accent-text)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          HashScan
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2.5 w-2.5"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </li>
  );
}

function formatTime(consensusTimestamp: string): string {
  try {
    if (consensusTimestamp.includes("T")) {
      const date = new Date(consensusTimestamp);
      if (isNaN(date.getTime())) return consensusTimestamp;
      return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
    } else {
      const seconds = parseFloat(consensusTimestamp);
      if (isNaN(seconds)) return consensusTimestamp;
      const date = new Date(seconds * 1000);
      if (isNaN(date.getTime())) return consensusTimestamp;
      return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
    }
  } catch {
    return consensusTimestamp;
  }
}
