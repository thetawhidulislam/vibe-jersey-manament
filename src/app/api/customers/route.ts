import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const customers = await prisma.customer.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
        : undefined,
      include: { orders: { select: { id: true, total: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });

    const withStats = customers.map((c) => {
      const activeOrders = c.orders.filter((o) => o.status !== "RETURNED");
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        totalOrders: activeOrders.length,
        totalSpent: activeOrders.reduce((sum, o) => sum + Number(o.total), 0),
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json(withStats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
