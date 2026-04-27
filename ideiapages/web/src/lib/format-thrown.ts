/** Mensagem legível para erros rejeitados/throws em handlers (incl. valores não-Error). */
export function formatThrown(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof Event !== "undefined" && e instanceof Event) {
    return "Falha inesperada (evento do browser). Tente de novo; se persistir, abra a consola (F12).";
  }
  if (
    e &&
    typeof e === "object" &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  try {
    const s = String(e);
    if (s === "[object Event]") {
      return "Falha inesperada (evento do browser). Tente de novo; se persistir, abra a consola (F12).";
    }
    return s;
  } catch {
    return "Erro desconhecido.";
  }
}

export function safeJsonStringify(v: unknown, maxLen: number): string {
  try {
    const s = JSON.stringify(v);
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen) + "…";
  } catch {
    return "[resposta não JSON ou não serializável]";
  }
}
