import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { jerseySchema } from "@/lib/validations/jersey";

export async function GET() {
  try {
    await requireUser();
    const jerseys = await prisma.jersey.findMany({
      include: { stocks: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jerseys);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const body = await req.json();
    const parsed = jerseySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const jersey = await prisma.jersey.create({
      data: {
        name: data.name,
        team: data.team,
        season: data.season,
        description: data.description,
        image: data.image,
        buyingPrice: data.buyingPrice,
        sellingPrice: data.sellingPrice,
        status: data.status,
        stocks: {
          create: data.stocks.map((s) => ({ size: s.size, quantity: s.quantity })),
        },
      },
      include: { stocks: true },
    });

    // log initial stock-in transactions
    await prisma.inventoryTransaction.createMany({
      data: data.stocks
        .filter((s) => s.quantity > 0)
        .map((s) => ({
          jerseyId: jersey.id,
          size: s.size,
          quantity: s.quantity,
          type: "STOCK_IN",
        })),
    });

    return NextResponse.json(jersey, { status: 201 });
  } catch (err: any) {
    const status = err.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
