"use client";

import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

import { ChartBox } from "./ChartBox";

const COLORS: Record<string, string> = {
  claude: "#f59e0b",
  gpt: "#10b981",
  gemini: "#3b82f6",
  controle: "#64748b",
  desconhecido: "#475569",
};

export type WinSlice = { name: string; value: number };

const DONUT_H = 256;

export function ProviderWinsDonut({ data }: { data: WinSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <p className="text-slate-500 text-sm">Nenhum experimento com vencedor declarado ainda.</p>;
  }
  return (
    <ChartBox height={DONUT_H}>
      {(w) => {
        const r = Math.min(w, DONUT_H) / 2 - 4;
        const inner = Math.round(r * 0.55);
        const outer = Math.round(r * 0.92);
        const cx = Math.round(w / 2);
        const cy = Math.round(DONUT_H / 2);
        return (
          <PieChart width={w} height={DONUT_H}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx={cx}
              cy={cy}
              innerRadius={inner}
              outerRadius={outer}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell
                  key={`${entry.name}-${i}`}
                  fill={COLORS[entry.name] ?? COLORS.desconhecido}
                  stroke="#0f172a"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        );
      }}
    </ChartBox>
  );
}
