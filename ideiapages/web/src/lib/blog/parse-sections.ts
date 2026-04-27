/** Inline: escapa HTML e converte **bold** → <strong> */
function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function inline(s: string): string {
  return escape(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export type SectionBlock =
  | { type: "paragraph"; html: string }
  | { type: "list"; items: string[] };

export type ParsedSection = {
  heading: string | null;
  headingHtml: string | null;
  blocks: SectionBlock[];
};

export function parseMarkdownToSections(raw: string): ParsedSection[] {
  const lines = raw.trim().split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let cur: ParsedSection = { heading: null, headingHtml: null, blocks: [] };

  const push = () => {
    if (cur.heading !== null || cur.blocks.length > 0) sections.push(cur);
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // H1 ou H2 → nova seção
    if (line.startsWith("# ") || line.startsWith("## ")) {
      push();
      const text = line.replace(/^#{1,2}\s+/, "").trim();
      cur = { heading: text, headingHtml: inline(text), blocks: [] };
      i++;
      continue;
    }

    // H3 → sub-heading vira parágrafo destacado
    if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      cur.blocks.push({ type: "paragraph", html: `<strong>${inline(text)}</strong>` });
      i++;
      continue;
    }

    // Lista
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(inline(lines[i].replace(/^[-*]\s+/, "").trim()));
        i++;
      }
      cur.blocks.push({ type: "list", items });
      continue;
    }

    // Linha vazia
    if (!line.trim()) {
      i++;
      continue;
    }

    // Parágrafo (junta linhas consecutivas)
    const paras: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("* ")
    ) {
      paras.push(lines[i].trim());
      i++;
    }
    const text = paras.join(" ");
    if (text) cur.blocks.push({ type: "paragraph", html: inline(text) });
  }

  push();
  return sections;
}
