"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OrderForm } from "@/components/order/order-form";
import { toast } from "sonner";

async function fetchOrder(id: string) {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Failed to load order");
  return res.json();
}

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => fetchOrder(params.id),
  });

  useEffect(() => {
    if (data?.status === "RETURNED") {
      toast.error("Returned orders cannot be edited because stock has already been reconciled on return.");
      router.replace("/orders");
    }
  }, [data, router]);

  if (isLoading || !data) {
    return <div className="text-sm text-muted">Loading order…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Edit Order</h1>
        <p className="text-sm text-muted">Update customer details, items, and totals while preserving stock consistency.</p>
      </div>

      <OrderForm
        mode="edit"
        orderId={params.id}
        initialData={{
          customerName: data.customer.name,
          customerPhone: data.customer.phone,
          customerAddress: data.customer.address ?? "",
          assignedToId: data.assignedToId,
          items: data.items.map((item: any) => ({
            jerseyId: item.jerseyId,
            size: item.size,
            quantity: item.quantity,
          })),
          deliveryCharge: Number(data.deliveryCharge),
          discount: Number(data.discount),
        }}
      />
    </div>
  );
}
