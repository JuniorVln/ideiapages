import { z } from "zod";

/** Saída canônica compartilhada pelos 3 generators (Fase 2). */
export const GeneratedPageSchema = z.object({
  body_mdx: z.string().min(200, "body_mdx muito curto"),
  titulo_alt: z.string().optional(),
  meta_description_alt: z.string().max(320).optional(),
});

export type GeneratedPage = z.infer<typeof GeneratedPageSchema>;
