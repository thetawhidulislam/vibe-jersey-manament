"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatMoney } from "@/lib/utils";

export function SalesChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="voltFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C6FF3D" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#C6FF3D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          tick={{ fontSize: 12, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip
          formatter={(value: number) => formatMoney(value)}
          contentStyle={{ borderRadius: 12, border: "1px solid #E4E7EC" }}
        />
        <Area type="monotone" dataKey="total" stroke="#9FDB1E" strokeWidth={2} fill="url(#voltFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
