export function Footer() {
  return (
    <footer
      className="mt-16 border-t pt-8"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mb-5">
        <a
          href="https://github.com/DamianGiambazi/kalipso"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm transition-colors"
          style={{
            color: "var(--text-muted)",
            borderBottom: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.borderBottomColor = "var(--border-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderBottomColor = "transparent";
          }}
        >
          GitHub
        </a>
      </div>

      <p
        className="m-0 max-w-2xl text-[13px] leading-relaxed"
        style={{ color: "var(--text-faint)" }}
      >
        Kalipso&apos;s voice is in the contemplative tradition of{" "}
        <a
          href="https://en.wikipedia.org/wiki/George_Santayana"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--text-muted)",
            borderBottom: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.borderBottomColor = "var(--border-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderBottomColor = "transparent";
          }}
        >
          George Santayana
        </a>
        {" "}(1863&ndash;1952), the Spanish-American philosopher who taught at
        Harvard for forty years. The persona observes human intention with the
        patient, affectionate detachment of a teacher who has watched many
        promises made and broken&mdash;and, occasionally, kept.
      </p>
    </footer>
  );
}
