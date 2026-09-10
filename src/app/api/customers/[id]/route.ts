import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: { items: { include: { jersey: true } }, assignedTo: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const activeOrders = customer.orders.filter((o) => o.status !== "RETURNED");
    const totalJerseys = activeOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const totalSpent = activeOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return NextResponse.json({ ...customer, totalJerseys, totalSpent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
