/** @jsxRuntime automatic */
/** @jsxImportSource @oai/artifact-tool/presentation-jsx */

import fs from "node:fs";
import path from "node:path";
import {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  fr,
  auto,
} from "@oai/artifact-tool";

const W = 1920;
const H = 1080;

const C = {
  paper: "#F7F2EA",
  paper2: "#EFE8DC",
  ink: "#132A2E",
  inkSoft: "#1F3A3F",
  muted: "#5D6A6D",
  soft: "#D9D0C2",
  rule: "#C9C0B1",
  teal: "#08756F",
  tealDark: "#064B4A",
  tealSoft: "#D4F8EE",
  green: "#2DA66F",
  amber: "#E7A62F",
  amberSoft: "#FAE3B3",
  coral: "#D8694E",
  blue: "#3168C9",
  white: "#FFFFFF",
  warn: "#B85B3F",
};

const font = "Aptos";
const display = "Aptos Display";

const TOTAL_BODY_SLIDES = 12;
const TOTAL_SLIDES = 16;

const outDir = path.resolve("output");
const scratchDir = path.resolve("scratch");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(scratchDir, { recursive: true });

// Load volume + trend data collected via Apify
const VOLUMES_PATH = path.resolve("..", "volumes-tendencias-mvp.json");
const VOLUMES = JSON.parse(fs.readFileSync(VOLUMES_PATH, "utf8"));
const VOL_BY_N = Object.fromEntries(VOLUMES.termos.map((t) => [t.n, t]));

function fmtVol(v) {
  if (v == null) return "n/d";
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",")}k/mês`;
  return `${v}/mês`;
}
function fmtCpc(c) {
  if (c == null) return "n/d";
  return `R$ ${c.toFixed(2).replace(".", ",")}`;
}

const presentation = Presentation.create({
  slideSize: { width: W, height: H },
});

async function saveBlob(blob, filePath) {
  const bytes = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(filePath, bytes);
}

function bg(fillColor = C.paper) {
  return shape({ name: "background", width: fill, height: fill, fill: fillColor });
}

function safeId(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
}

function smallLabel(value, color = C.teal) {
  const upper = value.toUpperCase();
  const labelWidth = Math.max(160, upper.length * 12 + 40);
  return text(upper, {
    name: `label-${safeId(value)}`,
    width: fixed(labelWidth),
    height: hug,
    style: {
      fontFamily: font,
      fontSize: 18,
      bold: true,
      color,
      letterSpacing: 1,
    },
  });
}

function titleBlock(label, title, subtitle, opts = {}) {
  return column(
    { name: `title-stack-${safeId(label)}`, width: fill, height: hug, gap: 22 },
    [
      smallLabel(label, opts.labelColor ?? C.teal),
      text(title, {
        name: `slide-title-${safeId(label)}`,
        width: fill,
        height: hug,
        style: {
          fontFamily: display,
          fontSize: opts.titleSize ?? 50,
          bold: true,
          color: opts.titleColor ?? C.ink,
          letterSpacing: 0,
          lineHeight: 1.2,
        },
      }),
      subtitle
        ? text(subtitle, {
            name: `slide-subtitle-${safeId(label)}`,
            width: fill,
            height: hug,
            style: {
              fontFamily: font,
              fontSize: opts.subtitleSize ?? 24,
              color: opts.subtitleColor ?? C.muted,
              letterSpacing: 0,
              lineHeight: 1.4,
            },
          })
        : text("", {
            name: `slide-subtitle-empty-${safeId(label)}`,
            width: fixed(1),
            height: fixed(1),
            style: { fontSize: 1, color: opts.titleColor ?? C.ink },
          }),
    ],
  );
}

function footer(slideNumber, kind = "body") {
  const total = kind === "appendix" ? TOTAL_SLIDES : TOTAL_BODY_SLIDES;
  const tag = kind === "appendix" ? "Anexo" : "";
  const left = "Estratégia + Sistema do MVP · IDeiaPages × Ideia Chat · Junior · Estratégia";
  const right = tag
    ? `${tag} · ${slideNumber - TOTAL_BODY_SLIDES} / 4`
    : `${String(slideNumber).padStart(2, "0")} / ${total}`;
  return row(
    { name: `footer-${slideNumber}`, width: fill, height: hug, gap: 0, justify: "between" },
    [
      text(left, {
        name: `footer-left-${slideNumber}`,
        width: fill,
        height: hug,
        style: { fontFamily: font, fontSize: 13, color: "#7D8586", lineHeight: 1 },
      }),
      text(right, {
        name: `footer-right-${slideNumber}`,
        width: fixed(120),
        height: hug,
        style: { fontFamily: font, fontSize: 13, bold: true, color: C.tealDark, textAlign: "right", lineHeight: 1 },
      }),
    ],
  );
}

function slideRoot(slide, children, fillColor = C.paper) {
  slide.compose(
    layers(
      { name: "slide-layers", width: fill, height: fill },
      [
        bg(fillColor),
        column(
          {
            name: "slide-root",
            width: fill,
            height: fill,
            padding: { x: 86, y: 60 },
            gap: 28,
          },
          children,
        ),
      ],
    ),
    { frame: { left: 0, top: 0, width: W, height: H }, baseUnit: 8 },
  );
}

function chip(value, fillColor = C.white, color = C.ink) {
  const chipWidth = Math.max(140, Math.min(560, value.length * 12 + 54));
  return panel(
    {
      name: `chip-${safeId(value)}`,
      fill: fillColor,
      borderRadius: 18,
      padding: { x: 22, y: 11 },
      height: hug,
      width: fixed(chipWidth),
    },
    text(value, {
      name: `chip-text-${safeId(value)}`,
      width: fill,
      height: hug,
      style: { fontFamily: font, fontSize: 18, bold: true, color },
    }),
  );
}

function bullets(items, color = C.ink, size = 24) {
  return column(
    { name: `bullet-list-${safeId(items[0] ?? "list")}`, width: fill, height: hug, gap: 11 },
    items.map((item, i) =>
      row(
        { name: `bullet-row-${safeId(item)}-${i}`, width: fill, height: hug, gap: 14, align: "start" },
        [
          shape({
            name: `bullet-dot-${safeId(item)}-${i}`,
            width: fixed(9),
            height: fixed(9),
            fill: C.teal,
            borderRadius: 12,
          }),
          text(item, {
            name: `bullet-text-${safeId(item)}-${i}`,
            width: fill,
            height: hug,
            style: { fontFamily: font, fontSize: size, color, lineHeight: 1.35 },
          }),
        ],
      ),
    ),
  );
}

function tableRow(cells, widths, opts = {}) {
  const rowName = opts.name ?? safeId(cells[0]);
  return grid(
    {
      name: `table-row-${rowName}`,
      width: fill,
      height: hug,
      columns: widths,
      columnGap: 22,
      padding: { x: 0, y: opts.y ?? 12 },
    },
    cells.map((cell, i) =>
      text(cell, {
        name: `cell-${rowName}-${i}`,
        width: fill,
        height: hug,
        style: {
          fontFamily: font,
          fontSize: opts.header ? 18 : 20,
          bold: opts.header || (opts.boldFirst !== false && i === 0),
          color: opts.header ? C.tealDark : (opts.colors?.[i] ?? C.ink),
          lineHeight: 1.3,
        },
      }),
    ),
  );
}

function scoreBar(score, max = 30, color = C.teal) {
  const ratio = Math.max(0, Math.min(1, score / max));
  const barWidth = 240;
  return row(
    { name: `score-bar-${score}-${color}`, width: hug, height: hug, gap: 14, align: "center" },
    [
      panel(
        {
          name: `score-track-${score}`,
          width: fixed(barWidth),
          height: fixed(10),
          fill: C.soft,
          borderRadius: 6,
        },
        shape({
          name: `score-fill-${score}`,
          width: fixed(Math.round(barWidth * ratio)),
          height: fill,
          fill: color,
          borderRadius: 6,
        }),
      ),
      text(`${score}/${max}`, {
        name: `score-num-${score}`,
        width: fixed(85),
        height: hug,
        style: { fontFamily: display, fontSize: 22, bold: true, color: C.ink, lineHeight: 1 },
      }),
    ],
  );
}

function methodCard(num, headline, detail, color = C.teal) {
  return panel(
    {
      name: `method-${num}`,
      fill: C.white,
      borderRadius: 14,
      padding: { x: 28, y: 24 },
      width: fill,
      height: fill,
    },
    column(
      { name: `method-stack-${num}`, width: fill, height: fill, gap: 12 },
      [
        text(num, {
          name: `method-num-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: display, fontSize: 18, bold: true, color, letterSpacing: 1 },
        }),
        text(headline, {
          name: `method-headline-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: display, fontSize: 26, bold: true, color: C.ink, lineHeight: 1.15 },
        }),
        text(detail, {
          name: `method-detail-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: font, fontSize: 16, color: C.muted, lineHeight: 1.4 },
        }),
      ],
    ),
  );
}

