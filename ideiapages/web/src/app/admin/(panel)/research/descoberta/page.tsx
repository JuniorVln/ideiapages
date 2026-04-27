import { requireAdmin } from "@/lib/admin/require-admin";
import { redirect } from "next/navigation";

export default async function DescobertaLegacyRedirect() {
  await requireAdmin();
  redirect("/admin/research");
}
