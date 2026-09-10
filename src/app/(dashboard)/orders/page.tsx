"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMoney, formatDate } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

async function fetchOrders(q: string) {
  const res = await fetch(`/api/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

export default function OrdersPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [confirmOrder, setConfirmOrder] = useState<any | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["orders", query], queryFn: () => fetchOrders(query) });

  const returnMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/return`, { method: "POST" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || "Failed to return order");
      return payload;
    },
    onSuccess: async () => {
      toast.success("Order returned successfully");
      setConfirmOrder(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["jerseys"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to return order");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || payload.error || "Failed to delete order");
      return payload;
    },
    onSuccess: async () => {
      toast.success("Order deleted");
      setDeleteOrder(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["jerseys"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete order");
    },
  });

  const handleReturnConfirm = () => {
    if (!confirmOrder) return;
    returnMutation.mutate(confirmOrder.id);
  };

  const handleDeleteConfirm = () => {
    if (!deleteOrder) return;
    deleteMutation.mutate(deleteOrder.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">Orders</h1>
          <p className="text-sm text-muted">Every order is completed the moment it's created.</p>
        </div>
        <Link href="/orders/add">
          <Button variant="secondary">
            <Plus size={16} /> Add Order
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search order ID, customer name, or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Order ID</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Assigned</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-5 py-6 text-center text-muted">Loading…</td>
              </tr>
            )}
            {data?.map((o: any) => {
              const itemCount = o.items.reduce((s: number, i: any) => s + i.quantity, 0);
              const isReturned = o.status === "RETURNED";
              return (
                <tr key={o.id} className="cursor-pointer hover:bg-black/[0.015]">
                  <td className="px-5 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium text-ink hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink">{o.customer.name}</td>
                  <td className="px-5 py-3 text-muted">{o.customer.phone}</td>
                  <td className="px-5 py-3 text-muted">{itemCount} pcs</td>
                  <td className="px-5 py-3 font-medium text-ink">{formatMoney(o.total)}</td>
                  <td className="px-5 py-3 text-muted">{o.assignedTo.name}</td>
                  <td className="px-5 py-3">
                    <Badge variant={isReturned ? "neutral" : "ok"}>{isReturned ? "Returned" : "Completed"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${o.id}/edit`)}
                        disabled={isReturned}
                        title={isReturned ? "Returned orders are locked because stock was already reconciled on return." : "Edit order"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteOrder(o)}
                        disabled={isReturned}
                        title={isReturned ? "Returned orders are locked because stock was already reconciled on return." : "Delete order"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>

                      {!isReturned && (
                        <button
                          type="button"
                          onClick={() => setConfirmOrder(o)}
                          disabled={returnMutation.isPending}
                          title="Return order"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-ink transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Undo2 size={14} />
                          
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-muted">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {confirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-ink">Return Order?</h2>
              <p className="mt-2 text-sm text-muted">
                This will restore the jersey quantities and reverse the sales and profit generated by this order.
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-black/[0.02] p-4 text-sm text-muted">
              <div className="flex justify-between"><span>Order ID</span><span className="font-medium text-ink">{confirmOrder.orderNumber}</span></div>
              <div className="flex justify-between"><span>Customer</span><span className="font-medium text-ink">{confirmOrder.customer.name}</span></div>
              <div className="flex justify-between"><span>Phone</span><span className="font-medium text-ink">{confirmOrder.customer.phone}</span></div>
              <div className="flex justify-between"><span>Items</span><span className="font-medium text-ink">{confirmOrder.items.reduce((s: number, i: any) => s + i.quantity, 0)} pcs</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-medium text-ink">{formatMoney(confirmOrder.total)}</span></div>
              <div className="flex justify-between"><span>Assigned</span><span className="font-medium text-ink">{confirmOrder.assignedTo.name}</span></div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmOrder(null)} disabled={returnMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReturnConfirm}
                disabled={returnMutation.isPending}
              >
                {returnMutation.isPending ? "Returning..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-ink">Delete Order?</h2>
              <p className="mt-2 text-sm text-muted">
                This will restore stock and permanently remove this order. Continue?
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-black/[0.02] p-4 text-sm text-muted">
              <div className="flex justify-between"><span>Order ID</span><span className="font-medium text-ink">{deleteOrder.orderNumber}</span></div>
              <div className="flex justify-between"><span>Customer</span><span className="font-medium text-ink">{deleteOrder.customer.name}</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-medium text-ink">{formatMoney(deleteOrder.total)}</span></div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteOrder(null)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