function capabilityCard(num, title, description, color) {
  return panel(
    {
      name: `cap-${num}`,
      fill: C.white,
      borderRadius: 14,
      padding: { x: 26, y: 22 },
      width: fill,
      height: fill,
    },
    column(
      { name: `cap-stack-${num}`, width: fill, height: fill, gap: 10 },
      [
        row(
          { name: `cap-head-${num}`, width: fill, height: hug, gap: 12, align: "center" },
          [
            panel(
              {
                name: `cap-num-bg-${num}`,
                fill: color,
                borderRadius: 8,
                padding: { x: 10, y: 4 },
                width: fixed(50),
                height: hug,
              },
              text(num, {
                name: `cap-num-${num}`,
                width: fill,
                height: hug,
                style: { fontFamily: display, fontSize: 17, bold: true, color: C.white, textAlign: "center", lineHeight: 1.2 },
              }),
            ),
            text(title, {
              name: `cap-title-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: display, fontSize: 22, bold: true, color: C.ink, lineHeight: 1.2 },
            }),
          ],
        ),
        text(description, {
          name: `cap-desc-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: font, fontSize: 16, color: C.muted, lineHeight: 1.4 },
        }),
      ],
    ),
  );
}

function pipelineStep(num, title, description, color) {
  return panel(
    {
      name: `pipe-${num}`,
      fill: C.white,
      borderRadius: 14,
      padding: { x: 26, y: 18 },
      width: fill,
      height: hug,
    },
    grid(
      {
        name: `pipe-grid-${num}`,
        width: fill,
        height: hug,
        columns: [fixed(56), fr(1)],
        columnGap: 18,
        padding: { x: 0, y: 0 },
      },
      [
        panel(
          {
            name: `pipe-num-bg-${num}`,
            fill: color,
            borderRadius: 8,
            padding: { x: 8, y: 6 },
            width: fixed(56),
            height: hug,
          },
          text(num, {
            name: `pipe-num-${num}`,
            width: fill,
            height: hug,
            style: { fontFamily: display, fontSize: 20, bold: true, color: C.white, textAlign: "center", lineHeight: 1.2 },
          }),
        ),
        column(
          { name: `pipe-content-${num}`, width: fill, height: hug, gap: 4 },
          [
            text(title, {
              name: `pipe-title-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: display, fontSize: 22, bold: true, color: C.ink, lineHeight: 1.2 },
            }),
            text(description, {
              name: `pipe-desc-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: font, fontSize: 16, color: C.muted, lineHeight: 1.4 },
            }),
          ],
        ),
      ],
    ),
  );
}

function pillarCard(num, title, body, accent = C.teal) {
  return panel(
    {
      name: `pillar-${num}`,
      fill: C.white,
      borderRadius: 14,
      padding: { x: 30, y: 30 },
      width: fill,
      height: fill,
    },
    column(
      { name: `pillar-stack-${num}`, width: fill, height: fill, gap: 16 },
      [
        text(num, {
          name: `pillar-num-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: display, fontSize: 48, bold: true, color: accent },
        }),
        rule({ name: `pillar-rule-${num}`, width: fixed(60), stroke: accent, weight: 4 }),
        text(title, {
          name: `pillar-title-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: display, fontSize: 28, bold: true, color: C.ink, lineHeight: 1.15 },
        }),
        text(body, {
          name: `pillar-body-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: font, fontSize: 19, color: C.muted, lineHeight: 1.4 },
        }),
      ],
    ),
  );
}

function nextStepRow(num, title, description, owner, accent) {
  return panel(
    {
      name: `next-${num}`,
      fill: C.white,
      borderRadius: 14,
      padding: { x: 28, y: 20 },
      width: fill,
      height: hug,
    },
    grid(
      {
        name: `next-grid-${num}`,
        width: fill,
        height: hug,
        columns: [fixed(56), fr(1), fixed(280)],
        columnGap: 22,
        padding: { x: 0, y: 0 },
      },
      [
        text(num, {
          name: `next-num-${num}`,
          width: fill,
          height: hug,
          style: { fontFamily: display, fontSize: 36, bold: true, color: accent, lineHeight: 1.2 },
        }),
        column(
          { name: `next-text-${num}`, width: fill, height: hug, gap: 4 },
          [
            text(title, {
              name: `next-title-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: display, fontSize: 22, bold: true, color: C.ink, lineHeight: 1.2 },
            }),
            text(description, {
              name: `next-desc-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: font, fontSize: 16, color: C.muted, lineHeight: 1.4 },
            }),
          ],
        ),
        column(
          { name: `next-owner-${num}`, width: fill, height: hug, gap: 2, align: "end" },
          [
            text("RESPONSÁVEL", {
              name: `next-owner-label-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: font, fontSize: 11, bold: true, color: C.muted, letterSpacing: 1, textAlign: "right" },
            }),
            text(owner, {
              name: `next-owner-val-${num}`,
              width: fill,
              height: hug,
              style: { fontFamily: font, fontSize: 16, bold: true, color: accent, textAlign: "right", lineHeight: 1.3 },
            }),
          ],
        ),
      ],
    ),
  );
}

// =============== SLIDE 1 — CAPA ===============
function addCover() {
  const slide = presentation.slides.add();
  slide.compose(
    layers(
      { name: "cover-layers", width: fill, height: fill },
      [
        bg(C.ink),
        panel(
          {
            name: "cover-band",
            fill: C.tealDark,
            borderRadius: 0,
            width: fixed(560),
            height: fill,
          },
          shape({ name: "cover-band-fill", width: fill, height: fill, fill: "transparent" }),
        ),
        column(
          {
            name: "cover-root",
            width: fill,
            height: fill,
            padding: { x: 96, y: 80 },
            gap: 0,
            justify: "between",
          },
          [
            row(
              { name: "cover-top", width: fill, height: hug, gap: 0, justify: "between" },
              [
                column(
                  { name: "cover-brand", width: fixed(420), height: hug, gap: 8 },
                  [
                    text("IDEIAPAGES × IDEIA CHAT", {
                      name: "cover-brand-name",
                      width: fill,
                      height: hug,
                      style: { fontFamily: font, fontSize: 18, bold: true, color: C.amber, letterSpacing: 2, lineHeight: 1 },
                    }),
                    text("ESTRATÉGIA + SISTEMA · MVP", {
                      name: "cover-brand-tag",
                      width: fill,
                      height: hug,
                      style: { fontFamily: font, fontSize: 14, color: "#9CB0AE", letterSpacing: 2, lineHeight: 1 },
                    }),
                  ],
                ),
                column(
                  { name: "cover-author", width: fixed(420), height: hug, gap: 6, align: "end" },
                  [
                    text("Junior", {
                      name: "cover-author-name",
                      width: fill,
                      height: hug,
                      style: { fontFamily: display, fontSize: 22, bold: true, color: C.white, textAlign: "right", lineHeight: 1 },
                    }),
                    text("Estratégia · Rede Ideia", {
                      name: "cover-author-role",
                      width: fill,
                      height: hug,
                      style: { fontFamily: font, fontSize: 14, color: "#9CB0AE", textAlign: "right", lineHeight: 1 },
                    }),
                  ],
                ),
              ],
            ),
            column(
              { name: "cover-headline", width: fill, height: hug, gap: 22 },
              [
                text("Estratégia + Sistema do MVP", {
                  name: "cover-title",
                  width: wrap(1500),
                  height: hug,
                  style: { fontFamily: display, fontSize: 102, bold: true, color: C.white, lineHeight: 1.0 },
                }),
                text("Decisões de pesquisa, sistema construído e plano de execução do IDeiaPages", {
                  name: "cover-subtitle",
                  width: wrap(1400),
                  height: hug,
                  style: { fontFamily: font, fontSize: 30, color: "#CDE9E5", lineHeight: 1.3 },
                }),
              ],
            ),
            row(
              { name: "cover-thesis-row", width: fill, height: hug, gap: 0, align: "end", justify: "between" },
              [
                panel(
                  {
                    name: "cover-thesis",
                    fill: C.teal,
                    borderRadius: 0,
                    padding: { x: 36, y: 28 },
                    width: fixed(1280),
                  },
                  column(
                    { name: "cover-thesis-stack", width: fill, height: hug, gap: 10 },
                    [
                      text("TESE", {
                        name: "cover-thesis-label",
                        width: hug,
                        height: hug,
                        style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealSoft, letterSpacing: 2 },
                      }),
                      text(
                        "10 LPs em bloco. Sistema gera com 3 IAs e mede vencedor. Search Console guia a próxima rodada.",
                        {
                          name: "cover-thesis-text",
                          width: fill,
                          height: hug,
                          style: { fontFamily: display, fontSize: 28, bold: true, color: C.white, lineHeight: 1.25 },
                        },
                      ),
                    ],
                  ),
                ),
                row(
                  { name: "cover-version", width: hug, height: hug, gap: 8, align: "center" },
                  [
                    shape({ name: "cover-dot", width: fixed(8), height: fixed(8), fill: C.amber, borderRadius: 8 }),
                    text("v3", {
                      name: "cover-version-text",
                      width: hug,
                      height: hug,
                      style: { fontFamily: font, fontSize: 16, bold: true, color: C.amber, letterSpacing: 2 },
                    }),
                  ],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
    { frame: { left: 0, top: 0, width: W, height: H }, baseUnit: 8 },
  );
}

// =============== SLIDE 2 — TESE ===============
function addThesis() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    smallLabel("Tese"),
    column(
      { name: "thesis-content", width: fill, height: fill, gap: 32, justify: "center" },
      [
        text(
          "Construímos o sistema. Refinamos o foco. Agora ligamos os dois — 10 LPs em bloco como entrega do MVP, com contabilidade como cluster principal e imobiliárias como secundário.",
          {
            name: "thesis-text",
            width: wrap(1700),
            height: hug,
            style: { fontFamily: display, fontSize: 60, bold: true, color: C.ink, lineHeight: 1.15 },
          },
        ),
        rule({ name: "thesis-rule", width: fixed(280), stroke: C.amber, weight: 6 }),
        text(
          "O sistema gera, testa e mede com três IAs em paralelo. O Search Console arbitra a próxima rodada de nichos.",
          {
            name: "thesis-sub",
            width: wrap(1600),
            height: hug,
            style: { fontFamily: font, fontSize: 28, color: C.muted, lineHeight: 1.35 },
          },
        ),
      ],
    ),
    footer(2),
  ]);
}

// =============== SLIDE 3 — SISTEMA CONSTRUÍDO ===============
function addSystem() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Sistema",
      "IDeiaPages — plataforma de SEO programático já em operação interna.",
      "Seis capacidades integradas. Não é um site com CMS, é um motor de páginas que aprende.",
    ),
    grid(
      {
        name: "system-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1), fr(1)],
        rows: [fr(1), fr(1)],
        columnGap: 20,
        rowGap: 20,
      },
      [
        capabilityCard("01", "Pesquisa automatizada", "Descobre termos, classifica intent, coleta SERP e analisa concorrentes via IA.", C.teal),
        capabilityCard("02", "Briefing técnico por termo", "Produz a base SEO da página: estrutura, dor, ângulo de information gain.", C.teal),
        capabilityCard("03", "Geração com 3 IAs", "Claude, GPT e Gemini produzem versões diferentes da mesma página em paralelo.", C.amber),
        capabilityCard("04", "Filtro de qualidade", "Barra fato inventado, conteúdo raso e quebra de regras de produto antes da publicação.", C.amber),
        capabilityCard("05", "Teste A/B nativo", "Distribui visitantes entre as 3 versões e declara vencedor por significância estatística.", C.blue),
        capabilityCard("06", "Dashboard interno", "Performance, custo por lead, candidatos a refresh e próximas páginas a criar.", C.coral),
      ],
    ),
    panel(
      {
        name: "system-cred",
        fill: C.tealDark,
        borderRadius: 12,
        padding: { x: 28, y: 18 },
        width: fill,
        height: hug,
      },
      grid(
        {
          name: "system-cred-grid",
          width: fill,
          height: hug,
          columns: [fr(1), fr(1), fr(1.4)],
          columnGap: 28,
          padding: { x: 0, y: 0 },
        },
        [
          column(
            { name: "cred-1", width: fill, height: hug, gap: 2 },
            [
              text("ROADMAP", { name: "cred-1-l", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealSoft, letterSpacing: 2 } }),
              text("67% entregue · 32 de 48 tarefas", { name: "cred-1-v", width: fill, height: hug, style: { fontFamily: display, fontSize: 19, bold: true, color: C.white, lineHeight: 1.2 } }),
            ],
          ),
          column(
            { name: "cred-2", width: fill, height: hug, gap: 2 },
            [
              text("STATUS", { name: "cred-2-l", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealSoft, letterSpacing: 2 } }),
              text("Pesquisa + geração + A/B + dashboard rodando", { name: "cred-2-v", width: fill, height: hug, style: { fontFamily: display, fontSize: 19, bold: true, color: C.white, lineHeight: 1.2 } }),
            ],
          ),
          column(
            { name: "cred-3", width: fill, height: hug, gap: 2 },
            [
              text("STACK", { name: "cred-3-l", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealSoft, letterSpacing: 2 } }),
              text("Next.js · Supabase · Vercel · Apify · Firecrawl · Claude/GPT/Gemini", { name: "cred-3-v", width: fill, height: hug, style: { fontFamily: display, fontSize: 17, bold: true, color: C.white, lineHeight: 1.2 } }),
            ],
          ),
        ],
      ),
    ),
    footer(3),
  ]);
}

