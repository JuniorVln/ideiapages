import { requireAdmin } from "@/lib/admin/require-admin";
import { redirect } from "next/navigation";

export default async function NovaPesquisaRedirectPage() {
  await requireAdmin();
  redirect("/admin/research");
}
