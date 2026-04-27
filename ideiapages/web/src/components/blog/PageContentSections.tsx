import Image from "next/image";
import { PricingAndDemoCta } from "@/components/blog/PricingAndDemoCta";
import type { ParsedSection, SectionBlock } from "@/lib/blog/parse-sections";
import {
  buildPexelsQuery,
  pickPexelsStockFallback,
  pexelsDiversifyIndex,
  pexelsMarkUrlUsed,
  pexelsSeedUsedSet,
  searchPexelsPhotoExcluding,
} from "@/lib/pexels";

/* ─────────────────────────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────────────────────────── */
const IcCheck = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);
const IcArrow = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden>
    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────
   Eyebrow: traço + número — `onDark` = mesmo azul claro dos passos (foto + overlay)
───────────────────────────────────────────────────────────────── */
function Eyebrow({
  num,
  centered = false,
  onDark = false,
  dark = false,
}: { num: string; dark?: boolean; centered?: boolean; onDark?: boolean }) {
  const useLightOnDark = onDark || dark;
  const c = useLightOnDark ? "var(--color-ideia-chat-bright)" : "var(--color-ideia-chat)";
  return (
    <div className={`flex items-center gap-2.5 ${centered ? "justify-center mb-4 md:mb-5" : "mb-3 md:mb-4"}`}>
      <span
        className="block w-6 shrink-0 self-center rounded-full [min-width:1.5rem] [min-height:3px] h-[3px]"
        style={{ backgroundColor: c }}
        aria-hidden
      />
      <span className="text-xs font-bold tabular-nums tracking-widest font-ideia" style={{ color: c }}>
        {num}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Tipos
───────────────────────────────────────────────────────────────── */
interface FaqItem { pergunta: string; resposta: string }
interface InlineFigure { src: string | null; alt: string; credit: string | null }
interface Props {
  sections: ParsedSection[];
  faqs: FaqItem[];
  inlineFigure?: InlineFigure;
  /** URLs já usadas (hero, faixa, etc.) — Pexels não deve repetir nas secções. */
  excludeImageSrcs?: string[];
  /** Título da página (fallback na query Pexels da coluna split) */
  pageTitulo: string;
  /** Keyword do termo SEO — alinha buscas de imagem ao tema real */
  focusKeyword: string | null;
  paginaId: string;
  variacaoId?: string;
  whatsappNumber: string;
}

function headingPlain(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\*\*/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SPLIT_QUERY_SUFFIXES = [
  "professional portrait office",
  "workplace team meeting",
  "executive business diverse",
  "corporate collaboration",
  "office meeting natural light",
] as const;

/** Uma imagem por secção Split: query + índice por `layoutSlot`; marca `used` ao devolver. */
async function resolveSplitColumnImage(
  section: ParsedSection,
  pageTitulo: string,
  focusKeyword: string | null,
  used: Set<string>,
  layoutSlot: number,
): Promise<InlineFigure> {
  const base = headingPlain(section.heading) || pageTitulo;
  const suffix = SPLIT_QUERY_SUFFIXES[layoutSlot % SPLIT_QUERY_SUFFIXES.length]!;
  const query = `${buildPexelsQuery(base, focusKeyword)} ${suffix}`.replace(/\s+/g, " ").trim();
  const idx = pexelsDiversifyIndex(`${base}|${focusKeyword ?? ""}|split|${layoutSlot}`, 12);
  const p = await searchPexelsPhotoExcluding(
    { query, orientation: "portrait", resultIndex: Math.max(0, idx + layoutSlot * 2) },
    used,
  );
  if (p) {
    pexelsMarkUrlUsed(used, p.src);
    return { src: p.src, alt: p.alt, credit: p.photographer };
  }
  const fb = pickPexelsStockFallback(`${base}|split-fb|${layoutSlot}`, used);
  pexelsMarkUrlUsed(used, fb.src);
  return { src: fb.src, alt: fb.alt, credit: fb.credit };
}

const STEPS_PEXELS_FLAVORS = [
  "team discussion",
  "office planning",
  "workplace meeting",
  "business people laptop",
  "collaboration office",
  "client meeting professional",
] as const;

/** Fundo da secção “steps”: query + sabor distintos por `salt`; marca `used`. */
async function resolveStepsBackdropImage(
  section: ParsedSection,
  pageTitulo: string,
  focusKeyword: string | null,
  salt: number,
  used: Set<string>,
): Promise<InlineFigure> {
  const base = headingPlain(section.heading) || pageTitulo;
  const flavor = STEPS_PEXELS_FLAVORS[Math.abs(salt) % STEPS_PEXELS_FLAVORS.length]!;
  const query = `${buildPexelsQuery(base, focusKeyword)} ${flavor}`.replace(/\s+/g, " ").trim();
  const idx = pexelsDiversifyIndex(`${base}|${focusKeyword ?? ""}|steps|${salt}`, 14);
  const p = await searchPexelsPhotoExcluding(
    {
      query,
      orientation: "landscape",
      resultIndex: Math.min(12, 2 + idx + salt * 3),
    },
    used,
  );
  if (p) {
    pexelsMarkUrlUsed(used, p.src);
    return { src: p.src, alt: p.alt, credit: p.photographer };
  }
  const fb = pickPexelsStockFallback(`${base}|steps-fb|${salt}`, used);
  pexelsMarkUrlUsed(used, fb.src);
  return { src: fb.src, alt: fb.alt, credit: fb.credit };
}

function listItems(blocks: SectionBlock[]): string[] {
  return blocks.flatMap((b) => (b.type === "list" ? b.items : []));
}
function paragraphs(blocks: SectionBlock[]): string[] {
  return blocks.flatMap((b) => (b.type === "paragraph" ? [b.html] : []));
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT 0 — Card Grid  (fundo branco)
   Seções de lista como cards em grelha 2-3 colunas
───────────────────────────────────────────────────────────────── */
function LayoutGrid({ s, num }: { s: ParsedSection; num: string }) {
  const items = listItems(s.blocks);
  const paras = paragraphs(s.blocks);
  return (
    <section className="py-16 bg-white" aria-labelledby={`sh-${num}`}>
      <div className="max-w-container mx-auto px-4">
        <Eyebrow num={num} />
        {s.heading && (
          <h2
            id={`sh-${num}`}
            className="text-2xl md:text-3xl font-black text-slate-900 mb-4 font-ideia leading-tight"
            dangerouslySetInnerHTML={{ __html: s.headingHtml ?? s.heading }}
          />
        )}
        {paras.map((p, i) => (
          <p key={i} className="text-slate-500 leading-relaxed mb-6 max-w-2xl [&_strong]:text-slate-800 [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: p }} />
        ))}
        {items.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((html, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4 hover:border-ideia-primary/30 hover:shadow-md transition-all duration-200">
                <span className="mt-0.5 rounded-full bg-ideia-primary text-white p-1.5"><IcCheck /></span>
                <span className="text-sm text-slate-700 leading-relaxed [&_strong]:font-semibold [&_strong]:text-slate-900" dangerouslySetInnerHTML={{ __html: html }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT 1 — Steps com imagem de fundo + overlay
   Imagem cobre a seção inteira; overlay escuro contrasta com o texto
───────────────────────────────────────────────────────────────── */
const PEXELS_HOST_STEPS = "images.pexels.com";

function LayoutSteps({ s, num, imageFig }: { s: ParsedSection; num: string; imageFig?: InlineFigure }) {
  const items = listItems(s.blocks);
  const paras = paragraphs(s.blocks);
  const img = imageFig?.src ?? null;

  return (
    <section
      className="relative overflow-hidden py-20 md:py-24 min-h-[440px] md:min-h-[540px]"
      aria-labelledby={`sh-${num}`}
    >
      {/* ── Fundo: imagem ou cor sólida ── */}
      {img ? (
        <div className="absolute inset-0 z-0" aria-hidden>
          {img.includes(PEXELS_HOST_STEPS) ? (
            <Image src={img} alt="" fill className="object-cover object-center" sizes="100vw" priority={false} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover object-center" loading="lazy" />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-slate-800" aria-hidden />
      )}

      {/* ── Overlay ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,58,138,0.82) 50%, rgba(30,64,175,0.72) 100%)" }}
        aria-hidden
      />

      {/* ── Conteúdo: flex + items-start (evita bugs de alinhamento com sticky/grid) ── */}
      <div className="relative z-20 max-w-container mx-auto px-4 flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16 md:items-start">
        {/* esquerda: heading (sem sticky — alinha ao topo com a lista) */}
        <div className="w-full md:w-[38%] md:max-w-xl md:shrink-0">
          <Eyebrow num={num} onDark />
          {s.heading && (
            <h2
              id={`sh-${num}`}
              className="text-2xl md:text-3xl font-black text-white font-ideia leading-tight mt-2"
              dangerouslySetInnerHTML={{ __html: s.headingHtml ?? s.heading }}
            />
          )}
          {paras.map((p, i) => (
            <p key={i} className="mt-3 text-white/65 text-sm leading-relaxed [&_strong]:text-white [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: p }} />
          ))}
          {imageFig?.credit && (
            <p className="mt-6 text-[10px] text-white/30 select-none">Foto: {imageFig.credit} · Pexels</p>
          )}
        </div>

        {/* direita: steps (lista sem margem UA) */}
        {items.length > 0 && (
          <ol className="m-0 p-0 list-none flex flex-col w-full md:flex-1 md:min-w-0">
            {items.map((html, i) => (
              <li
                key={i}
                className={`flex gap-5 items-start border-b border-white/20 last:border-0 group ${i === 0 ? "pt-0 pb-5" : "py-5"}`}
              >
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full border-2 font-black text-sm flex items-center justify-center font-ideia bg-transparent transition-colors duration-200 group-hover:text-white group-hover:[background-color:var(--color-ideia-chat)] group-hover:[border-color:var(--color-ideia-chat)]"
                  style={{
                    borderColor: "var(--color-ideia-chat-bright)",
                    color: "var(--color-ideia-chat-bright)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white/85 leading-relaxed pt-0.5 [&_strong]:font-semibold [&_strong]:text-white" dangerouslySetInnerHTML={{ __html: html }} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT 2 — Split Column  (fundo verde-claro)
   Esquerda: heading + items em cards  |  Direita: imagem Pexels
───────────────────────────────────────────────────────────────── */
function LayoutSplit({ s, num, imageFig }: { s: ParsedSection; num: string; imageFig?: InlineFigure }) {
  const items = listItems(s.blocks);
  const paras = paragraphs(s.blocks);
  const img = imageFig?.src ?? null;
  const PEXELS = "images.pexels.com";

  return (
    <section className="py-16 bg-blue-50/80" aria-labelledby={`sh-${num}`}>
      <div className="max-w-container mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-12 md:items-stretch">

        {/* ── Coluna esquerda: eyebrow + heading + items ── */}
        <div className="flex flex-col min-h-0">
          <Eyebrow num={num} />
          {s.heading && (
            <h2
              id={`sh-${num}`}
              className="text-2xl md:text-3xl font-black text-slate-900 font-ideia leading-tight mb-4"
              dangerouslySetInnerHTML={{ __html: s.headingHtml ?? s.heading }}
            />
          )}
          {paras.map((p, i) => (
            <p key={i} className="text-slate-600 leading-relaxed mb-4 [&_strong]:font-semibold [&_strong]:text-slate-900" dangerouslySetInnerHTML={{ __html: p }} />
          ))}
          {items.length > 0 && (
            <ul className="flex flex-col gap-3 mt-2 w-full">
              {items.map((html, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm border-l-4 border-ideia-primary hover:shadow-md transition-shadow duration-200 w-full">
                  <span className="mt-0.5 text-ideia-primary shrink-0"><IcArrow /></span>
                  <span className="text-sm text-slate-700 leading-relaxed [&_strong]:font-semibold [&_strong]:text-slate-900" dangerouslySetInnerHTML={{ __html: html }} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Coluna direita: imagem à altura da coluna esquerda (desktop) ── */}
        <div className="relative w-full min-h-[260px] h-[280px] md:h-full md:min-h-0 md:self-stretch rounded-2xl overflow-hidden shadow-lg bg-slate-200">
          {img ? (
            <>
              {img.includes(PEXELS) ? (
                <Image
                  src={img}
                  alt={imageFig?.alt ?? ""}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt={imageFig?.alt ?? ""}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="lazy"
                />
              )}
              <div
                className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent pointer-events-none"
                aria-hidden
              />
              {imageFig?.credit && (
                <p className="absolute bottom-1.5 right-2.5 text-[10px] text-white/70 select-none drop-shadow-sm">
                  Foto: {imageFig.credit} · Pexels
                </p>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200/90">
              <span className="text-white/40 text-4xl font-black font-ideia select-none">{num}</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

/** Parte o título em duas linhas (branco + destaque) quando há " — " ou <br> no HTML. */
function splitHeadingHtml(headingHtml: string | null, fallback: string): { first: string; second: string | null } {
  const h = (headingHtml ?? fallback).trim();
  const brMatch = h.match(/^(.+?)<br\s*\/?>\s*(.+)$/is);
  if (brMatch) {
    return { first: brMatch[1]!.trim(), second: brMatch[2]!.trim() };
  }
  const idx = h.search(/\s+[—–]\s+/);
  if (idx !== -1) {
    return {
      first: h.slice(0, idx).trim(),
      second: h.slice(idx).replace(/^\s+[—–]\s+/, "").trim(),
    };
  }
  return { first: h, second: null };
}

/** Extrai título forte + corpo por item de lista (markdown → <strong>). */
function splitListItem(html: string): { titleHtml: string; bodyHtml: string } {
  const endStrong = html.indexOf("</strong>");
  if (endStrong !== -1) {
    const titleHtml = html.slice(0, endStrong + 9).trim();
    const bodyHtml = html
      .slice(endStrong + 9)
      .replace(/^\s*[—\-–:]\s*/, "")
      .trim();
    return { titleHtml, bodyHtml };
  }
  return { titleHtml: html, bodyHtml: "" };
}

/** Ícones médios para cards da secção 05 (rotacionam por índice). */
function TimelineCardIcon({ index }: { index: number }) {
  const cls = "size-9 md:size-10 text-ideia-primary shrink-0";
  const k = index % 3;
  if (k === 0) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M7 15l2-4 2 4 3-7 3 7" />
        <path strokeLinecap="round" d="M4 9h4M14 9h6" />
      </svg>
    );
  }
  if (k === 1) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        <path strokeLinecap="round" d="M3 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
      <rect x="5" y="11" width="14" height="11" rx="2" />
      <path strokeLinecap="round" d="M12 15v3" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT 05 — Três cards com ícone (tema claro, sem linha)
   Só para a 3.ª secção H2 após o duo (rest[2] — ver ContentSection).
───────────────────────────────────────────────────────────────── */
function LayoutTimeline({ s, num }: { s: ParsedSection; num: string }) {
  const items = listItems(s.blocks);
  const paras = paragraphs(s.blocks);
  const { first: head1, second: head2 } = splitHeadingHtml(s.headingHtml ?? null, s.heading ?? "");

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      style={{
        background:
          "radial-gradient(ellipse 85% 55% at 50% 0%, rgba(30,64,175,0.07), transparent 50%), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(59,130,246,0.06), transparent 45%), #ffffff",
      }}
      aria-labelledby={`sh-${num}`}
    >
      <div className="relative max-w-container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow num={num} centered />
          {s.heading && (
            <h2 id={`sh-${num}`} className="mt-2 md:mt-3 font-ideia font-black leading-tight">
              {head2 ? (
                <>
                  <span
                    className="block text-2xl md:text-3xl lg:text-4xl text-slate-900 [&_strong]:text-slate-900"
                    dangerouslySetInnerHTML={{ __html: head1 }}
                  />
                  <span
                    className="block text-2xl md:text-3xl lg:text-4xl text-ideia-secondary mt-2 [&_strong]:text-ideia-secondary"
                    dangerouslySetInnerHTML={{ __html: head2 }}
                  />
                </>
              ) : (
                <span
                  className="block text-2xl md:text-3xl lg:text-4xl text-slate-900 [&_strong]:text-slate-900"
                  dangerouslySetInnerHTML={{ __html: head1 }}
                />
              )}
            </h2>
          )}
          {paras.map((p, i) => (
            <p
              key={i}
              className="mt-5 text-sm md:text-base text-slate-600 leading-relaxed [&_strong]:text-slate-800 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
        </div>

        {items.length > 0 ? (
          <ul className="mt-12 md:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 list-none m-0 p-0">
            {items.map((html, i) => {
              const { titleHtml, bodyHtml } = splitListItem(html);
              return (
                <li
                  key={i}
                  className="flex flex-col items-center text-center rounded-3xl border border-slate-100 bg-white px-7 py-9 md:px-8 md:py-10 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]"
                >
                  <div
                    className="mb-7 md:mb-8 flex size-[4.25rem] md:size-[4.75rem] items-center justify-center rounded-2xl bg-gradient-to-b from-ideia-primary/20 to-ideia-primary/5 shadow-[0_0_28px_-2px_rgba(30,64,175,0.35)] ring-1 ring-ideia-primary/15"
                    aria-hidden
                  >
                    <TimelineCardIcon index={i} />
                  </div>
                  <div className="w-full space-y-3">
                    <p
                      className="text-sm md:text-base font-bold text-ideia-secondary leading-snug [&_strong]:text-ideia-secondary [&_strong]:font-bold"
                      dangerouslySetInnerHTML={{ __html: titleHtml }}
                    />
                    {bodyHtml ? (
                      <p
                        className="text-xs md:text-sm text-slate-600 leading-relaxed [&_strong]:text-slate-800 [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT 3 — Band List  (fundo branco, lista em faixas horizontais)
   Cada item ocupa a largura toda, com número pequeno e seta
───────────────────────────────────────────────────────────────── */
function LayoutBands({ s, num }: { s: ParsedSection; num: string }) {
  const items = listItems(s.blocks);
  const paras = paragraphs(s.blocks);
  return (
    <section className="py-16 bg-white" aria-labelledby={`sh-${num}`}>
      <div className="max-w-container mx-auto px-4">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <Eyebrow num={num} />
            {s.heading && (
              <h2
                id={`sh-${num}`}
                className="text-2xl md:text-3xl font-black text-slate-900 font-ideia leading-tight"
                dangerouslySetInnerHTML={{ __html: s.headingHtml ?? s.heading }}
              />
            )}
          </div>
          {paras.length > 0 && (
            <div className="max-w-sm">
              {paras.map((p, i) => (
                <p key={i} className="text-slate-500 text-sm leading-relaxed [&_strong]:text-slate-700 [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <ul className="border-t border-slate-200">
            {items.map((html, i) => (
              <li key={i} className="flex items-center gap-5 border-b border-slate-200 py-4 group hover:bg-slate-50 px-2 rounded-lg transition-colors duration-150 cursor-default">
                <span className="text-xs font-black text-ideia-primary/40 font-ideia w-6 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-slate-800 font-medium leading-snug [&_strong]:text-slate-900 [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: html }} />
                <span className="text-ideia-primary/30 group-hover:text-ideia-primary transition-colors duration-150 shrink-0">
                  <IcArrow />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT 4 — Callout Escuro  (fundo verde-escuro, texto claro)
   Seção de destaque invertida — cria contraste forte
───────────────────────────────────────────────────────────────── */
function LayoutCallout({ s, num }: { s: ParsedSection; num: string }) {
  const items = listItems(s.blocks);
  const paras = paragraphs(s.blocks);
  return (
    <section
      className="py-16 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#1e40af 100%)" }}
      aria-labelledby={`sh-${num}`}
    >
      {/* anel decorativo */}
      <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full border border-ideia-primary/10" aria-hidden />
      <div className="pointer-events-none absolute -right-4 -top-4 w-48 h-48 rounded-full border border-ideia-primary/10" aria-hidden />

      <div className="relative max-w-container mx-auto px-4">
        <Eyebrow num={num} dark />
        {s.heading && (
          <h2
            id={`sh-${num}`}
            className="text-2xl md:text-3xl font-black text-white font-ideia leading-tight mb-4 max-w-2xl"
            dangerouslySetInnerHTML={{ __html: s.headingHtml ?? s.heading }}
          />
        )}
        {paras.map((p, i) => (
          <p key={i} className="text-white/70 leading-relaxed mb-6 max-w-2xl [&_strong]:text-white [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: p }} />
        ))}
        {items.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {items.map((html, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors duration-200">
                <span className="mt-0.5 rounded-full bg-ideia-primary/20 text-ideia-primary p-1.5"><IcCheck /></span>
                <span className="text-sm text-white/80 leading-relaxed [&_strong]:text-white [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: html }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LAYOUT DUO — Seções 0+1 combinadas (inspirado USD Bloom)
   Top: heading grande esq + parágrafo/heading dir
   Bottom: bento de cards — 1 card destaque (verde claro) + cards escuros
───────────────────────────────────────────────────────────────── */
function LayoutDuo({ a, b }: { a: ParsedSection; b: ParsedSection }) {
  const itemsA = listItems(a.blocks);
  const itemsB = listItems(b.blocks);
  const parasA = paragraphs(a.blocks);
  const parasB = paragraphs(b.blocks);

  const colunaDireita = (() => {
    if (parasA.length > 0) return parasA.slice(0, 2);
    const pb0 = parasB[0] ?? "";
    if (b.heading && pb0) {
      return [`<strong>${b.headingHtml ?? b.heading}</strong>: ${pb0}`];
    }
    if (b.heading) {
      return [`<strong>${b.headingHtml ?? b.heading}</strong>`];
    }
    if (parasB.length > 0) return parasB.slice(0, 2);
    const primeiroCard = itemsA[0];
    if (primeiroCard) return [primeiroCard];
    return [];
  })();

  return (
    <section className="py-16 bg-white" aria-labelledby="duo-heading-a">
      <div className="max-w-container mx-auto px-4">

        {/* ── Topo: eyebrow + título em largura total; intro em bloco abaixo (leitura confortável) ─── */}
        <header className="w-full">
          <Eyebrow num="01" />
          {a.heading && (
            <h2
              id="duo-heading-a"
              className="w-full text-3xl md:text-4xl font-black text-slate-900 font-ideia leading-tight"
              dangerouslySetInnerHTML={{ __html: a.headingHtml ?? a.heading }}
            />
          )}
        </header>
        {colunaDireita.length > 0 && (
          <div className="w-full mt-6 md:mt-8 space-y-4">
            {colunaDireita.map((p, i) => (
              <p
                key={i}
                className="w-full text-slate-600 leading-relaxed text-base [&_strong]:text-slate-900 [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: p }}
              />
            ))}
            {(parasA.length > 0 || itemsA.length > 0) && b.heading ? (
              <p className="pt-1 text-base font-semibold text-ideia-primary font-ideia" dangerouslySetInnerHTML={{ __html: b.headingHtml ?? b.heading }} />
            ) : null}
          </div>
        )}

        {/* ── Linha 1: cards claros — 2 col (padrão); 3 itens = 1 linha com 3 col (evita célula vazia) ─── */}
        {itemsA.length > 0 && (
          <div
            className={`grid gap-4 mt-10 md:mt-12 mb-8 ${
              itemsA.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {itemsA.map((html, i) => (
              <div key={i} className="rounded-2xl p-6 flex flex-col gap-4 min-h-[150px] bg-blue-50 border border-blue-200/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ideia-primary/20 text-ideia-primary self-start">
                  <IcCheck />
                </span>
                <span className="text-sm leading-relaxed text-slate-800 [&_strong]:font-bold [&_strong]:text-slate-900" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Eyebrow separador — 02 + heading de B ─── */}
        {itemsB.length > 0 && (
          <div className="mb-6 mt-2 md:mt-4">
            <Eyebrow num="02" />
            {b.heading && (
              <h3
                className="w-full text-xl md:text-2xl font-black text-slate-900 font-ideia leading-tight"
                dangerouslySetInnerHTML={{ __html: b.headingHtml ?? b.heading }}
              />
            )}
            {parasB.slice(0, 1).map((p, i) => (
              <p
                key={i}
                className="mt-4 w-full text-base text-slate-600 leading-relaxed [&_strong]:text-slate-800 [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: p }}
              />
            ))}
          </div>
        )}

        {/* ── Linha 2: cards escuros (itens de B) — 3 colunas ─── */}
        {itemsB.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsB.map((html, i) => (
              <div key={i} className="rounded-2xl p-6 flex flex-col gap-4 min-h-[150px] bg-[#0c1929] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/70 self-start">
                  <IcCheck />
                </span>
                <span className="text-sm leading-relaxed text-white/85 [&_strong]:font-bold [&_strong]:text-white" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Roteador de layout  (seções a partir da 3ª usam idx relativo)
───────────────────────────────────────────────────────────────── */
const LAYOUTS = [LayoutSteps, LayoutSplit, LayoutBands, LayoutCallout, LayoutGrid] as const;

function ContentSection({
  section,
  idx,
  imageFig,
  splitImage,
}: {
  section: ParsedSection;
  /** Índice em `rest` (0 = 1.ª H2 após o duo). Rotação de layout; eyebrow = idx + 3 (03, 04, …). */
  idx: number;
  imageFig?: InlineFigure;
  splitImage?: InlineFigure;
}) {
  const num = String(idx + 3).padStart(2, "0");
  if (idx === 2) {
    return <LayoutTimeline s={section} num={num} />;
  }
  const Layout = LAYOUTS[idx % LAYOUTS.length];
  if (Layout === LayoutSteps) {
    return <LayoutSteps s={section} num={num} imageFig={imageFig} />;
  }
  if (Layout === LayoutSplit) {
    return <LayoutSplit s={section} num={num} imageFig={splitImage} />;
  }
  return <Layout s={section} num={num} />;
}

/* ─────────────────────────────────────────────────────────────────
   Stats Strip
───────────────────────────────────────────────────────────────── */
function StatsStrip() {
  const stats = [
    { value: "400+", label: "empresas ativas" },
    { value: "24h",  label: "tempo de setup" },
    { value: "Meta", label: "API oficial WhatsApp" },
  ] as const;
  return (
    <section className="py-14 bg-ideia-primary" aria-label="Números do Ideia Chat">
      <div className="max-w-container mx-auto px-4">
        <ul className="grid grid-cols-3 gap-6 text-center">
          {stats.map((s) => (
            <li key={s.label}>
              <p className="text-3xl md:text-5xl font-black text-white tabular-nums font-ideia leading-none">{s.value}</p>
              <p className="mt-2 text-xs md:text-sm text-white/70 uppercase tracking-wider">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FAQ Section
───────────────────────────────────────────────────────────────── */
function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  if (!faqs.length) return null;
  return (
    <section className="py-16 md:py-20 bg-slate-50" aria-labelledby="faq-heading">
      <div className="max-w-container mx-auto px-4 grid md:grid-cols-[1fr_2fr] gap-12 md:gap-16 items-start">
        <div className="md:sticky md:top-24">
          <span className="text-xs font-bold uppercase tracking-widest text-ideia-primary">Tire suas dúvidas</span>
          <h2 id="faq-heading" className="mt-3 text-3xl md:text-4xl font-black text-slate-900 leading-tight font-ideia">
            Perguntas<br />frequentes
          </h2>
          <div className="mt-4 h-1 w-12 rounded-full bg-ideia-primary" />
          <p className="mt-4 text-sm text-slate-500 leading-relaxed">
            Não encontrou o que procura? Fale diretamente com um especialista.
          </p>
        </div>
        <dl className="flex flex-col divide-y divide-slate-200">
          {faqs.map((faq, i) => (
            <details key={i} className="group py-5 first:pt-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-800 hover:text-ideia-primary transition-colors">
                <span className="leading-snug">{faq.pergunta}</span>
                <span className="shrink-0 w-7 h-7 rounded-full border border-slate-300 group-open:border-ideia-primary group-open:bg-ideia-primary text-slate-400 group-open:text-white flex items-center justify-center transition-all duration-200">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 group-open:rotate-45 transition-transform duration-200" aria-hidden>
                    <path d="M7 1v12M1 7h12" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-12">{faq.resposta}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────────────────────────── */
export async function PageContentSections({
  sections,
  faqs,
  inlineFigure,
  excludeImageSrcs,
  pageTitulo,
  focusKeyword,
  paginaId,
  variacaoId,
  whatsappNumber,
}: Props) {
  const visible = sections.filter((s) => s.heading !== null || s.blocks.length > 0);

  /** Hero + faixa + quaisquer URLs passadas pelo caller — não repetir nas secções. */
  const usedPexelsSrc = pexelsSeedUsedSet(
    [...(excludeImageSrcs ?? []), inlineFigure?.src].filter((u): u is string => Boolean(u)),
  );

  // Seções 0 e 1 → LayoutDuo; seções 2+ → layouts rotativos
  const duo = visible.length >= 2 ? [visible[0]!, visible[1]!] as const : null;
  const rest = visible.length >= 2 ? visible.slice(2) : visible;

  /** Cada secção Split (layout) tem a sua própria foto — antes reutilizava-se uma única imagem. */
  const splitImageByIdx = new Map<number, InlineFigure>();
  const splitIndices = rest.map((_, idx) => idx).filter((idx) => idx % LAYOUTS.length === 1);
  for (let s = 0; s < splitIndices.length; s++) {
    const idx = splitIndices[s]!;
    const fig = await resolveSplitColumnImage(
      rest[idx]!,
      pageTitulo,
      focusKeyword,
      usedPexelsSrc,
      s,
    );
    splitImageByIdx.set(idx, fig);
  }

  /** Cada LayoutSteps: foto por H2 + sabor, sem repetir hero/inline/outras secções. */
  const stepsBackdropByIdx = new Map<number, InlineFigure>();
  const stepsIndices = rest.map((_, idx) => idx).filter((idx) => idx % LAYOUTS.length === 0);
  for (let i = 0; i < stepsIndices.length; i++) {
    const idx = stepsIndices[i]!;
    const fig = await resolveStepsBackdropImage(rest[idx]!, pageTitulo, focusKeyword, i, usedPexelsSrc);
    stepsBackdropByIdx.set(idx, fig);
  }

  return (
    <>
      {/* Seções 0+1 combinadas */}
      {duo && <LayoutDuo a={duo[0]} b={duo[1]} />}

      {/* Seções 3+ — eyebrow 03, 04, 05… em ordem; idx preserva rotação de layout */}
      {rest.map((section, idx) => {
        const isSteps = idx % LAYOUTS.length === 0;
        const isSplit = idx % LAYOUTS.length === 1;
        return (
          <ContentSection
            key={idx}
            section={section}
            idx={idx}
            imageFig={isSteps ? stepsBackdropByIdx.get(idx) : undefined}
            splitImage={isSplit ? splitImageByIdx.get(idx) : undefined}
          />
        );
      })}

      {visible.length > 0 && (
        <>
          <StatsStrip />
          <FaqSection faqs={faqs} />
          <PricingAndDemoCta paginaId={paginaId} variacaoId={variacaoId} whatsappNumber={whatsappNumber} />
        </>
      )}
    </>
  );
}
