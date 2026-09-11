/**
 * Botão flutuante de WhatsApp das ferramentas-isca (pedido do Victor, 11/09/2026).
 *
 * Fica visível o tempo todo, em desktop e mobile, e cai direto no comercial com a
 * mensagem já escrita — quem está usando a ferramenta não precisa procurar contato.
 * É um <a> puro de propósito: nenhum JS, nenhum dado do visitante.
 */

const NUMERO_COMERCIAL = "5551998681452";

export function WhatsAppFlutuante({
  mensagem,
  rotulo = "Falar no WhatsApp",
}: {
  mensagem: string;
  rotulo?: string;
}) {
  const href = `https://wa.me/${NUMERO_COMERCIAL}?text=${encodeURIComponent(mensagem)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Falar com o comercial do Ideia Chat no WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3.5 font-semibold text-white shadow-xl shadow-emerald-900/25 transition hover:bg-[#1fb457] sm:px-5"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-current" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.526 5.845L.057 23.999l6.304-1.651A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 0 1-5.003-1.37l-.358-.213-3.742.98 1.003-3.647-.234-.374A9.793 9.793 0 0 1 2.182 12C2.182 6.576 6.576 2.182 12 2.182c5.424 0 9.818 4.394 9.818 9.818 0 5.423-4.394 9.818-9.818 9.818z" />
      </svg>
      <span className="hidden text-[15px] sm:inline">{rotulo}</span>
    </a>
  );
}
