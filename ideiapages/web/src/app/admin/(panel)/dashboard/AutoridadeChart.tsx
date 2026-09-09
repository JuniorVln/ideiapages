"use client";

import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { ChartBox } from "./ChartBox";

export type AutoridadeRow = { label: string } & Record<string, string | number | null>;

const CHART_H = 260;

/** Cores fixas por posição — nosso domínio sempre entra primeiro (azul). */
const CORES = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];

export function AutoridadeChart({
  data,
  dominios,
}: {
  data: AutoridadeRow[];
  dominios: string[];
}) {
  if (data.length === 0 || dominios.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        Sem coletas ainda. O cron <code>/api/cron/autoridade-sync</code> grava o primeiro ponto.
      </p>
    );
  }
  return (
    <ChartBox height={CHART_H}>
      {(w) => (
        <LineChart width={w} height={CHART_H} data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 10]} tickCount={6} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {dominios.map((d, i) => (
            <Line
              key={d}
              type="monotone"
              dataKey={d}
              name={d}
              stroke={CORES[i % CORES.length]}
              strokeWidth={i === 0 ? 2.5 : 1.5}
              dot={{ r: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      )}
    </ChartBox>
  );
}
