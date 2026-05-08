import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona a raiz do site diretamente para o painel do sistema
  redirect("/admin/hub");
}
