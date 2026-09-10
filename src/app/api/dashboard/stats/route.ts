import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();

    const [stockAgg, orderCount, orderItems, orders, costAgg, lowStockThreshold] = await Promise.all([
      prisma.jerseyStock.aggregate({ _sum: { quantity: true } }),
      prisma.order.count({ where: { status: { not: "RETURNED" } } }),
      prisma.orderItem.findMany({
        where: { order: { status: { not: "RETURNED" } } },
        include: { jersey: true },
      }),
      prisma.order.findMany({
        where: { status: { not: "RETURNED" } },
        select: { total: true, createdAt: true, assignedToId: true, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.cost.aggregate({ _sum: { amount: true } }),
      Promise.resolve(5),
    ]);

    const totalSold = orderItems.reduce((s, i) => s + i.quantity, 0);
    const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalCost = orderItems.reduce((s, i) => s + Number(i.buyingPrice) * i.quantity, 0);
    const totalCOGS = totalCost;
    const totalInventoryInvestment = Number(costAgg._sum.amount ?? 0);
    const totalProfit = orderItems.reduce(
      (s, i) => s + (Number(i.sellingPrice) - Number(i.buyingPrice)) * i.quantity,
      0
    );

    // Best selling jersey
    const byJersey: Record<string, { name: string; team: string; qty: number }> = {};
    for (const item of orderItems) {
      const key = item.jerseyId;
      if (!byJersey[key]) byJersey[key] = { name: item.jersey.name, team: item.jersey.team, qty: 0 };
      byJersey[key].qty += item.quantity;
    }
    const bestSelling = Object.values(byJersey)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Size-wise sales
    const bySize: Record<string, number> = {};
    for (const item of orderItems) {
      bySize[item.size] = (bySize[item.size] || 0) + item.quantity;
    }

    // Team-wise sales
    const byTeam: Record<string, number> = {};
    for (const item of orderItems) {
      byTeam[item.jersey.team] = (byTeam[item.jersey.team] || 0) + item.quantity;
    }

    // Member-wise stats
    const byMember: Record<string, { name: string; orders: number; sales: number }> = {};
    for (const o of orders) {
      const key = o.assignedToId;
      if (!byMember[key]) byMember[key] = { name: o.assignedTo.name, orders: 0, sales: 0 };
      byMember[key].orders += 1;
      byMember[key].sales += Number(o.total);
    }

    // Daily sales for last 14 days (for the chart)
    const salesByDay: Record<string, number> = {};
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      salesByDay[day] = (salesByDay[day] || 0) + Number(o.total);
    }
    const salesChart = Object.entries(salesByDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-14)
      .map(([date, total]) => ({ date, total }));

    // Low stock / out of stock
    const stocks = await prisma.jerseyStock.findMany({ include: { jersey: true } });
    const lowStock = stocks.filter((s) => s.quantity > 0 && s.quantity <= lowStockThreshold);
    const outOfStock = stocks.filter((s) => s.quantity === 0);

    return NextResponse.json({
      totalStock: stockAgg._sum.quantity || 0,
      totalSold,
      totalOrders: orderCount,
      totalSales,
      totalCOGS,
      totalCost,
      inventoryInvestment: totalInventoryInvestment,
      totalInventoryInvestment,
      totalProfit,
      bestSelling,
      sizeSales: bySize,
      teamSales: byTeam,
      memberStats: Object.values(byMember),
      salesChart,
      lowStock: lowStock.map((s) => ({
        jerseyName: s.jersey.name,
        team: s.jersey.team,
        size: s.size,
        quantity: s.quantity,
      })),
      outOfStock: outOfStock.map((s) => ({
        jerseyName: s.jersey.name,
        team: s.jersey.team,
        size: s.size,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
