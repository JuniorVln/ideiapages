import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  pickVariation,
  variacaoCookieName,
  VISITOR_COOKIE,
  type PaginaExperimentContext,
  type VariacaoArm,
} from "@/lib/experiments/pick-variation";

function newVisitorId(): string {
  return crypto.randomUUID();
}

function parseBlogSlug(pathname: string): string | null {
  if (!pathname.startsWith("/blog/")) return null;
  const rest = pathname.slice("/blog/".length);
  if (!rest || rest.includes("/")) return null;
  return decodeURIComponent(rest);
}

function adminAllowlist(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
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

  const res = await fetch(`${url}/rest/v1/paginas?${qs.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

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
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const allow = adminAllowlist();
    const email = user?.email?.toLowerCase() ?? "";
    if (!user || !allow.includes(email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin/login")) {
    const allow = adminAllowlist();
    const email = user?.email?.toLowerCase() ?? "";
    if (user && allow.includes(email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const slug = parseBlogSlug(pathname);
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