// =============== SLIDE 4 — MÉTODO (PESQUISA) ===============
function addMethod() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Método · Input do sistema",
      "Decidimos a partir de 6 etapas estruturadas — não de feeling.",
      "Cada decisão neste deck tem evidência rastreável nos materiais de pesquisa.",
    ),
    grid(
      {
        name: "method-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1), fr(1)],
        rows: [fr(1), fr(1)],
        columnGap: 22,
        rowGap: 22,
      },
      [
        methodCard("01", "15 nichos avaliados", "Matriz inicial cruzando fit com produto, intenção provável e prioridade A/B/C.", C.teal),
        methodCard("02", "158 termos mapeados", "Por intenção: horizontal, nicho, dor e comparativo.", C.teal),
        methodCard("03", "275 resultados SERP", "Coleta normalizada via Firecrawl em 3 lotes (principal + correção contábil + nichos prioridade A).", C.teal),
        methodCard("04", "17 domínios consolidados", "Concorrentes recorrentes em 2 mercados: horizontal e contabilidade.", C.amber),
        methodCard("05", "12 termos pontuados", "Score em 6 critérios, escala 1-30: demanda, intenção, fit produto, fit comercial, oportunidade, especificidade.", C.amber),
        methodCard("06", "4 nichos prioridade A comparados", "Sinal × ruído de SERP em contabilidade, imobiliárias, clínicas e odontologia.", C.coral),
      ],
    ),
    text(
      "Volume de buscas e tendência incorporados nos slides 6 e 7 via Apify (autocomplete PT-BR). Keyword Planner conectando como fonte oficial da próxima rodada.",
      {
        name: "method-note",
        width: wrap(1700),
        height: hug,
        style: { fontFamily: font, fontSize: 16, color: C.muted, italic: true, lineHeight: 1.4 },
      },
    ),
    footer(4),
  ]);
}

// =============== SLIDE 5 — DECISÃO DE FOCO ===============
function addFocusDecision() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Decisão",
      "Três frentes com papéis distintos — não é portfólio horizontal.",
      "Cada cluster tem score, evidência de SERP e tipo de risco diferente.",
    ),
    grid(
      {
        name: "focus-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1), fr(1)],
        columnGap: 28,
      },
      [
        panel(
          { name: "focus-1", fill: C.white, borderRadius: 14, padding: { x: 32, y: 32 }, width: fill, height: fill },
          column(
            { name: "focus-1-stack", width: fill, height: fill, gap: 18 },
            [
              chip("CLUSTER PRINCIPAL", C.teal, C.white),
              text("01", {
                name: "focus-1-num",
                width: fill,
                height: hug,
                style: { fontFamily: display, fontSize: 64, bold: true, color: C.teal, lineHeight: 1 },
              }),
              text("Contabilidade", {
                name: "focus-1-title",
                width: fill,
                height: hug,
                style: { fontFamily: display, fontSize: 38, bold: true, color: C.ink },
              }),
              column(
                { name: "focus-1-evidence", width: fill, height: hug, gap: 12 },
                [
                  text("Top score 28/30", {
                    name: "focus-1-e1",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, bold: true, color: C.ink },
                  }),
                  text("96% sinal SERP em 25 resultados", {
                    name: "focus-1-e2",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted },
                  }),
                  text("5 concorrentes nichados ativos", {
                    name: "focus-1-e3",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted },
                  }),
                  text("Maior base atual de clientes", {
                    name: "focus-1-e4",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted },
                  }),
                ],
              ),
            ],
          ),
        ),
        panel(
          { name: "focus-2", fill: C.white, borderRadius: 14, padding: { x: 32, y: 32 }, width: fill, height: fill },
          column(
            { name: "focus-2-stack", width: fill, height: fill, gap: 18 },
            [
              chip("CLUSTER VALIDADO", C.amber, C.ink),
              text("02", {
                name: "focus-2-num",
                width: fill, height: hug,
                style: { fontFamily: display, fontSize: 64, bold: true, color: C.amber, lineHeight: 1 },
              }),
              text("Imobiliárias", {
                name: "focus-2-title",
                width: fill, height: hug,
                style: { fontFamily: display, fontSize: 38, bold: true, color: C.ink },
              }),
              column(
                { name: "focus-2-evidence", width: fill, height: hug, gap: 12 },
                [
                  text("100% sinal SERP em 50 resultados", {
                    name: "focus-2-e1",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, bold: true, color: C.ink },
                  }),
                  text("Aderência a atendimento, leads e automação", {
                    name: "focus-2-e2",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted },
                  }),
                  text("Concorrentes na SERP: ChatImob, Universal Software, Zimobi, Jetimob", {
                    name: "focus-2-e3",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted, lineHeight: 1.35 },
                  }),
                ],
              ),
            ],
          ),
        ),
        panel(
          { name: "focus-3", fill: C.white, borderRadius: 14, padding: { x: 32, y: 32 }, width: fill, height: fill },
          column(
            { name: "focus-3-stack", width: fill, height: fill, gap: 18 },
            [
              chip("SUSTENTAÇÃO", C.blue, C.white),
              text("03", {
                name: "focus-3-num",
                width: fill, height: hug,
                style: { fontFamily: display, fontSize: 64, bold: true, color: C.blue, lineHeight: 1 },
              }),
              text("Horizontais", {
                name: "focus-3-title",
                width: fill, height: hug,
                style: { fontFamily: display, fontSize: 38, bold: true, color: C.ink },
              }),
              column(
                { name: "focus-3-evidence", width: fill, height: hug, gap: 12 },
                [
                  row(
                    { name: "focus-3-warn-row", width: fill, height: hug, gap: 8, align: "center" },
                    [
                      shape({ name: "focus-3-warn-dot", width: fixed(10), height: fixed(10), fill: C.warn, borderRadius: 8 }),
                      text("Concorrência forte", {
                        name: "focus-3-e1",
                        width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 19, bold: true, color: C.warn },
                      }),
                    ],
                  ),
                  text("UnderChat, Letalk, ChatPro, Total Chat dominam a SERP", {
                    name: "focus-3-e2",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted, lineHeight: 1.35 },
                  }),
                  text("Função: capturar dor antes do nicho + autoridade", {
                    name: "focus-3-e3",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, color: C.muted, lineHeight: 1.35 },
                  }),
                  text("Não dependemos deles para vitória rápida", {
                    name: "focus-3-e4",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 19, italic: true, color: C.ink },
                  }),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
    footer(5),
  ]);
}

