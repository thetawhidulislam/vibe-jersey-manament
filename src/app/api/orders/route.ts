import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createOrderSchema } from "@/lib/validations/order";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const orders = await prisma.order.findMany({
      where: q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
              { customer: { phone: { contains: q } } },
            ],
          }
        : undefined,
      include: {
        customer: true,
        assignedTo: true,
        items: { include: { jersey: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Merge duplicate (jerseyId, size) rows so we check/deduct total quantity once per line
    const merged = new Map<
      string,
      { jerseyId: string; size: string; quantity: number }
    >();
    for (const item of data.items) {
      const key = `${item.jerseyId}::${item.size}`;
      const existing = merged.get(key);
      merged.set(key, {
        jerseyId: item.jerseyId,
        size: item.size,
        quantity: (existing?.quantity ?? 0) + item.quantity,
      });
    }
    const mergedItems = [...merged.values()];
    const jerseyIds = [...new Set(mergedItems.map((i) => i.jerseyId))];

    // 1. Batch-fetch everything we need in 2 queries instead of N sequential ones per item.
    //    This is just for a fast pre-check with a friendly error message; the real,
    //    race-safe check happens via the conditional update inside the transaction below.
    const [stocks, jerseys] = await Promise.all([
      prisma.jerseyStock.findMany({
        where: {
          jerseyId: { in: jerseyIds },
          size: { in: mergedItems.map((i) => i.size) },
        },
      }),
      prisma.jersey.findMany({ where: { id: { in: jerseyIds } } }),
    ]);

    const jerseyById = new Map(jerseys.map((j) => [j.id, j]));
    const stockByKey = new Map(
      stocks.map((s) => [`${s.jerseyId}::${s.size}`, s]),
    );

    let subtotal = 0;
    const itemsToCreate: {
      jerseyId: string;
      size: string;
      quantity: number;
      buyingPrice: any;
      sellingPrice: any;
      totalPrice: number;
    }[] = [];
    for (const item of mergedItems) {
      const jersey = jerseyById.get(item.jerseyId);
      if (!jersey) throw new Error("Jersey not found");

      const stock = stockByKey.get(`${item.jerseyId}::${item.size}`);
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(
          `Not enough stock for size ${item.size}. Available: ${stock?.quantity ?? 0}`,
        );
      }

      const totalPrice = Number(jersey.sellingPrice) * item.quantity;
      subtotal += totalPrice;
      itemsToCreate.push({
        jerseyId: item.jerseyId,
        size: item.size,
        quantity: item.quantity,
        buyingPrice: jersey.buyingPrice,
        sellingPrice: jersey.sellingPrice,
        totalPrice,
      });
    }

    const total = subtotal + data.deliveryCharge - data.discount;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now()
      .toString()
      .slice(-4)}`;

    // 2. The transaction now only does writes, run in parallel where possible,
    //    so it finishes in a handful of round-trips instead of 4-per-item.
    const order = await prisma.$transaction(
      async (tx) => {
        const customer = await tx.customer.upsert({
          where: { phone: data.customerPhone },
          update: { name: data.customerName, address: data.customerAddress },
          create: {
            name: data.customerName,
            phone: data.customerPhone,
            address: data.customerAddress,
          },
        });

        // Conditional decrement (quantity >= requested) — atomic and race-safe even if
        // two orders for the same last unit land at the same time. If another order beat
        // us to the stock between our pre-check above and now, updatedCount is 0 and we bail.
        const updates = await Promise.all(
          mergedItems.map((item) =>
            tx.jerseyStock.updateMany({
              where: {
                jerseyId: item.jerseyId,
                size: item.size,
                quantity: { gte: item.quantity },
              },
              data: { quantity: { decrement: item.quantity } },
            }),
          ),
        );
        const shortIndex = updates.findIndex((u) => u.count === 0);
        if (shortIndex !== -1) {
          const short = mergedItems[shortIndex];
          throw new Error(
            `Not enough stock for size ${short.size} — someone else just bought the last units.`,
          );
        }

        await tx.inventoryTransaction.createMany({
          data: mergedItems.map((item) => ({
            jerseyId: item.jerseyId,
            size: item.size,
            quantity: item.quantity,
            type: "SALE",
          })),
        });

        return tx.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            assignedToId: data.assignedToId,
            subtotal,
            deliveryCharge: data.deliveryCharge,
            discount: data.discount,
            total,
            status: "COMPLETED",
            items: { create: itemsToCreate },
          },
          include: {
            items: { include: { jersey: true } },
            customer: true,
            assignedTo: true,
          },
        });
      },
      { timeout: 15000 }, // safety net; the transaction itself should now take well under 1s
    );

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    const status = err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
