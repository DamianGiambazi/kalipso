interface ErrorCardProps {
  code: string;
  message: string;
  correlationId?: string;
  onDismiss: () => void;
}

export function ErrorCard({ code, message, correlationId, onDismiss }: ErrorCardProps) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="mb-12 overflow-hidden rounded-lg border"
      style={{
        backgroundColor: "var(--status-err-bg)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ color: "var(--status-err-text)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <div>
            <p
              className="m-0 text-sm font-medium"
              style={{ color: "var(--status-err-text)" }}
            >
              {message}
            </p>
            <p
              className="mt-1 text-xs"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
              }}
            >
              {code}
              {correlationId ? ` · ${correlationId}` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="flex-shrink-0 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>
    </section>
  );
}
