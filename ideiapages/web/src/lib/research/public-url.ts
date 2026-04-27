/** Evita SSRF em rotas que recebem URL de utilizador. */
export function assertPublicHttpUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("URL inválida.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Só são permitidos links http ou https.");
  }
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    h === "127.0.0.1" ||
    h.startsWith("192.168.") ||
    h.startsWith("10.") ||
    h.startsWith("172.16.") ||
    h.startsWith("169.254.")
  ) {
    throw new Error("Endereços locais ou privados não são permitidos.");
  }
  return u.toString();
}
