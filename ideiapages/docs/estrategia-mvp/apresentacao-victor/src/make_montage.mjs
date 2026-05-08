import fs from "node:fs";
import path from "node:path";
import { Canvas, loadImage } from "../node_modules/@oai/artifact-tool/node_modules/skia-canvas/lib/index.js";

const scratchDir = path.resolve("scratch");
const files = fs
  .readdirSync(scratchDir)
  .filter((name) => /^pptx-parity-slide-\d+\.png$/.test(name))
  .sort();

const thumbW = 480;
const thumbH = 270;
const gap = 28;
const labelH = 34;
const cols = 4;
const rows = Math.ceil(files.length / cols);

const canvas = new Canvas(cols * thumbW + (cols + 1) * gap, rows * (thumbH + labelH) + (rows + 1) * gap);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#F7F2EA";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.font = "20px Aptos";
ctx.fillStyle = "#132A2E";

for (let i = 0; i < files.length; i += 1) {
  const file = files[i];
  const img = await loadImage(path.join(scratchDir, file));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = gap + col * (thumbW + gap);
  const y = gap + row * (thumbH + labelH + gap);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x - 4, y - 4, thumbW + 8, thumbH + 8);
  ctx.drawImage(img, x, y, thumbW, thumbH);
  ctx.fillStyle = "#132A2E";
  ctx.fillText(`Slide ${String(i + 1).padStart(2, "0")}`, x, y + thumbH + 26);
}

const png = await canvas.toBuffer("png");
fs.writeFileSync(path.join(scratchDir, "pptx-parity-montage.png"), png);

console.log(JSON.stringify({ ok: true, files: files.length, montage: path.join(scratchDir, "pptx-parity-montage.png") }, null, 2));

