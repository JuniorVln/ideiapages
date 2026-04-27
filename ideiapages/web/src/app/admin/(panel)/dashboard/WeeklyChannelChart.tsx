"use client";

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";

import { ChartBox } from "./ChartBox";

export type WeeklyChannelRow = { semana: string; leads: number; cliquesWhatsapp: number };

export function WeeklyChannelChart({ data }: { data: WeeklyChannelRow[] }) {
  if (data.length === 0) {
    return <p className="text-slate-500 text-sm">Sem dados semanais.</p>;
  }
  return (
    <ChartBox height={256}>
      {(w) => (
        <BarChart width={w} height={256} data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="semana" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="leads" name="Leads (formulário)" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar
            dataKey="cliquesWhatsapp"
            name="Cliques WhatsApp"
            fill="#a855f7"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      )}
    </ChartBox>
  );
}