// =============== SLIDE 6 — CONTABILIDADE (com volumes) ===============
function addAccountingEvidence() {
  const slide = presentation.slides.add();
  // Build volume rows from JSON for terms 1-4
  const terms = [VOL_BY_N[1], VOL_BY_N[2], VOL_BY_N[3], VOL_BY_N[4]];
  slideRoot(slide, [
    titleBlock(
      "Evidência · Cluster #1",
      "Contabilidade abre o MVP por três motivos validados.",
      "Score formal + volume de busca + concorrentes nichados ativos.",
    ),
    grid(
      {
        name: "acct-grid",
        width: fill,
        height: fill,
        columns: [fr(1.4), fr(1)],
        columnGap: 36,
      },
      [
        // Esquerda: tabela score + volume
        column(
          { name: "acct-left", width: fill, height: hug, gap: 14 },
          [
            text("Score · Volume · CPC · Tendência", {
              name: "acct-table-label",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
            }),
            column(
              { name: "acct-table", width: fill, height: hug, gap: 4 },
              [
                grid(
                  {
                    name: "acct-head",
                    width: fill, height: hug,
                    columns: [fr(2), fixed(110), fixed(160), fixed(110), fixed(90)],
                    columnGap: 12,
                    padding: { x: 0, y: 6 },
                  },
                  [
                    text("TERMO", { name: "acct-h-0", width: fill, height: hug, style: { fontFamily: font, fontSize: 12, bold: true, color: C.tealDark, letterSpacing: 1 } }),
                    text("SCORE", { name: "acct-h-1", width: fill, height: hug, style: { fontFamily: font, fontSize: 12, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
                    text("VOLUME/MÊS", { name: "acct-h-2", width: fill, height: hug, style: { fontFamily: font, fontSize: 12, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
                    text("CPC", { name: "acct-h-3", width: fill, height: hug, style: { fontFamily: font, fontSize: 12, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
                    text("TENDÊNCIA", { name: "acct-h-4", width: fill, height: hug, style: { fontFamily: font, fontSize: 12, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
                  ],
                ),
                rule({ name: "acct-rule-h", width: fill, stroke: C.rule, weight: 2 }),
                ...[
                  [terms[0], 28],
                  [terms[1], 27],
                  [terms[2], 26],
                  [terms[3], 26],
                ].map(([t, sc], i) =>
                  grid(
                    {
                      name: `acct-row-${i}`,
                      width: fill, height: hug,
                      columns: [fr(2), fixed(110), fixed(160), fixed(110), fixed(90)],
                      columnGap: 12,
                      padding: { x: 0, y: 12 },
                    },
                    [
                      text(t.termo, {
                        name: `acct-t-${i}`, width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 16, color: C.ink, lineHeight: 1.3 },
                      }),
                      text(`${sc}/30`, {
                        name: `acct-s-${i}`, width: fill, height: hug,
                        style: { fontFamily: display, fontSize: 17, bold: true, color: C.teal, textAlign: "right", lineHeight: 1.3 },
                      }),
                      text(t.fonte_volume === "match exato" ? fmtVol(t.volume_estimado) : `~${fmtVol(t.volume_estimado)}`, {
                        name: `acct-v-${i}`, width: fill, height: hug,
                        style: { fontFamily: display, fontSize: 17, bold: true, color: C.ink, textAlign: "right", lineHeight: 1.3 },
                      }),
                      text(fmtCpc(t.cpc), {
                        name: `acct-c-${i}`, width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 16, color: C.muted, textAlign: "right", lineHeight: 1.3 },
                      }),
                      text(t.trend, {
                        name: `acct-tr-${i}`, width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 16, bold: true, color: t.trend === "Rising" ? C.green : C.muted, textAlign: "right", lineHeight: 1.3 },
                      }),
                    ],
                  ),
                ),
                rule({ name: "acct-rule-bot", width: fill, stroke: C.rule, weight: 2 }),
              ],
            ),
            text("~ = volume vem de variante PT-BR mais próxima (autocomplete Apify). Match exato em #4. Keyword Planner como próxima fonte oficial.", {
              name: "acct-note",
              width: wrap(1100), height: hug,
              style: { fontFamily: font, fontSize: 13, italic: true, color: C.muted, lineHeight: 1.4 },
            }),
          ],
        ),
        // Direita: concorrentes
        column(
          { name: "acct-right", width: fill, height: hug, gap: 16 },
          [
            text("Concorrentes nichados na SERP", {
              name: "acct-comp-label",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
            }),
            panel(
              { name: "acct-comp-panel", fill: C.white, borderRadius: 14, padding: { x: 26, y: 22 }, width: fill, height: hug },
              bullets(
                ["Zap Contábil", "Whats Contábil", "Zappy Contábil", "Integgri", "Nibo (conteúdo)"],
                C.ink,
                19,
              ),
            ),
            panel(
              { name: "acct-victor", fill: C.amberSoft, borderRadius: 12, padding: { x: 22, y: 16 }, width: fill, height: hug },
              column(
                { name: "acct-victor-stack", width: fill, height: hug, gap: 4 },
                [
                  text("CITADO POR VICTOR", {
                    name: "acct-victor-label",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 11, bold: true, color: C.warn, letterSpacing: 1 },
                  }),
                  text("DigiSac · formulário comercial segmentado para contabilidade", {
                    name: "acct-victor-text",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ),
          ],
        ),
      ],
    ),
    text(
      "SERP nichada confirma demanda. CPC R$ 0,69-2,01 em volumes 100-700/mês confirma intenção comercial. Base atual confirma fit. Três sinais alinhados — não é só preferência.",
      {
        name: "acct-claim",
        width: wrap(1700), height: hug,
        style: { fontFamily: display, fontSize: 22, bold: true, color: C.tealDark, lineHeight: 1.35 },
      },
    ),
    footer(6),
  ]);
}

// =============== SLIDE 7 — IMOBILIÁRIAS + COMPARATIVO ===============
function addImoEvidence() {
  const slide = presentation.slides.add();
  const t5 = VOL_BY_N[5];
  const t6 = VOL_BY_N[6];
  slideRoot(slide, [
    titleBlock(
      "Evidência · Cluster #2",
      "Imobiliárias entra agora; clínicas e odontologia ficam para depois.",
      "Coletamos SERP de 30 termos × 4 nichos prioridade A para evitar conclusão forçada.",
    ),
    grid(
      {
        name: "imo-grid",
        width: fill,
        height: fill,
        columns: [fr(1.3), fr(1)],
        columnGap: 36,
      },
      [
        // Esquerda: comparativo SERP
        column(
          { name: "imo-left", width: fill, height: hug, gap: 14 },
          [
            text("Comparativo SERP · 4 nichos prioridade A", {
              name: "imo-cmp-label",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
            }),
            column(
              { name: "imo-cmp-table", width: fill, height: hug, gap: 4 },
              [
                tableRow(
                  ["Nicho", "Termos", "Resultados", "Sinal", "Ruído", "Decisão"],
                  [fr(0.85), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.4)],
                  { header: true, name: "imo-cmp-h" },
                ),
                rule({ name: "imo-cmp-rule-0", width: fill, stroke: C.rule, weight: 2 }),
                tableRow(
                  ["Contabilidade", "5", "25", "96%", "4%", "Cluster #1"],
                  [fr(0.85), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.4)],
                  { name: "imo-cmp-r1", y: 14, colors: [C.ink, C.ink, C.ink, C.green, C.muted, C.tealDark] },
                ),
                tableRow(
                  ["Imobiliárias", "10", "50", "100%", "40%", "Cluster #2 — entra agora"],
                  [fr(0.85), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.4)],
                  { name: "imo-cmp-r2", y: 14, colors: [C.ink, C.ink, C.ink, C.green, C.muted, C.amber] },
                ),
                tableRow(
                  ["Clínicas", "10", "50", "94%", "42%", "Adiar — agenda + software médico"],
                  [fr(0.85), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.4)],
                  { name: "imo-cmp-r3", y: 14, colors: [C.ink, C.ink, C.ink, C.muted, C.warn, C.muted] },
                ),
                tableRow(
                  ["Odontologia", "10", "50", "86%", "50%", "Adiar — software odonto + IA"],
                  [fr(0.85), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.4)],
                  { name: "imo-cmp-r4", y: 14, colors: [C.ink, C.ink, C.ink, C.muted, C.warn, C.muted] },
                ),
                rule({ name: "imo-cmp-rule-1", width: fill, stroke: C.rule, weight: 2 }),
              ],
            ),
          ],
        ),
        // Direita: volume + ecossistema
        column(
          { name: "imo-right", width: fill, height: hug, gap: 14 },
          [
            text("Volume · Termos imobiliários (Apify PT-BR)", {
              name: "imo-vol-label",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
            }),
            panel(
              { name: "imo-vol-panel", fill: C.white, borderRadius: 14, padding: { x: 24, y: 18 }, width: fill, height: hug },
              column(
                { name: "imo-vol-stack", width: fill, height: hug, gap: 14 },
                [
                  // termo 5
                  column(
                    { name: "imo-vol-5", width: fill, height: hug, gap: 6 },
                    [
                      text(t5.termo, {
                        name: "imo-vol-5-t", width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.3 },
                      }),
                      grid(
                        {
                          name: "imo-vol-5-r", width: fill, height: hug,
                          columns: [fixed(140), fixed(140), fr(1)],
                          columnGap: 12,
                          padding: { x: 0, y: 0 },
                        },
                        [
                          text(`~${fmtVol(t5.volume_estimado)}`, {
                            name: "imo-vol-5-v", width: fill, height: hug,
                            style: { fontFamily: display, fontSize: 22, bold: true, color: C.amber, lineHeight: 1.2 },
                          }),
                          text(`CPC ${fmtCpc(t5.cpc)}`, {
                            name: "imo-vol-5-c", width: fill, height: hug,
                            style: { fontFamily: font, fontSize: 14, color: C.muted, lineHeight: 1.6 },
                          }),
                          text(t5.trend, {
                            name: "imo-vol-5-tr", width: fill, height: hug,
                            style: { fontFamily: font, fontSize: 14, bold: true, color: t5.trend === "Rising" ? C.green : C.muted, lineHeight: 1.6, textAlign: "right" },
                          }),
                        ],
                      ),
                    ],
                  ),
                  rule({ name: "imo-vol-sep", width: fill, stroke: C.rule, weight: 1 }),
                  // termo 6
                  column(
                    { name: "imo-vol-6", width: fill, height: hug, gap: 6 },
                    [
                      text(t6.termo, {
                        name: "imo-vol-6-t", width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.3 },
                      }),
                      grid(
                        {
                          name: "imo-vol-6-r", width: fill, height: hug,
                          columns: [fixed(140), fixed(140), fr(1)],
                          columnGap: 12,
                          padding: { x: 0, y: 0 },
                        },
                        [
                          text(`~${fmtVol(t6.volume_estimado)}`, {
                            name: "imo-vol-6-v", width: fill, height: hug,
                            style: { fontFamily: display, fontSize: 22, bold: true, color: C.amber, lineHeight: 1.2 },
                          }),
                          text(`CPC ${fmtCpc(t6.cpc)}`, {
                            name: "imo-vol-6-c", width: fill, height: hug,
                            style: { fontFamily: font, fontSize: 14, color: C.muted, lineHeight: 1.6 },
                          }),
                          text(t6.trend, {
                            name: "imo-vol-6-tr", width: fill, height: hug,
                            style: { fontFamily: font, fontSize: 14, bold: true, color: t6.trend === "Rising" ? C.green : C.muted, lineHeight: 1.6, textAlign: "right" },
                          }),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            text("Ecossistema do cluster: 13 variantes >1.500/mês (automação WhatsApp, plataforma atendimento, IA atendimento). Mercado real, não só termos exatos.", {
              name: "imo-ecos",
              width: wrap(750), height: hug,
              style: { fontFamily: font, fontSize: 14, italic: true, color: C.muted, lineHeight: 1.4 },
            }),
          ],
        ),
      ],
    ),
    text(
      "Imobiliárias entra agora porque a SERP conversa diretamente com atendimento, lead e automação. Clínicas e odontologia entram em rodada posterior, com termos refinados.",
      {
        name: "imo-claim",
        width: wrap(1700), height: hug,
        style: { fontFamily: display, fontSize: 22, bold: true, color: C.tealDark, lineHeight: 1.35 },
      },
    ),
    footer(7),
  ]);
}

// =============== SLIDE 8 — COMO O SISTEMA EXECUTA ===============
function addPipeline() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Sistema × Estratégia",
      "A estratégia entra como input. O sistema faz o resto.",
      "Sete passos automatizados, do termo até a página vencedora servindo o tráfego.",
    ),
    grid(
      {
        name: "pipe-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1)],
        columnGap: 24,
        rowGap: 12,
      },
      [
        pipelineStep("01", "Pesquisa SERP automatizada com IA",
          "Coleta autocomplete, top 10 do Google, scraping de concorrentes e tendências por termo.",
          C.teal),
        pipelineStep("02", "Briefing técnico por termo",
          "Estrutura SEO, headings, FAQ, ângulo de information gain e concorrentes a rebater.",
          C.teal),
        pipelineStep("03", "Geração simultânea por 3 IAs",
          "Claude, GPT e Gemini geram a mesma página em paralelo, cada um com seu estilo.",
          C.amber),
        pipelineStep("04", "Filtro de qualidade automático",
          "Barra fato inventado, conteúdo raso, lorem ipsum e quebra de regras de produto.",
          C.amber),
        pipelineStep("05", "Publicação em A/B nativo",
          "As 3 versões aprovadas vão ao ar na mesma URL. Sistema distribui visitantes deterministicamente.",
          C.blue),
        pipelineStep("06", "Vencedor por significância estatística",
          "Quando o volume permite, o sistema declara a versão vencedora e serve só ela ao tráfego.",
          C.blue),
        pipelineStep("07", "Reescrita automática se perder ranking",
          "Sistema detecta queda no Search Console, refaz a pesquisa SERP e regera com 10% de tráfego no controle.",
          C.coral),
        panel(
          { name: "pipe-summary", fill: C.tealDark, borderRadius: 14, padding: { x: 28, y: 22 }, width: fill, height: hug },
          column(
            { name: "pipe-summary-stack", width: fill, height: hug, gap: 8 },
            [
              text("RESULTADO OPERACIONAL", {
                name: "pipe-summary-label",
                width: fill, height: hug,
                style: { fontFamily: font, fontSize: 12, bold: true, color: C.tealSoft, letterSpacing: 2 },
              }),
              text("Junior atua como curador estratégico — não como operador.", {
                name: "pipe-summary-1",
                width: fill, height: hug,
                style: { fontFamily: display, fontSize: 22, bold: true, color: C.white, lineHeight: 1.25 },
              }),
              text("O sistema cuida da execução do dia a dia: pesquisa, geração, teste, medição e ajuste.", {
                name: "pipe-summary-2",
                width: fill, height: hug,
                style: { fontFamily: font, fontSize: 16, color: C.tealSoft, lineHeight: 1.4 },
              }),
            ],
          ),
        ),
      ],
    ),
    footer(8),
  ]);
}

// =============== SLIDE 9 — AS 10 PÁGINAS (com volume) ===============
function pageRowVol(num, title, scoreText, volText, numColor, scoreColor) {
  const id = safeId(`${num}-${title}`);
  return grid(
    {
      name: `pg-${id}`,
      width: fill,
      height: hug,
      columns: [fixed(40), fr(1), fixed(110), fixed(140)],
      columnGap: 12,
      padding: { x: 0, y: 4 },
    },
    [
      text(num, {
        name: `pg-n-${id}`,
        width: fill, height: hug,
        style: { fontFamily: display, fontSize: 18, bold: true, color: numColor, lineHeight: 1.3 },
      }),
      text(title, {
        name: `pg-t-${id}`,
        width: fill, height: hug,
        style: { fontFamily: font, fontSize: 17, color: C.ink, lineHeight: 1.3 },
      }),
      text(scoreText, {
        name: `pg-s-${id}`,
        width: fill, height: hug,
        style: { fontFamily: display, fontSize: 16, bold: true, color: scoreColor, textAlign: "right", lineHeight: 1.3 },
      }),
      text(volText, {
        name: `pg-v-${id}`,
        width: fill, height: hug,
        style: { fontFamily: display, fontSize: 16, bold: true, color: C.ink, textAlign: "right", lineHeight: 1.3 },
      }),
    ],
  );
}
function addTop10() {
  const slide = presentation.slides.add();
  const v = (n) => {
    const t = VOL_BY_N[n];
    const prefix = t.fonte_volume === "match exato" ? "" : "~";
    return `${prefix}${fmtVol(t.volume_estimado)}`;
  };
  slideRoot(slide, [
    titleBlock(
      "Primeiro lote",
      "10 LPs publicadas em bloco como entrega do MVP.",
      "Sem cronograma semanal artificial — todas vão ao ar de uma vez. Cadência semanal começa depois, guiada pelo Search Console.",
    ),
    grid(
      { name: "top10-grid", width: fill, height: fill, columns: [fr(1), fr(1)], columnGap: 36 },
      [
        column(
          { name: "top10-left", width: fill, height: hug, gap: 12 },
          [
            chip("CONTABILIDADE · CLUSTER #1", C.teal, C.white),
            grid(
              {
                name: "top10-l-head",
                width: fill, height: hug,
                columns: [fixed(40), fr(1), fixed(110), fixed(140)],
                columnGap: 12,
                padding: { x: 0, y: 2 },
              },
              [
                text("", { name: "th-l-0", width: fill, height: hug, style: { fontSize: 11 } }),
                text("PÁGINA", { name: "th-l-1", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealDark, letterSpacing: 1 } }),
                text("SCORE", { name: "th-l-2", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
                text("VOLUME/MÊS", { name: "th-l-3", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
              ],
            ),
            pageRowVol("1.", "Sistema de WhatsApp para Escritório Contábil", "28/30", v(1), C.teal, C.tealDark),
            pageRowVol("2.", "Atendimento WhatsApp para Escritório Contábil", "27/30", v(2), C.teal, C.tealDark),
            pageRowVol("3.", "WhatsApp para Escritórios Contábeis", "26/30", v(3), C.teal, C.tealDark),
            pageRowVol("4.", "Sistema de WhatsApp para Contabilidade", "26/30", v(4), C.teal, C.tealDark),
            chip("IMOBILIÁRIAS · CLUSTER #2", C.amber, C.ink),
            pageRowVol("5.", "Atendimento WhatsApp para Imobiliárias", "qualitativo", v(5), C.amber, C.muted),
            pageRowVol("6.", "Automação WhatsApp para Imobiliárias", "qualitativo", v(6), C.amber, C.muted),
          ],
        ),
        column(
          { name: "top10-right", width: fill, height: hug, gap: 12 },
          [
            chip("HORIZONTAIS + DOR · 4 LPs", C.blue, C.white),
            grid(
              {
                name: "top10-r-head",
                width: fill, height: hug,
                columns: [fixed(40), fr(1), fixed(110), fixed(140)],
                columnGap: 12,
                padding: { x: 0, y: 2 },
              },
              [
                text("", { name: "th-r-0", width: fill, height: hug, style: { fontSize: 11 } }),
                text("PÁGINA", { name: "th-r-1", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealDark, letterSpacing: 1 } }),
                text("SCORE", { name: "th-r-2", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
                text("VOLUME/MÊS", { name: "th-r-3", width: fill, height: hug, style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealDark, letterSpacing: 1, textAlign: "right" } }),
              ],
            ),
            pageRowVol("7.", "Sistema de Atendimento WhatsApp", "23/30", v(7), C.blue, C.tealDark),
            pageRowVol("8.", "WhatsApp com Múltiplos Atendentes", "25/30", v(8), C.blue, C.tealDark),
            pageRowVol("9.", "Como Organizar Atendimento pelo WhatsApp", "25/30", v(9), C.blue, C.tealDark),
            pageRowVol("10.", "Como Centralizar Atendimento no WhatsApp", "25/30", v(10), C.blue, C.tealDark),
            panel(
              { name: "top10-blog-note", fill: C.amberSoft, borderRadius: 12, padding: { x: 22, y: 16 }, width: fill, height: hug },
              column(
                { name: "blog-note-stack", width: fill, height: hug, gap: 4 },
                [
                  text("BLOG · PÓS-MVP", {
                    name: "blog-note-label", width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 11, bold: true, color: C.warn, letterSpacing: 1 },
                  }),
                  text("Blog automatizado pelo sistema reforça as 10 LPs por linkagem interna e cobertura de dor antes da intenção comercial — não entra no lote inicial.", {
                    name: "blog-note-text", width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 14, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ),
          ],
        ),
      ],
    ),
    text(`Volume total estimado do lote: ~12.700 buscas/mês · CPC médio R$ 2,40 · 100% Stable. Match exato em 5/10; demais via variantes PT-BR mais próximas.`, {
      name: "top10-summary",
      width: wrap(1700), height: hug,
      style: { fontFamily: font, fontSize: 15, italic: true, color: C.muted, lineHeight: 1.4 },
    }),
    footer(9),
  ]);
}

// =============== SLIDE 10 — POSICIONAMENTO DE COPY ===============
function addCopy() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Copy",
      "Posicionamos como gestor da operação de atendimento — não como mais um WhatsApp.",
      "Toda LP do lote carrega três pilares. O filtro de qualidade do sistema garante que o copy não invente nada fora dos fatos do produto.",
    ),
    grid(
      {
        name: "copy-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1), fr(1)],
        columnGap: 24,
      },
      [
        pillarCard(
          "01",
          "Controle operacional",
          "Centralização das conversas, departamentos por setor, tags inteligentes, histórico unificado, redução do telefone tradicional.",
          C.teal,
        ),
        pillarCard(
          "02",
          "Profissionalização",
          "Padronização entre setores (no contábil: fiscal, DP, financeiro, societário), atendimento unificado por equipe e SLA visível.",
          C.amber,
        ),
        pillarCard(
          "03",
          "Métricas",
          "Visibilidade de tempo de resposta, performance da equipe, gargalos por canal e agente, automação de processos recorrentes.",
          C.blue,
        ),
      ],
    ),
    panel(
      { name: "copy-anchor", fill: C.tealDark, borderRadius: 12, padding: { x: 28, y: 18 }, width: fill, height: hug },
      column(
        { name: "copy-anchor-stack", width: fill, height: hug, gap: 4 },
        [
          text("ANCORADO EM FATOS VERIFICÁVEIS · QUALITY GATE BARRA INVENÇÃO", {
            name: "copy-anchor-label", width: fill, height: hug,
            style: { fontFamily: font, fontSize: 11, bold: true, color: C.tealSoft, letterSpacing: 2 },
          }),
          text("API Oficial Meta · 400+ clientes ativos · planos publicados · omnichannel WhatsApp + Instagram + Facebook · agente de IA nativo", {
            name: "copy-anchor-text", width: fill, height: hug,
            style: { fontFamily: font, fontSize: 17, color: C.white, lineHeight: 1.4 },
          }),
        ],
      ),
    ),
    text(
      "Concorrentes vendem chatbot e atendimento. Ganhamos posicionando gestão operacional como diferencial — e o sistema garante consistência entre as 3 versões geradas.",
      {
        name: "copy-claim",
        width: wrap(1700), height: hug,
        style: { fontFamily: display, fontSize: 22, bold: true, color: C.tealDark, lineHeight: 1.3 },
      },
    ),
    footer(10),
  ]);
}

// =============== SLIDE 11 — MEDIÇÃO ===============
function addMeasurement() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Medição",
      "Search Console e dashboard interno arbitram a próxima rodada.",
      "A operação do dia a dia é do sistema. O papel humano é curadoria.",
    ),
    grid(
      {
        name: "measurement-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1)],
        columnGap: 36,
      },
      [
        // KPIs
        column(
          { name: "measurement-left", width: fill, height: hug, gap: 14 },
          [
            text("KPIs por LP no dashboard interno", {
              name: "measurement-kpi-label",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
            }),
            panel(
              { name: "measurement-kpi-panel", fill: C.white, borderRadius: 14, padding: { x: 26, y: 22 }, width: fill, height: hug },
              bullets(
                [
                  "Sessões e leads no período",
                  "Conversão por LP (lead / sessão)",
                  "Lift por IA vencedora (Claude vs GPT vs Gemini)",
                  "Custo por lead por provider",
                  "Posição média no Search Console",
                  "Termos inesperados (oportunidades não previstas)",
                  "Gatilhos de ajuste · refresh A/B · autocura",
                ],
                C.ink,
                18,
              ),
            ),
          ],
        ),
        // Loop
        column(
          { name: "measurement-right", width: fill, height: fill, gap: 14, justify: "start" },
          [
            text("Loop de autocura · Fase 4 do roadmap", {
              name: "measurement-loop-label",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
            }),
            panel(
              { name: "measurement-loop-panel", fill: C.tealDark, borderRadius: 14, padding: { x: 30, y: 22 }, width: fill, height: hug },
              column(
                { name: "measurement-loop-stack", width: fill, height: hug, gap: 10, align: "center" },
                [
                  text("Search Console diário", {
                    name: "loop-1", width: fill, height: hug,
                    style: { fontFamily: display, fontSize: 22, bold: true, color: C.amber, textAlign: "center" },
                  }),
                  text("↓", { name: "loop-arrow-1", width: fill, height: hug, style: { fontFamily: display, fontSize: 22, color: C.tealSoft, textAlign: "center" } }),
                  text("Detecta queda de posição/CTR", {
                    name: "loop-2", width: fill, height: hug,
                    style: { fontFamily: display, fontSize: 20, bold: true, color: C.white, textAlign: "center" },
                  }),
                  text("↓", { name: "loop-arrow-2", width: fill, height: hug, style: { fontFamily: display, fontSize: 22, color: C.tealSoft, textAlign: "center" } }),
                  text("Refaz SERP + briefing", {
                    name: "loop-3", width: fill, height: hug,
                    style: { fontFamily: display, fontSize: 20, bold: true, color: C.white, textAlign: "center" },
                  }),
                  text("↓", { name: "loop-arrow-3", width: fill, height: hug, style: { fontFamily: display, fontSize: 22, color: C.tealSoft, textAlign: "center" } }),
                  text("Regera com 3 IAs", {
                    name: "loop-4", width: fill, height: hug,
                    style: { fontFamily: display, fontSize: 20, bold: true, color: C.white, textAlign: "center" },
                  }),
                  text("↓", { name: "loop-arrow-4", width: fill, height: hug, style: { fontFamily: display, fontSize: 22, color: C.tealSoft, textAlign: "center" } }),
                  text("Nova rodada A/B · 10% no controle anterior", {
                    name: "loop-5", width: fill, height: hug,
                    style: { fontFamily: display, fontSize: 20, bold: true, color: C.tealSoft, textAlign: "center" },
                  }),
                ],
              ),
            ),
          ],
        ),
      ],
    ),
    footer(11),
  ]);
}

// =============== SLIDE 12 — PRÓXIMOS PASSOS ===============
function addNextSteps() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Próximos passos",
      "Cinco passos para destravar publicação e abrir leitura do Search Console.",
      "Cada passo com responsável claro. Aprovado este plano, o sistema começa a operar.",
    ),
    column(
      { name: "next-list", width: fill, height: fill, gap: 12 },
      [
        nextStepRow("01", "Rodar Fase 0 com os seeds da estratégia",
          "Disparar pipeline de pesquisa para os 10 termos do lote. Resultado: 10 briefings prontos no Supabase.",
          "Estratégia + Sistema", C.teal),
        nextStepRow("02", "Gerar 10 LPs com 3 IAs cada",
          "Disparar a geração para cada briefing. Resultado: 30 variações filtradas pelo quality gate.",
          "Sistema", C.teal),
        nextStepRow("03", "Publicar em bloco e abrir A/B",
          "Subir as 10 URLs no domínio ideiamultichat.com.br/blog/ via proxy reverso. Sistema distribui visitantes.",
          "Sistema + Produto", C.amber),
        nextStepRow("04", "Abrir leitura do Search Console em 14 dias",
          "Janela mínima para sinal estatístico. Dashboard mostra KPIs por LP, vencedoras por IA, candidatos a refresh.",
          "Estratégia", C.blue),
        nextStepRow("05", "Definir cadência semanal pós-MVP",
          "A partir do GSC, decidir próximas rodadas (clínicas, odontologia, segundo lote contábil/imobiliárias) e blog automatizado.",
          "Estratégia + Comercial", C.coral),
      ],
    ),
    footer(12),
  ]);
}

// =============== ANEXO A — COMPARATIVO COMPLETO ===============
function addAppendixComparison() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Anexo A · Comparativo de nichos",
      "Detalhamento dos 4 nichos prioridade A — termos, resultados, sinal/ruído e recomendação.",
      "",
      { titleSize: 36, subtitleSize: 19 },
    ),
    column(
      { name: "appendix-a-table", width: fill, height: hug, gap: 6 },
      [
        tableRow(
          ["Nicho", "Termos", "Resultados", "Sinal", "Ruído", "Recomendação"],
          [fr(0.7), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.6)],
          { header: true, name: "app-a-head" },
        ),
        rule({ name: "app-a-rule-0", width: fill, stroke: C.rule, weight: 2 }),
        tableRow(
          ["Contabilidade", "5", "25", "96%", "4%", "Manter como cluster #1 por fit comercial e SERP nichada"],
          [fr(0.7), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.6)],
          { name: "app-a-1", y: 16 },
        ),
        tableRow(
          ["Imobiliárias", "10", "50", "100%", "40%", "Incorporar como cluster #2 (atendimento, leads, automação)"],
          [fr(0.7), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.6)],
          { name: "app-a-2", y: 16 },
        ),
        tableRow(
          ["Clínicas", "10", "50", "94%", "42%", "Adiar — recortar termos para sair de agenda/software médico"],
          [fr(0.7), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.6)],
          { name: "app-a-3", y: 16 },
        ),
        tableRow(
          ["Odontologia", "10", "50", "86%", "50%", "Adiar — demanda fragmentada com software odonto, IA e conteúdo"],
          [fr(0.7), fr(0.4), fr(0.5), fr(0.4), fr(0.4), fr(1.6)],
          { name: "app-a-4", y: 16 },
        ),
        rule({ name: "app-a-rule-1", width: fill, stroke: C.rule, weight: 2 }),
      ],
    ),
    column(
      { name: "appendix-a-domains", width: fill, height: hug, gap: 12 },
      [
        text("Domínios recorrentes por nicho (top 5)", {
          name: "app-a-dom-label",
          width: fill, height: hug,
          style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1 },
        }),
        grid(
          { name: "app-a-dom-grid", width: fill, height: hug, columns: [fr(1), fr(1), fr(1)], columnGap: 22 },
          [
            panel(
              { name: "app-a-dom-imo", fill: C.white, borderRadius: 12, padding: { x: 22, y: 16 }, width: fill, height: hug },
              column(
                { name: "app-a-dom-imo-stack", width: fill, height: hug, gap: 8 },
                [
                  chip("Imobiliárias", C.amber, C.ink),
                  text("Universal Software · ChatImob · Zimobi · Jetimob · Imobilead", {
                    name: "app-a-dom-imo-text",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ),
            panel(
              { name: "app-a-dom-cli", fill: C.white, borderRadius: 12, padding: { x: 22, y: 16 }, width: fill, height: hug },
              column(
                { name: "app-a-dom-cli-stack", width: fill, height: hug, gap: 8 },
                [
                  chip("Clínicas", C.muted, C.white),
                  text("iClinic · Poli Digital · Amplimed · Clínica nas Nuvens · Gestão DS", {
                    name: "app-a-dom-cli-text",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ),
            panel(
              { name: "app-a-dom-odo", fill: C.white, borderRadius: 12, padding: { x: 22, y: 16 }, width: fill, height: hug },
              column(
                { name: "app-a-dom-odo-stack", width: fill, height: hug, gap: 8 },
                [
                  chip("Odontologia", C.muted, C.white),
                  text("Simples Dental · Beeia · Dental Speed · ControleODONTO · CoDental", {
                    name: "app-a-dom-odo-text",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ),
          ],
        ),
      ],
    ),
    footer(13, "appendix"),
  ]);
}

// =============== ANEXO B — CONCORRENTES ===============
function addAppendixCompetitors() {
  const slide = presentation.slides.add();
  slideRoot(slide, [
    titleBlock(
      "Anexo B · Concorrentes por cluster",
      "Quem o Google já considera relevante para cada cluster — e quem Victor citou pessoalmente.",
      "Horizontais com nº de aparições na SERP normalizada (lote principal, 100 resultados).",
      { titleSize: 36, subtitleSize: 19 },
    ),
    grid(
      {
        name: "comp-grid",
        width: fill,
        height: fill,
        columns: [fr(1), fr(1), fr(1)],
        columnGap: 28,
      },
      [
        panel(
          { name: "comp-acct", fill: C.white, borderRadius: 14, padding: { x: 28, y: 26 }, width: fill, height: fill },
          column(
            { name: "comp-acct-stack", width: fill, height: hug, gap: 14 },
            [
              chip("CONTABILIDADE · NICHADOS", C.teal, C.white),
              bullets(
                ["Zap Contábil", "Whats Contábil", "Zappy Contábil", "Integgri", "Nibo (conteúdo)", "Acelerato", "SocialHub"],
                C.ink, 19,
              ),
              rule({ name: "comp-acct-rule", width: fill, stroke: C.rule, weight: 1 }),
              column(
                { name: "comp-acct-victor", width: fill, height: hug, gap: 4 },
                [
                  text("CITADO POR VICTOR", {
                    name: "comp-acct-vic-label",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 12, bold: true, color: C.amber, letterSpacing: 1 },
                  }),
                  text("DigiSac — formulário comercial segmentado para contabilidade", {
                    name: "comp-acct-vic-text",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 16, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ],
          ),
        ),
        panel(
          { name: "comp-imo", fill: C.white, borderRadius: 14, padding: { x: 28, y: 26 }, width: fill, height: fill },
          column(
            { name: "comp-imo-stack", width: fill, height: hug, gap: 14 },
            [
              chip("IMOBILIÁRIAS", C.amber, C.ink),
              bullets(
                [
                  "ChatImob",
                  "Universal Software",
                  "Zimobi",
                  "Jetimob",
                  "Imobilead",
                  "Vista",
                  "Gestão Real",
                  "lais.ai",
                  "intelecta.digital",
                ],
                C.ink, 19,
              ),
            ],
          ),
        ),
        panel(
          { name: "comp-hor", fill: C.white, borderRadius: 14, padding: { x: 28, y: 26 }, width: fill, height: fill },
          column(
            { name: "comp-hor-stack", width: fill, height: hug, gap: 14 },
            [
              chip("HORIZONTAIS · APARIÇÕES NA SERP", C.blue, C.white),
              column(
                { name: "comp-hor-list", width: fill, height: hug, gap: 9 },
                [
                  ["UnderChat", "6×"],
                  ["Letalk", "6×"],
                  ["ChatPro", "5×"],
                  ["Total Chat", "4×"],
                  ["Blip", "2×"],
                  ["Kommo", "2×"],
                  ["Clientify", "2×"],
                  ["Multiatendente", "2×"],
                ].map(([name, count], i) =>
                  grid(
                    {
                      name: `comp-hor-row-${i}`,
                      width: fill, height: hug,
                      columns: [fr(1), fixed(60)],
                      columnGap: 12,
                      padding: { x: 0, y: 2 },
                    },
                    [
                      text(name, {
                        name: `comp-hor-name-${i}`,
                        width: fill, height: hug,
                        style: { fontFamily: font, fontSize: 18, color: C.ink, lineHeight: 1.2 },
                      }),
                      text(count, {
                        name: `comp-hor-count-${i}`,
                        width: fill, height: hug,
                        style: { fontFamily: display, fontSize: 17, bold: true, color: C.blue, textAlign: "right", lineHeight: 1.2 },
                      }),
                    ],
                  ),
                ),
              ),
              rule({ name: "comp-hor-rule", width: fill, stroke: C.rule, weight: 1 }),
              column(
                { name: "comp-hor-victor", width: fill, height: hug, gap: 4 },
                [
                  text("CITADO POR VICTOR", {
                    name: "comp-hor-vic-label",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 12, bold: true, color: C.amber, letterSpacing: 1 },
                  }),
                  text("DigiSac — multicanal enterprise, citado em conversas com clientes", {
                    name: "comp-hor-vic-text",
                    width: fill, height: hug,
                    style: { fontFamily: font, fontSize: 16, color: C.ink, lineHeight: 1.4 },
                  }),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
    footer(14, "appendix"),
  ]);
}

// =============== ANEXO C — SCORE COMPLETO ===============
function addAppendixScore() {
  const slide = presentation.slides.add();
  const scores = [
    [1, "sistema de whatsapp para escritório contábil", "Landing page", 28],
    [2, "atendimento whatsapp escritório contábil", "Landing page", 27],
    [3, "whatsapp para escritórios contábeis", "Landing page", 26],
    [4, "sistema de whatsapp para contabilidade", "Landing page", 26],
    [5, "whatsapp com múltiplos atendentes", "Landing page", 25],
    [6, "centralizar atendimento whatsapp", "Blog/landing de dor", 25],
    [7, "organizar atendimento whatsapp", "Blog/landing de dor", 25],
    [8, "atendimento whatsapp para contadores", "Landing/blog", 24],
    [9, "controle de atendimento whatsapp", "Blog/landing de dor", 24],
    [10, "gestão de atendimento whatsapp", "Landing/blog", 24],
    [11, "multiatendimento whatsapp", "Landing page", 23],
    [12, "sistema de atendimento whatsapp", "Landing horizontal", 23],
  ];
  slideRoot(slide, [
    titleBlock(
      "Anexo C · Score completo dos 12 termos",
      "Score por 6 critérios, escala 1-30. Demanda/SERP, intenção comercial, fit produto, fit comercial, oportunidade SERP e especificidade.",
      "",
      { titleSize: 36, subtitleSize: 19 },
    ),
    column(
      { name: "score-table", width: fill, height: hug, gap: 2 },
      [
        grid(
          {
            name: "score-head",
            width: fill, height: hug,
            columns: [fixed(40), fr(2.0), fr(0.9), fixed(360)],
            columnGap: 22,
            padding: { x: 0, y: 6 },
          },
          [
            text("#", { name: "score-head-0", width: fill, height: hug, style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1, lineHeight: 1 } }),
            text("TERMO", { name: "score-head-1", width: fill, height: hug, style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1, lineHeight: 1 } }),
            text("USO RECOMENDADO", { name: "score-head-2", width: fill, height: hug, style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1, lineHeight: 1 } }),
            text("SCORE", { name: "score-head-3", width: fill, height: hug, style: { fontFamily: font, fontSize: 14, bold: true, color: C.tealDark, letterSpacing: 1, lineHeight: 1 } }),
          ],
        ),
        rule({ name: "score-rule-0", width: fill, stroke: C.rule, weight: 2 }),
        ...scores.map(([rank, term, use, sc]) =>
          grid(
            {
              name: `score-row-${rank}`,
              width: fill, height: hug,
              columns: [fixed(40), fr(2.0), fr(0.9), fixed(360)],
              columnGap: 22,
              padding: { x: 0, y: 4 },
            },
            [
              text(String(rank), {
                name: `score-r-${rank}`,
                width: fill, height: hug,
                style: { fontFamily: display, fontSize: 15, bold: true, color: C.tealDark, lineHeight: 1.3 },
              }),
              text(term, {
                name: `score-t-${rank}`,
                width: fill, height: hug,
                style: { fontFamily: font, fontSize: 15, color: C.ink, lineHeight: 1.3 },
              }),
              text(use, {
                name: `score-u-${rank}`,
                width: fill, height: hug,
                style: { fontFamily: font, fontSize: 14, italic: true, color: C.muted, lineHeight: 1.3 },
              }),
              scoreBar(sc, 30, sc >= 26 ? C.teal : sc >= 24 ? C.amber : C.muted),
            ],
          ),
        ),
      ],
    ),
    panel(
      {
        name: "score-limit",
        fill: C.amberSoft,
        borderRadius: 12,
        padding: { x: 28, y: 18 },
        width: fill,
        height: hug,
      },
      column(
        { name: "score-limit-stack", width: fill, height: hug, gap: 4 },
        [
          text("LIMITAÇÃO METODOLÓGICA · DECLARADA", {
            name: "score-limit-label",
            width: fill, height: hug,
            style: { fontFamily: font, fontSize: 13, bold: true, color: C.warn, letterSpacing: 1 },
          }),
          text(
            "Volume de busca incorporado nos slides 6 e 7 via Apify (autocomplete PT-BR). Score formal ainda não inclui métricas reais do Search Console — entram na próxima atualização, depois da publicação.",
            {
              name: "score-limit-text",
              width: fill, height: hug,
              style: { fontFamily: font, fontSize: 16, color: C.ink, lineHeight: 1.4 },
            },
          ),
        ],
      ),
    ),
    footer(15, "appendix"),
  ]);
}

// =============== ANEXO D — BIBLIOGRAFIA ===============
function addAppendixBibliography() {
  const slide = presentation.slides.add();
  const refsResearch = [
    ["matriz-nichos-mvp.md", "15 nichos avaliados"],
    ["matriz-termos-mvp.md", "158 termos por intenção"],
    ["pesquisa-serp-nichos-prioridade-a.csv", "SERP — 4 nichos prioridade A"],
    ["analise-concorrentes-mvp.md", "17 domínios consolidados"],
    ["score-oportunidades-mvp.md", "12 termos pontuados"],
    ["comparativo-nichos-prioridade-a.md", "Comparativo dos 4 nichos"],
    ["top-10-paginas-mvp.md", "Primeiro lote de publicação"],
    ["volumes-tendencias-mvp.md", "Volume + CPC + tendência via Apify"],
  ];
  const refsSystem = [
    ["ideiapages/README.md", "Visão geral e roadmap"],
    ["ideiapages/ROADMAP.md", "48 tarefas · 67% entregue"],
    ["ideiapages/FASE-0-APROVACAO.md", "Pipeline pesquisa aprovado em piloto"],
    ["specs/fase-1-paginas-piloto.md", "Renderização + conversão"],
    ["specs/fase-2-multi-ia-ab.md", "3 IAs + quality gate + A/B"],
    ["specs/fase-3-dashboard.md", "Dashboard interno + recomendações"],
    ["specs/fase-4-autocura.md", "Detecção de queda + reescrita"],
    ["references/product_facts.md", "Fatos do Ideia Chat"],
  ];
  slideRoot(slide, [
    titleBlock(
      "Anexo D · Bibliografia interna",
      "Cada slide tem evidência rastreável em duas frentes: pesquisa estratégica e estrutura do sistema.",
      "",
      { titleSize: 36, subtitleSize: 19 },
    ),
    grid(
      {
        name: "biblio-grid",
        width: fill, height: fill,
        columns: [fr(1), fr(1)],
        columnGap: 28,
      },
      [
        column(
          { name: "biblio-research", width: fill, height: hug, gap: 11 },
          [
            chip("PESQUISA · docs/estrategia-mvp/", C.teal, C.white),
            ...refsResearch.map(([file, desc], i) =>
              panel(
                { name: `biblio-r-${i}`, fill: C.white, borderRadius: 10, padding: { x: 20, y: 11 }, width: fill, height: hug },
                column(
                  { name: `biblio-r-stack-${i}`, width: fill, height: hug, gap: 2 },
                  [
                    text(file, {
                      name: `biblio-r-file-${i}`,
                      width: fill, height: hug,
                      style: { fontFamily: "Consolas", fontSize: 14, bold: true, color: C.tealDark },
                    }),
                    text(desc, {
                      name: `biblio-r-desc-${i}`,
                      width: fill, height: hug,
                      style: { fontFamily: font, fontSize: 14, color: C.muted, lineHeight: 1.3 },
                    }),
                  ],
                ),
              ),
            ),
          ],
        ),
        column(
          { name: "biblio-system", width: fill, height: hug, gap: 11 },
          [
            chip("SISTEMA · ideiapages/", C.coral, C.white),
            ...refsSystem.map(([file, desc], i) =>
              panel(
                { name: `biblio-s-${i}`, fill: C.white, borderRadius: 10, padding: { x: 20, y: 11 }, width: fill, height: hug },
                column(
                  { name: `biblio-s-stack-${i}`, width: fill, height: hug, gap: 2 },
                  [
                    text(file, {
                      name: `biblio-s-file-${i}`,
                      width: fill, height: hug,
                      style: { fontFamily: "Consolas", fontSize: 14, bold: true, color: C.tealDark },
                    }),
                    text(desc, {
                      name: `biblio-s-desc-${i}`,
                      width: fill, height: hug,
                      style: { fontFamily: font, fontSize: 14, color: C.muted, lineHeight: 1.3 },
                    }),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    ),
    footer(16, "appendix"),
  ]);
}

// ===== Build sequence =====
addCover();          // 1
addThesis();         // 2
addSystem();         // 3 — NEW
addMethod();         // 4 — moved from slide 3
addFocusDecision();  // 5
addAccountingEvidence(); // 6 — with volumes
addImoEvidence();    // 7 — with volumes (replaces niche comparison + adds imo)
addPipeline();       // 8 — NEW pipeline
addTop10();          // 9 — with volume column
addCopy();           // 10 — with product_facts anchor
addMeasurement();    // 11 — KPIs + autocura
addNextSteps();      // 12 — NEW concrete next steps

addAppendixComparison();   // 13
addAppendixCompetitors();  // 14
addAppendixScore();        // 15 — updated note
addAppendixBibliography(); // 16 — research + system

// ===== Export =====
const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(path.join(outDir, "ideia-multichat-estrategia-mvp-victor.pptx"));

for (let i = 0; i < presentation.slides.count; i += 1) {
  const slide = presentation.slides.getItem(i);
  const png = await slide.export({ format: "png", width: W, height: H });
  await saveBlob(png, path.join(scratchDir, `slide-${String(i + 1).padStart(2, "0")}.png`));
  const layout = await slide.export({ format: "layout" });
  fs.writeFileSync(
    path.join(scratchDir, `slide-${String(i + 1).padStart(2, "0")}.layout.json`),
    JSON.stringify(layout, null, 2),
    "utf8",
  );
}

const saved = fs.readFileSync(path.join(outDir, "ideia-multichat-estrategia-mvp-victor.pptx"));
const imported = await PresentationFile.importPptx(saved);
for (let i = 0; i < imported.slides.count; i += 1) {
  const slide = imported.slides.getItem(i);
  const png = await slide.export({ format: "png", width: W, height: H });
  await saveBlob(png, path.join(scratchDir, `pptx-parity-slide-${String(i + 1).padStart(2, "0")}.png`));
}

console.log(
  JSON.stringify(
    {
      ok: true,
      slides: presentation.slides.count,
      pptx: path.join(outDir, "ideia-multichat-estrategia-mvp-victor.pptx"),
      previews: scratchDir,
    },
    null,
    2,
  ),
);
