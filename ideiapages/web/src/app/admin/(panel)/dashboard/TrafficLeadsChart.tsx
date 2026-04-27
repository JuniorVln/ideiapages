"use client";

import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { ChartBox } from "./ChartBox";

export type TrafficLeadsRow = { label: string; visitas: number; leads: number };

const CHART_H = 288;

export function TrafficLeadsChart({ data }: { data: TrafficLeadsRow[] }) {
  if (data.length === 0) {
    return <p className="text-slate-500 text-sm">Sem dados de métricas no período.</p>;
  }
  return (
    <ChartBox height={CHART_H}>
      {(w) => (
        <LineChart width={w} height={CHART_H} data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="visitas"
            name="Visitas"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ChartBox>
  );
}
