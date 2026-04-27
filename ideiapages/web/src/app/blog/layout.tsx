import { Maven_Pro } from "next/font/google";

const maven = Maven_Pro({
  subsets: ["latin"],
  display: "swap",
});

/** Layout das páginas públicas de conteúdo comercial em `/blog/*` (rotas técnicas). */
export default function PublicContentLayout({ children }: { children: React.ReactNode }) {
  return <div className={maven.className}>{children}</div>;
}
