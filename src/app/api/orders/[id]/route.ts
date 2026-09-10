import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { createOrderSchema } from "@/lib/validations/order";
import { reconcileStockForOrderEdit, type StockItem } from "@/lib/order-stock";

function mergeOrderItems(items: { jerseyId: string; size: string; quantity: number }[]): StockItem[] {
  const merged = new Map<string, StockItem>();
  for (const item of items) {
    const key = `${item.jerseyId}::${item.size}`;
    const existing = merged.get(key);
    merged.set(key, {
      jerseyId: item.jerseyId,
      size: item.size,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }
  return [...merged.values()];
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { customer: true, assignedTo: true, items: { include: { jersey: true } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: params.id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("Order not found");
      }

      if (existing.status === "RETURNED") {
        throw new Error("Returned orders cannot be edited. The stock has already been reconciled on return.");
      }

      const oldItems = mergeOrderItems(
        existing.items.map((item) => ({
          jerseyId: item.jerseyId,
          size: item.size,
          quantity: item.quantity,
        })),
      );
      const newItems = mergeOrderItems(data.items);
      const delta = reconcileStockForOrderEdit(oldItems, newItems);

      const jerseyIds = [...new Set([...newItems.map((i) => i.jerseyId), ...oldItems.map((i) => i.jerseyId)])];
      const jerseys = await tx.jersey.findMany({
        where: { id: { in: jerseyIds } },
      });
      const jerseyMap = new Map(jerseys.map((j) => [j.id, j]));

      const stockKeys = [...new Set([...delta.toDeduct.map((i) => `${i.jerseyId}::${i.size}`), ...delta.toRestore.map((i) => `${i.jerseyId}::${i.size}`)])];
      const stocks = await tx.jerseyStock.findMany({
        where: {
          OR: stockKeys.map((key) => {
            const [jerseyId, size] = key.split("::");
            return { jerseyId, size };
          }),
        },
      });
      const stockMap = new Map(stocks.map((stock) => [`${stock.jerseyId}::${stock.size}`, stock]));

      for (const item of delta.toDeduct) {
        const stock = stockMap.get(`${item.jerseyId}::${item.size}`);
        if (!stock || stock.quantity < item.quantity) {
          throw new Error(`Not enough stock for size ${item.size}. Available: ${stock?.quantity ?? 0}`);
        }
      }

      const customer = await tx.customer.upsert({
        where: { phone: data.customerPhone },
        update: { name: data.customerName, address: data.customerAddress },
        create: {
          name: data.customerName,
          phone: data.customerPhone,
          address: data.customerAddress,
        },
      });

      await Promise.all(
        delta.toRestore.map((item) =>
          tx.jerseyStock.updateMany({
            where: { jerseyId: item.jerseyId, size: item.size },
            data: { quantity: { increment: item.quantity } },
          }),
        ),
      );

      await Promise.all(
        delta.toDeduct.map((item) =>
          tx.jerseyStock.updateMany({
            where: { jerseyId: item.jerseyId, size: item.size, quantity: { gte: item.quantity } },
            data: { quantity: { decrement: item.quantity } },
          }),
        ),
      );

      const mergedNewItems = mergeOrderItems(data.items);
      let subtotal = 0;
      const itemCreateData = mergedNewItems.map((item) => {
        const jersey = jerseyMap.get(item.jerseyId);
        if (!jersey) {
          throw new Error(`Jersey not found for ${item.jerseyId}`);
        }
        const totalPrice = Number(jersey.sellingPrice) * item.quantity;
        subtotal += totalPrice;
        return {
          jerseyId: item.jerseyId,
          size: item.size,
          quantity: item.quantity,
          buyingPrice: jersey.buyingPrice,
          sellingPrice: jersey.sellingPrice,
          totalPrice,
        };
      });

      const total = subtotal + data.deliveryCharge - data.discount;

      await tx.orderItem.deleteMany({ where: { orderId: existing.id } });

      await tx.inventoryTransaction.createMany({
        data: [
          ...delta.toRestore.map((item) => ({
            jerseyId: item.jerseyId,
            size: item.size,
            quantity: item.quantity,
            type: "ADJUSTMENT",
            referenceId: existing.id,
          })),
          ...delta.toDeduct.map((item) => ({
            jerseyId: item.jerseyId,
            size: item.size,
            quantity: item.quantity,
            type: "ADJUSTMENT",
            referenceId: existing.id,
          })),
        ],
      });

      return tx.order.update({
        where: { id: existing.id },
        data: {
          customerId: customer.id,
          assignedToId: data.assignedToId,
          subtotal,
          deliveryCharge: data.deliveryCharge,
          discount: data.discount,
          total,
          status: "COMPLETED",
          returnedAt: null,
          returnedById: null,
          items: { create: itemCreateData },
        },
        include: {
          customer: true,
          assignedTo: true,
          items: { include: { jersey: true } },
        },
      });
    });

    return NextResponse.json(order);
  } catch (err: any) {
    const message = err?.message || "Failed to update order";
    const status =
      message === "UNAUTHORIZED" || message === "FORBIDDEN"
        ? 401
        : message === "Order not found"
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: params.id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("Order not found");
      }

      if (existing.status === "RETURNED") {
        // The return flow already restored stock. Deleting the order must not double-restore it.
        await tx.inventoryTransaction.createMany({
          data: existing.items.map((item) => ({
            jerseyId: item.jerseyId,
            size: item.size,
            quantity: 0,
            type: "ORDER_DELETED",
            referenceId: existing.id,
          })),
        });
        return tx.order.delete({
          where: { id: existing.id },
          include: { items: true, customer: true, assignedTo: true },
        });
      }

      const stockUpdates = await Promise.all(
        existing.items.map((item) =>
          tx.jerseyStock.updateMany({
            where: { jerseyId: item.jerseyId, size: item.size },
            data: { quantity: { increment: item.quantity } },
          }),
        ),
      );

      const failedUpdate = stockUpdates.find((result) => result.count === 0);
      if (failedUpdate) {
        throw new Error("Unable to restore stock for one or more items");
      }

      await tx.inventoryTransaction.createMany({
        data: existing.items.map((item) => ({
          jerseyId: item.jerseyId,
          size: item.size,
          quantity: item.quantity,
          type: "ORDER_DELETED",
          referenceId: existing.id,
        })),
      });

      return tx.order.delete({
        where: { id: existing.id },
        include: { items: true, customer: true, assignedTo: true },
      });
    });

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    const message = err?.message || "Failed to delete order";
    const status =
      message === "UNAUTHORIZED" || message === "FORBIDDEN"
        ? 401
        : message === "Order not found"
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
