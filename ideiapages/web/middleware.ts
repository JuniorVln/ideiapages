import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminAllowlist } from "@/lib/admin/allowlist";
import { isAdminLocalBypass } from "@/lib/admin/local-bypass";
import {
  pickVariation,
  variacaoCookieName,
  VISITOR_COOKIE,
  type PaginaExperimentContext,
  type VariacaoArm,
} from "@/lib/experiments/pick-variation";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

function newVisitorId(): string {
  return crypto.randomUUID();
}

function parsePublicContentSlug(pathname: string): string | null {
  const prefix = `${PUBLIC_CONTENT_BASE_PATH}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  if (!rest || rest.includes("/")) return null;
  return decodeURIComponent(rest);
}

async function fetchPaginaExperimentContext(
  slug: string,
): Promise<PaginaExperimentContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const select = [
    "id",
    "status_experimento",
    "variacao_vencedora_id",
    "variacoes(id,nome,ativa,provider,peso_trafego,corpo_mdx)",
  ].join(",");

  const qs = new URLSearchParams({
    slug: `eq.${slug}`,
    status: `eq.publicado`,
    select: select,
  });

  let res: Response;
  try {
    res = await fetch(`${url}/rest/v1/paginas?${qs.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  const row = rows[0];
  if (!row) return null;

  const variacoesRaw = row.variacoes as Record<string, unknown>[] | undefined;
  const variacoes: VariacaoArm[] = (variacoesRaw ?? []).map((v) => ({
    id: String(v.id),
    nome: String(v.nome ?? ""),
    ativa: Boolean(v.ativa),
    provider: String(v.provider ?? "controle"),
    peso_trafego: typeof v.peso_trafego === "number" ? v.peso_trafego : 1,
    corpo_mdx: v.corpo_mdx != null ? String(v.corpo_mdx) : null,
  }));

  return {
    id: String(row.id),
    status_experimento: String(row.status_experimento ?? "inativo"),
    variacao_vencedora_id:
      row.variacao_vencedora_id != null ? String(row.variacao_vencedora_id) : null,
    variacoes,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Em dev, com bypass local, não chama auth.getUser() (rede) — evita trava se Supabase
  // estiver inacessível; o painel usa requireAdmin() + bypass no Server Component.
  if (isAdminLocalBypass() && pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/hub";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  /** Sem credenciais no Edge, `createServerClient(undefined, …)` quebra o middleware inteiro → site em branco. */
  let user: { email?: string | null } | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
          ) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as never),
            );
          },
        },
      });

      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      user = u;
    } catch {
      /* Supabase inacessível / erro no Edge: não bloquear o site (evita páginas em branco). */
      user = null;
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!isAdminLocalBypass()) {
      const allow = getAdminAllowlist();
      const email = user?.email?.toLowerCase() ?? "";
      if (!user || !allow.includes(email)) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  if (pathname.startsWith("/admin/login")) {
    if (isAdminLocalBypass()) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/hub";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const allow = getAdminAllowlist();
    const email = user?.email?.toLowerCase() ?? "";
    if (user && allow.includes(email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/hub";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const slug = parsePublicContentSlug(pathname);
  if (slug) {
    let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
    if (!visitorId) {
      visitorId = newVisitorId();
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    const ctx = await fetchPaginaExperimentContext(slug);
    if (ctx && ctx.variacoes.length > 0) {
      const chosen = pickVariation(visitorId, ctx);
      const cname = variacaoCookieName(ctx.id);
      const existing = request.cookies.get(cname)?.value;
      const validExisting =
        !!existing && ctx.variacoes.some((v) => v.id === existing && v.ativa);
      const vid = validExisting ? existing! : chosen.id;
      if (!validExisting) {
        response.cookies.set(cname, vid, {
          path: "/",
          maxAge: 60 * 60 * 24 * 180,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          httpOnly: false,
        });
      }
    }
  }

  return response;
}

/**
 * Não executar middleware em assets do Next (`/_next/*`), API routes, favicon nem ficheiros estáticos.
 * Se o middleware correr em pedidos de CSS/JS (consoante versão/host), o painel pode renderizar sem estilos.
 */
export const config = {
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
