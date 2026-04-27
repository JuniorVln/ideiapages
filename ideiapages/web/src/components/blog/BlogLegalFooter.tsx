import { IDEIA } from "@/lib/ideia-brand";

/** Footer escuro estilo site principal (três colunas + barra inferior). */
const FOOTER_BG = "#005696";

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

export function BlogLegalFooter() {
  const year = new Date().getFullYear();
  const hasLocal = Boolean(IDEIA.cnpj && IDEIA.address);

  return (
    <footer className="mt-16 text-white" style={{ backgroundColor: FOOTER_BG }} role="contentinfo">
      <div className="max-w-container mx-auto px-4 py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-10 lg:gap-16">
          {/* Marca + texto + redes */}
          <div className="space-y-5">
            <a href={IDEIA.homeUrl} className="inline-block" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IDEIA.logoUrl}
                alt={IDEIA.logoAlt}
                width={180}
                height={48}
                className="h-10 w-auto max-w-[200px] object-contain object-left"
              />
            </a>
            <p className="text-sm leading-relaxed text-white/90">{IDEIA.footerBlurb}</p>
            <div className="flex items-center gap-3">
              <a
                href={IDEIA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white/10"
                aria-label="Instagram Ideia Chat"
              >
                <IconInstagram className="size-5" />
              </a>
              <a
                href={IDEIA.whatsappPublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white/10"
                aria-label="WhatsApp Ideia Chat"
              >
                <IconWhatsApp className="size-5" />
              </a>
            </div>
          </div>

          {/* Acesso rápido */}
          <div>
            <p className="mb-4 text-base font-bold text-white">Acesso Rápido</p>
            <ul className="flex flex-col gap-3 text-sm text-white/90">
              {IDEIA.footerQuickLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-white hover:underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Horário / contato */}
          <div>
            <p className="mb-4 text-base font-bold text-white">Horário De Atendimento</p>
            <ul className="flex flex-col gap-4 text-sm text-white/90">
              <li className="flex gap-3">
                <IconClock className="mt-0.5 size-5 shrink-0 text-white" />
                <span>{IDEIA.footerHours}</span>
              </li>
              <li className="flex gap-3">
                <IconPhone className="mt-0.5 size-5 shrink-0 text-white" />
                <a href={IDEIA.footerPhoneTel} className="hover:underline underline-offset-4">
                  {IDEIA.footerPhoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <IconPin className="mt-0.5 size-5 shrink-0 text-white" />
                <span>{IDEIA.footerServiceArea}</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-10 border-white/25" />

        <div className="flex flex-col gap-3 text-xs text-white/75 sm:flex-row sm:items-start sm:justify-between">
          {hasLocal ? (
            <address className="not-italic space-y-0.5">
              {IDEIA.cnpj ? <p>CNPJ: {IDEIA.cnpj}</p> : null}
              {IDEIA.address ? <p>{IDEIA.address}</p> : null}
            </address>
          ) : (
            <span />
          )}
          <p className="sm:text-right">
            © {year} - Ideia Chat
            {" · "}
            <a
              href={IDEIA.privacyUrl}
              className="underline underline-offset-2 hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de privacidade
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
