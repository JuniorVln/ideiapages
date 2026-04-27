function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(s: string): string {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return t;
}

/**
 * Markdown leve no corpo das páginas públicas. O H1 fica no hero;
 * linhas `# ` viram H2 para hierarquia SEO correta.
 */
export function renderBlogMarkdown(raw: string): string {
  const lines = raw.trim().split(/\r?\n/);
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    const line = lines[i];

    if (line.startsWith("### ")) {
      blocks.push(`<h3>${inlineFormat(line.slice(4).trim())}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(`<h2>${inlineFormat(line.slice(3).trim())}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(`<h2>${inlineFormat(line.slice(2).trim())}</h2>`);
      i++;
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(
          `<li>${inlineFormat(lines[i].replace(/^[-*]\s+/, "").trim())}</li>`
        );
        i++;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

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
    if (text) blocks.push(`<p>${inlineFormat(text)}</p>`);
  }

  return blocks.join("\n");
}
