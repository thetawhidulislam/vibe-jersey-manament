import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: params.id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("Order not found");
      }

      if (existing.status === "RETURNED") {
        throw new Error("Order has already been returned");
      }

      if (existing.status !== "COMPLETED") {
        throw new Error("This order cannot be returned");
      }

      await Promise.all(
        existing.items.map(async (item) => {
          const stockUpdate = await tx.jerseyStock.updateMany({
            where: { jerseyId: item.jerseyId, size: item.size },
            data: { quantity: { increment: item.quantity } },
          });

          if (stockUpdate.count === 0) {
            throw new Error(`Unable to restore stock for jersey ${item.jerseyId} (${item.size})`);
          }
        })
      );

      await tx.inventoryTransaction.createMany({
        data: existing.items.map((item) => ({
          jerseyId: item.jerseyId,
          size: item.size,
          quantity: item.quantity,
          type: "RETURN",
          referenceId: existing.id,
        })),
      });

      return tx.order.update({
        where: { id: params.id },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          returnedById: admin.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Order returned successfully",
      data: { orderId: order.id },
    });
  } catch (err: any) {
    const message = err?.message || "Failed to return order";
    const status =
      message === "UNAUTHORIZED" || message === "FORBIDDEN"
        ? 401
        : message === "Order not found"
          ? 404
          : 400;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
