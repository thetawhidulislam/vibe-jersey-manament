"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

async function fetchStats() {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("Failed to load reports");
  return res.json();
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  if (isLoading || !data) return <div className="text-sm text-muted">Loading reports…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-muted">Sales, inventory, product, and member performance in one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sales Report</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total Sales" value={formatMoney(data.totalSales)} />
            <Row label="Total Orders" value={String(data.totalOrders)} />
            <Row label="Total Jersey Sold" value={String(data.totalSold)} />
            <Row label="COGS" value={formatMoney(data.totalCOGS ?? data.totalCost ?? 0)} />
            <Row label="Inventory Investment" value={formatMoney(data.totalInventoryInvestment ?? data.inventoryInvestment ?? 0)} />
            <Row label="Gross Profit" value={formatMoney(data.totalProfit)} />
            <Row label="Profit Margin" value={`${Number(data.profitMargin ?? 0).toFixed(1)}%`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inventory Report</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total Stock" value={String(data.totalStock)} />
            <Row label="Low Stock Items" value={String(data.lowStock.length)} />
            <Row label="Out of Stock Items" value={String(data.outOfStock.length)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Product Report — Most Sold</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.bestSelling.map((j: any, i: number) => (
              <Row key={i} label={`${j.team} — ${j.name}`} value={`${j.qty} pcs`} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Member Report</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.memberStats.map((m: any) => (
              <Row key={m.name} label={m.name} value={`${m.orders} orders · ${formatMoney(m.sales)}`} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
