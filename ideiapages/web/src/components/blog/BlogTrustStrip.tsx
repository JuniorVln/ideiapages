import Image from "next/image";
import { IDEIA } from "@/lib/ideia-brand";

const COPY = (
  <>
    <span className="font-semibold text-text">+400 empresas</span> usam a plataforma. Atendimento
    humano, IA e API oficial do WhatsApp Business.
  </>
);

function MarqueeUnit({ accessible }: { accessible: boolean }) {
  const inner = (
    <>
      {accessible ? (
        <a
          href={IDEIA.homeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 opacity-90 hover:opacity-100 transition-opacity"
        >
          <Image
            src={IDEIA.logoUrl}
            alt={IDEIA.logoAlt}
            width={180}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain"
            unoptimized
            priority
          />
        </a>
      ) : (
        <span className="shrink-0 inline-flex opacity-90">
          <Image
            src={IDEIA.logoUrl}
            alt=""
            width={180}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain"
            unoptimized
          />
        </span>
      )}
      <p className="text-sm text-text-muted whitespace-nowrap max-w-none">{COPY}</p>
    </>
  );

  if (accessible) {
    return (
      <div className="flex shrink-0 items-center gap-6 sm:gap-10 pl-6 sm:pl-10 pr-10 sm:pr-16">
        {inner}
      </div>
    );
  }

  return (
    <div
      className="blog-trust-marquee-duplicate flex shrink-0 items-center gap-6 sm:gap-10 pl-6 sm:pl-10 pr-10 sm:pr-16"
      aria-hidden
    >
      {inner}
    </div>
  );
}

export function BlogTrustStrip() {
  return (
    <section
      className="relative border-t border-slate-200/90 border-b border-slate-100 bg-surface-alt overflow-hidden"
      aria-label="Autoridade e confiança"
    >
      <span className="sr-only">
        Mais de 400 empresas usam a plataforma Ideia Chat, com atendimento humano, IA e API oficial
        do WhatsApp Business.
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-20 bg-gradient-to-r from-[var(--color-surface-alt)] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-20 bg-gradient-to-l from-[var(--color-surface-alt)] to-transparent"
        aria-hidden
      />

      <div className="blog-trust-marquee-wrapper py-4 sm:py-5">
        <div className="blog-trust-marquee-track">
          <MarqueeUnit accessible />
          <MarqueeUnit accessible={false} />
          <MarqueeUnit accessible={false} />
        </div>
      </div>
    </section>
  );
}
