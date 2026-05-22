import type { KalipsoNotarization } from "@/lib/types";

interface ResponseCardProps {
  notarization: KalipsoNotarization;
}

export function ResponseCard({ notarization }: ResponseCardProps) {
  const formattedTimestamp = formatTimestamp(notarization.consensusTimestamp);

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Notarisation result"
      className="mb-12 overflow-hidden rounded-lg border shadow-sm"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
        style={{
          backgroundColor: "var(--bg-subtle)",
          borderColor: "var(--border-soft)",
        }}
      >
        <div className="flex items-center gap-3">
          <StatusPill />
          <span
            className="text-[13px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Sequence #{notarization.sequenceNumber}
          </span>
        </div>
        <RegisterBadge register={notarization.register} />
      </div>

      {/* Body */}
      <div className="px-5 py-6">
        <p
          className="mb-6 text-[1.25rem] leading-relaxed tracking-tight"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text)",
          }}
        >
          {notarization.aiComment}
        </p>

        {/* Chain details */}
        <dl
          className="mb-5 grid gap-2 rounded-md border p-4"
          style={{
            gridTemplateColumns: "max-content 1fr",
            backgroundColor: "var(--bg-mono-soft)",
            borderColor: "var(--border-soft)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <ChainDetailRow label="Transaction" value={notarization.transactionId} />
          <ChainDetailRow label="Consensus" value={formattedTimestamp} />
          <ChainDetailRow label="Topic" value={notarization.topicId} />
          <ChainDetailRow label="Hash" value={notarization.statementHash} />
        </dl>

        {/* Footer link */}
        <div className="flex justify-end">
          <a
            href={notarization.hashscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            View on HashScan
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function StatusPill() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest"
      style={{
        fontFamily: "var(--font-mono)",
        backgroundColor: "var(--status-ok-bg)",
        color: "var(--status-ok-text)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-2.5 w-2.5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Recorded
    </span>
  );
}

function RegisterBadge({ register }: { register: "EVERYDAY" | "SERIOUS" }) {
  return (
    <span
      className="rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest"
      style={{
        fontFamily: "var(--font-mono)",
        backgroundColor: "var(--bg-mono)",
        color: "var(--text-muted)",
      }}
    >
      {register === "SERIOUS" ? "Serious" : "Everyday"}
    </span>
  );
}

function ChainDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt
        className="m-0 text-xs font-medium uppercase tracking-wider"
        style={{
          fontFamily: "var(--font-sans)",
          color: "var(--text-faint)",
        }}
      >
        {label}
      </dt>
      <dd
        className="m-0 break-all text-[13px]"
        style={{ color: "var(--text)" }}
      >
        {value}
      </dd>
    </>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  } catch {
    return iso;
  }
}
