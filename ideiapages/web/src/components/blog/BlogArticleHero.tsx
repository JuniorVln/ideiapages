import Link from "next/link";
import Image from "next/image";
import { ScrollToSectionButton } from "@/components/ui/ScrollToSectionButton";
import { IDEIA } from "@/lib/ideia-brand";
import { heroTitleParts } from "@/lib/blog/hero-title";
import { formatDatePtBrLong } from "@/lib/format-date-br";
import { CONTENT_HUB_NAME, HERO_BRAND_LINE, PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

/** Cor de fundo base do hero (azul muito escuro, coerente com a marca). */
const BG = "#0f172a";

interface SalesPageHeroProps {
  titulo: string;
  subtitulo: string | null;
  focusKeyword: string | null;
  heroImageSrc: string | null;
  heroImageAlt: string;
  heroCredit?: string | null;
  /** ISO date para GEO / confiança */
  publicadoEm?: string | null;
  /** Texto do CTA no hero (rola até #demonstracao-gratuita). Default: ver valores e demo. */
  heroCtaLabel?: string;
}

export function SalesPageHero({
  titulo,
  subtitulo,
  focusKeyword,
  heroImageSrc,
  heroImageAlt,
  heroCredit,
  publicadoEm,
  heroCtaLabel = "Ver valores e demonstração",
}: SalesPageHeroProps) {
  const parts = heroTitleParts(titulo, focusKeyword);
  const pexelsHost = "images.pexels.com";

  return (
    <section
      className="relative overflow-hidden text-white border-b border-white/10"
      style={{ backgroundColor: BG, minHeight: 400 }}
      aria-labelledby="sales-page-hero-heading"
    >
      {/* ── Camada 0 · imagem de fundo (cobre a seção inteira) ──────────── */}
      {heroImageSrc ? (
        <div className="absolute inset-0 z-0" aria-hidden>
          {heroImageSrc.includes(pexelsHost) ? (
            <Image
              src={heroImageSrc}
              alt=""
              fill
              className="object-cover object-[center_30%]"
              sizes="100vw"
              priority
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica (storage/OG)
            <img
              src={heroImageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
              loading="eager"
              decoding="async"
            />
          )}
        </div>
      ) : null}

      {/* ── Camada 1 · degradês (escondem bordas, escuram lado esquerdo) ── */}
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
        {/*
          Esquerda → direita:
          – 0-28 %  : cor sólida (texto sempre legível)
          – 28-58 % : transição suave
          – 58-88 % : imagem quase sem sobreposição
          – 88-100%: sombra leve na borda direita
        */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right,
              ${BG}          0%,
              ${BG}          28%,
              rgba(15,23,42,.88) 44%,
              rgba(15,23,42,.52) 58%,
              rgba(15,23,42,.16) 74%,
              transparent    88%)`,
          }}
        />
        {/* borda direita */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(15,23,42,.5) 0%, transparent 20%)",
          }}
        />
        {/* borda superior */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              ${BG}          0%,
              rgba(15,23,42,.65) 12%,
              transparent    32%)`,
          }}
        />
        {/* borda inferior */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top,
              ${BG}          0%,
              rgba(15,23,42,.72) 14%,
              transparent    36%)`,
          }}
        />
        {/* mobile: overlay mais opaco para legibilidade */}
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: "rgba(15,23,42,.65)" }}
        />
      </div>

      {/* ── Camada 2 · conteúdo ─────────────────────────────────────────── */}
      <div className="relative z-20 max-w-container mx-auto px-4 pt-10 pb-14 md:pt-12 md:pb-16">
        {/* Logo + tag */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link href={IDEIA.homeUrl} className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL externa da marca */}
            <img
              src={IDEIA.logoUrl}
              alt={IDEIA.logoAlt}
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <span className="hidden sm:inline text-zinc-600" aria-hidden>|</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-ideia-primary">
            {HERO_BRAND_LINE}
          </p>
        </div>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Início
              </Link>
            </li>
            <li aria-hidden className="text-zinc-600">/</li>
            <li>
              <Link href={PUBLIC_CONTENT_BASE_PATH} className="hover:text-white transition-colors">
                {CONTENT_HUB_NAME}
              </Link>
            </li>
            <li aria-hidden className="text-zinc-600">/</li>
            <li
              className="text-white font-medium truncate max-w-[min(100%,220px)]"
              aria-current="page"
            >
              {titulo}
            </li>
          </ol>
        </nav>

        {/* Texto limitado a ~55 % em desktop para ficar na zona escura e não colidir com a foto */}
        <div className="max-w-[min(100%,600px)] lg:max-w-[55%]">
          {publicadoEm ? (
            <time dateTime={publicadoEm} className="text-sm text-zinc-400 block mb-3">
              {formatDatePtBrLong(publicadoEm) || "—"} · Brasil
            </time>
          ) : (
            <span className="text-sm text-zinc-400 block mb-3">
              Conteúdo para o mercado brasileiro
            </span>
          )}

          <h1
            id="sales-page-hero-heading"
            className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.1] tracking-tight text-white text-balance mb-4"
          >
            {parts.highlight ? (
              <>
                {parts.before}
                <span className="text-ideia-primary">{parts.highlight}</span>
                {parts.after}
              </>
            ) : (
              parts.before
            )}
          </h1>

          {subtitulo ? (
            <p className="text-lg md:text-xl text-ideia-secondary text-pretty leading-relaxed mb-8">
              {subtitulo}
            </p>
          ) : null}

          <ScrollToSectionButton
            targetId="demonstracao-gratuita"
            size="lg"
            className="uppercase tracking-wide text-sm shadow-lg shadow-black/20"
            aria-label={`${heroCtaLabel} — rolar até a seção de valores e demonstração`}
          >
            {heroCtaLabel}
          </ScrollToSectionButton>
        </div>

        {/* Crédito da foto — discreto, canto inferior direito */}
        {heroCredit ? (
          <p className="mt-10 text-right text-[11px] text-zinc-600 select-none">
            Foto: {heroCredit} · Pexels
          </p>
        ) : null}

        {/* Sentinel para o StickyHeader detectar scroll */}
        <div id="hero-scroll-sentinel" aria-hidden className="h-px w-full mt-10" />
      </div>
    </section>
  );
}
