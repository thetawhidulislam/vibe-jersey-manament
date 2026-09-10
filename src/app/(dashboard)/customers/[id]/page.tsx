import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatMoney, formatDate } from "@/lib/utils";
import { ShoppingBag, Shirt, Wallet } from "lucide-react";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const totalJerseys = customer.orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.quantity, 0), 0);
  const totalSpent = customer.orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">{customer.name}</h1>
        <p className="text-sm text-muted">{customer.phone}{customer.address ? ` · ${customer.address}` : ""}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Orders" value={String(customer.orders.length)} icon={ShoppingBag} accent="ink" />
        <StatCard label="Total Jerseys" value={String(totalJerseys)} icon={Shirt} accent="volt" />
        <StatCard label="Total Spent" value={formatMoney(totalSpent)} icon={Wallet} accent="volt" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previous Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between rounded-xl border border-border p-3 text-sm hover:bg-black/[0.015]"
            >
              <div>
                <div className="font-medium text-ink">{o.orderNumber}</div>
                <div className="text-muted">{formatDate(o.createdAt)}</div>
              </div>
             <div className="font-medium text-ink">{formatMoney(Number(o.total))}</div>
            </Link>
          ))}
          {customer.orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
