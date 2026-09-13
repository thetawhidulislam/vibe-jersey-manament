"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { formatMoney } from "@/lib/utils";
import { Boxes, PackageCheck, ShoppingBag, Wallet, TrendingDown, TrendingUp, Package } from "lucide-react";

async function fetchStats() {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  if (isLoading || !data) {
    return <div className="text-sm text-muted">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Business overview, real-time.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-7">
        <StatCard label="Total Stock" value={String(data.totalStock)} icon={Boxes} accent="ink" />
        <StatCard label="Total Sold" value={String(data.totalSold)} icon={PackageCheck} accent="volt" />
        <StatCard label="Total Orders" value={String(data.totalOrders)} icon={ShoppingBag} accent="ink" />
        <StatCard label="Total Sales" value={formatMoney(data.totalSales)} icon={Wallet} accent="volt" />
        <StatCard
          label="COGS"
          value={formatMoney(data.totalCOGS ?? data.totalCost ?? 0)}
          icon={TrendingDown}
          accent="flame"
          subtitle="Cost of sold items only"
        />
        <StatCard
          label="Inventory Investment"
          value={formatMoney(data.totalInventoryInvestment ?? data.inventoryInvestment ?? 0)}
          icon={Package}
          accent="ink"
          subtitle="Total spent on all stock"
        />
        <StatCard
          label="Total Profit"
          value={formatMoney(data.totalProfit)}
          icon={TrendingUp}
          accent="volt"
          subtitle="Gross profit on sold items only"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales — last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.salesChart} />
          </CardContent>
        </Card>

        {/* Best selling */}
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Jerseys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bestSelling.length === 0 && <p className="text-sm text-muted">No sales yet.</p>}
            {data.bestSelling.map((j: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-ink">{j.name}</div>
                  <div className="text-xs text-muted">{j.team}</div>
                </div>
                <Badge variant="volt">{j.qty} pcs</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Size-wise sales */}
        <Card>
          <CardHeader>
            <CardTitle>Size-wise Sales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.sizeSales).map(([size, qty]: any) => (
              <div key={size} className="flex items-center justify-between text-sm">
                <span className="text-muted">{size}</span>
                <span className="font-medium text-ink">{qty} pcs</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team-wise sales */}
        <Card>
          <CardHeader>
            <CardTitle>Team-wise Sales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.teamSales).map(([team, qty]: any) => (
              <div key={team} className="flex items-center justify-between text-sm">
                <span className="text-muted">{team}</span>
                <span className="font-medium text-ink">{qty} pcs</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Member performance */}
        <Card>
          <CardHeader>
            <CardTitle>Member Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.memberStats.map((m: any) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{m.name}</span>
                <span className="text-muted">
                  {m.orders} orders · {formatMoney(m.sales)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Stock alerts */}
      {(data.lowStock.length > 0 || data.outOfStock.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.outOfStock.map((s: any, i: number) => (
              <div key={`out-${i}`} className="flex items-center justify-between text-sm">
                <span>{s.jerseyName} — {s.team} — {s.size}</span>
                <Badge variant="danger">Out of stock</Badge>
              </div>
            ))}
            {data.lowStock.map((s: any, i: number) => (
              <div key={`low-${i}`} className="flex items-center justify-between text-sm">
                <span>{s.jerseyName} — {s.team} — {s.size}</span>
                <Badge variant="warn">Low stock · {s.quantity} left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
