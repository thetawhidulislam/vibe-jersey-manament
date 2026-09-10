import { OrderForm } from "@/components/order/order-form";

export default function AddOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Add Order</h1>
        <p className="text-sm text-muted">Order is completed automatically on creation — stock, sales, and profit update instantly.</p>
      </div>
      <OrderForm />
    </div>
  );
}
