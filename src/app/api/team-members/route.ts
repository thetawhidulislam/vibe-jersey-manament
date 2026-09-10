import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();
    const members = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(members);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
