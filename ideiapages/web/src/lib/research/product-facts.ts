import fs from "fs/promises";
import path from "path";

export async function loadProductFacts(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "..", "references", "product_facts.md");
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Erro ao carregar product_facts.md:", error);
    return "Fatos do produto não disponíveis.";
  }
}
