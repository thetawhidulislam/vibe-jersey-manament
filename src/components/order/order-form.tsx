"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

async function fetchJerseys() {
  const res = await fetch("/api/jerseys");
  if (!res.ok) throw new Error("Failed to load jerseys");
  return res.json();
}

async function fetchMembers() {
  const res = await fetch("/api/team-members");
  if (!res.ok) throw new Error("Failed to load team members");
  return res.json();
}

type OrderFormProps = {
  mode?: "create" | "edit";
  orderId?: string;
  initialData?: Partial<CreateOrderInput> | null;
};

export function OrderForm({ mode = "create", orderId, initialData }: OrderFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { data: jerseys } = useQuery({ queryKey: ["jerseys"], queryFn: fetchJerseys });
  const { data: members } = useQuery({ queryKey: ["team-members"], queryFn: fetchMembers });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      assignedToId: "",
      items: [{ jerseyId: "", size: "", quantity: 1 }],
      deliveryCharge: 0,
      discount: 0,
    },
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      reset({
        customerName: initialData.customerName ?? "",
        customerPhone: initialData.customerPhone ?? "",
        customerAddress: initialData.customerAddress ?? "",
        assignedToId: initialData.assignedToId ?? "",
        items: (initialData.items ?? [{ jerseyId: "", size: "", quantity: 1 }]).map((item) => ({
          jerseyId: item.jerseyId,
          size: item.size,
          quantity: item.quantity,
        })),
        deliveryCharge: Number(initialData.deliveryCharge ?? 0),
        discount: Number(initialData.discount ?? 0),
      });
    }
  }, [mode, initialData, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const deliveryCharge = watch("deliveryCharge") || 0;
  const discount = watch("discount") || 0;

  const jerseyMap: Record<string, any> = {};
  (jerseys || []).forEach((j: any) => (jerseyMap[j.id] = j));

  const subtotal = (watchedItems || []).reduce((sum, item) => {
    const jersey = jerseyMap[item.jerseyId];
    if (!jersey || !item.quantity) return sum;
    return sum + Number(jersey.sellingPrice) * item.quantity;
  }, 0);
  const grandTotal = subtotal + Number(deliveryCharge) - Number(discount);

  async function onSubmit(data: CreateOrderInput) {
    setSubmitting(true);
    try {
      const url = mode === "edit" && orderId ? `/api/orders/${orderId}` : "/api/orders";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : payload.message || `Could not ${mode === "edit" ? "update" : "create"} order`);
      }
      const order = payload;
      toast.success(mode === "edit" ? `Order ${order.orderNumber} updated` : `Order ${order.orderNumber} created`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["jerseys"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
      router.push(`/orders/${order.id ?? orderId}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Customer Name</Label>
              <Input {...register("customerName")} placeholder="Rahim" />
              {errors.customerName && <p className="mt-1 text-xs text-danger">{errors.customerName.message}</p>}
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input {...register("customerPhone")} placeholder="018XXXXXXXX" />
              {errors.customerPhone && <p className="mt-1 text-xs text-danger">{errors.customerPhone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label>Address (optional)</Label>
              <Input {...register("customerAddress")} placeholder="Feni" />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select {...register("assignedToId")}>
                <option value="">Select member</option>
                {members?.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              {errors.assignedToId && <p className="mt-1 text-xs text-danger">{errors.assignedToId.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Jersey Selection</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ jerseyId: "", size: "", quantity: 1 })}
            >
              <Plus size={14} /> Add item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const selectedJerseyId = watchedItems?.[index]?.jerseyId;
              const selectedJersey = jerseyMap[selectedJerseyId];
              return (
                <div key={field.id} className="grid grid-cols-12 items-end gap-3 rounded-xl border border-border p-3">
                  <div className="col-span-5">
                    <Label>Jersey</Label>
                    <Select {...register(`items.${index}.jerseyId` as const)}>
                      <option value="">Select jersey</option>
                      {jerseys?.map((j: any) => (
                        <option key={j.id} value={j.id}>
                          {j.team} — {j.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label>Size</Label>
                    <Select {...register(`items.${index}.size` as const)}>
                      <option value="">Size</option>
                      {selectedJersey?.stocks.map((s: any) => (
                        <option key={s.size} value={s.size} disabled={s.quantity === 0}>
                          {s.size} ({s.quantity} left)
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-span-1 text-sm text-muted">
                    {selectedJersey ? formatMoney(Number(selectedJersey.sellingPrice) * (watchedItems?.[index]?.quantity || 0)) : "—"}
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 size={16} className="text-danger" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {errors.items && <p className="text-xs text-danger">{errors.items.message as string}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Delivery Charge (৳)</Label>
              <Input type="number" step="0.01" {...register("deliveryCharge", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Discount (৳)</Label>
              <Input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span>{formatMoney(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span>-{formatMoney(discount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                <span>Grand Total</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
            </div>
            <Button type="submit" variant="secondary" className="w-full" disabled={submitting}>
              {submitting ? (mode === "edit" ? "Updating order..." : "Creating order...") : (mode === "edit" ? "Update Order" : "Create Order")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
