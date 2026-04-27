"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { ChartBox } from "./ChartBox";

type Row = { provider: string; total: number };

export function ProviderLeadsChart({ data }: { data: Row[] }) {
  return (
    <ChartBox height={256}>
      {(w) => (
        <BarChart width={w} height={256} data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="provider" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      )}
    </ChartBox>
  );
}
