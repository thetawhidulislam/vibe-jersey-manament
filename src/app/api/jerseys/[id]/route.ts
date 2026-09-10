import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { jerseySchema } from "@/lib/validations/jersey";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const jersey = await prisma.jersey.findUnique({
      where: { id: params.id },
      include: { stocks: true },
    });
    if (!jersey) return NextResponse.json({ error: "Jersey not found" }, { status: 404 });
    return NextResponse.json(jersey);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const body = await req.json();
    const parsed = jerseySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    // 1. Batch-read existing stock rows for this jersey once, outside the transaction,
    //    instead of one findUnique per size inside it.
    const existingStocks = await prisma.jerseyStock.findMany({ where: { jerseyId: params.id } });
    const beforeBySize = new Map(existingStocks.map((s) => [s.size, s.quantity]));

    const inventoryLogs = data.stocks
      .map((s) => ({ size: s.size, diff: s.quantity - (beforeBySize.get(s.size) ?? 0) }))
      .filter((s) => s.diff !== 0)
      .map((s) => ({
        jerseyId: params.id,
        size: s.size,
        quantity: s.diff,
        type: "ADJUSTMENT",
      }));

    // 2. The transaction now only does writes, run in parallel, so it finishes fast
    //    instead of doing find→upsert→create sequentially per size.
    const jersey = await prisma.$transaction(
      async (tx) => {
        await Promise.all([
          tx.jersey.update({
            where: { id: params.id },
            data: {
              name: data.name,
              team: data.team,
              season: data.season,
              description: data.description,
              image: data.image,
              buyingPrice: data.buyingPrice,
              sellingPrice: data.sellingPrice,
              status: data.status,
            },
          }),
          ...data.stocks.map((s) =>
            tx.jerseyStock.upsert({
              where: { jerseyId_size: { jerseyId: params.id, size: s.size } },
              update: { quantity: s.quantity },
              create: { jerseyId: params.id, size: s.size, quantity: s.quantity },
            })
          ),
        ]);

        if (inventoryLogs.length > 0) {
          await tx.inventoryTransaction.createMany({ data: inventoryLogs });
        }

        return tx.jersey.findUnique({ where: { id: params.id }, include: { stocks: true } });
      },
      { timeout: 15000 } // safety net; the transaction itself should now take well under 1s
    );

    return NextResponse.json(jersey);
  } catch (err: any) {
    const status = err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admin can delete jerseys" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.jerseyStock.deleteMany({ where: { jerseyId: params.id } });
      await tx.inventoryTransaction.deleteMany({ where: { jerseyId: params.id } });
      await tx.jersey.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err.code === "P2003" || err.message?.includes("23001")) {
      return NextResponse.json(
        { error: "This jersey can't be deleted because it's used in existing orders." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
