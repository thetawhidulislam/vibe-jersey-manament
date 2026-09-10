import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { customer: true, assignedTo: true, items: { include: { jersey: true } } },
  });

  if (!order) notFound();

  const isReturned = order.status === "RETURNED";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={isReturned ? "neutral" : "ok"}>{isReturned ? "Returned" : "Completed"}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium text-ink">{order.customer.name}</div>
            <div className="text-muted">{order.customer.phone}</div>
            {order.customer.address && <div className="text-muted">{order.customer.address}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assigned To</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium text-ink">{order.assignedTo.name}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0">
              <div>
                <div className="font-medium text-ink">{item.jersey.team} — {item.jersey.name}</div>
                <div className="text-muted">{item.size} × {item.quantity}</div>
              </div>
              <div className="font-medium text-ink">{formatMoney(Number(item.totalPrice))}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatMoney(Number(order?.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery</span>
            <span>{formatMoney(Number(order?.deliveryCharge))}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Discount</span>
            <span>-{formatMoney(Number(order?.discount))}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
            <span>Grand Total</span>
            <span>{formatMoney(Number(order?.total))}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
