const STATS = [
  { value: "400+", label: "empresas ativas" },
  { value: "24h", label: "tempo típico de setup" },
  { value: "API Meta", label: "oficial WhatsApp" },
] as const;

export function BlogSocialProof() {
  return (
    <section
      className="mt-10 rounded-2xl border border-border bg-surface p-6 md:p-8"
      aria-label="Números e resultados"
    >
      <h2 className="text-lg font-bold text-text mb-4">Por que equipes confiam no Ideia Chat</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {STATS.map((s) => (
          <li key={s.label} className="text-center sm:text-left">
            <p className="text-2xl font-bold text-ideia-primary tabular-nums">{s.value}</p>
            <p className="text-sm text-text-muted mt-1">{s.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
