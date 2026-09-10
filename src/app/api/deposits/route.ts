import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCrudHandlers } from "@/lib/crud-handlers";
import { depositSchema } from "@/lib/validations/entry";

const handlers = createCrudHandlers(prisma.deposit as any, (body) => {
  const parsed = depositSchema.safeParse(body);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.flatten() };
});

export async function GET() { try { return NextResponse.json(await handlers.list()); } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 401 }); } }
export async function POST(request: Request) { try { const result = await handlers.create(request); return result instanceof NextResponse ? result : NextResponse.json(result, { status: 201 }); } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); } }