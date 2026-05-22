export function Hero() {
  return (
    <header className="mb-12">
      <h1
        className="mb-3 text-[clamp(1.875rem,4vw,2.375rem)] font-medium leading-[1.1] tracking-tight"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--text)",
        }}
      >
        A permanent ledger of human intentions.
      </h1>
      <p
        className="m-0 max-w-xl text-[17px] leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        Type any promise, claim, or commitment. Kalipso responds with a brief
        observation and notarises your words forever to Hedera Consensus Service.
      </p>
    </header>
  );
}
