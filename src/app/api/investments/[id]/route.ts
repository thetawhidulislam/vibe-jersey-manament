import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCrudHandlers } from "@/lib/crud-handlers";
import { investmentSchema } from "@/lib/validations/entry";

const handlers = createCrudHandlers(prisma.investment as any, (body) => { const parsed = investmentSchema.safeParse(body); return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.flatten() }; });
export async function PUT(request: Request, { params }: { params: { id: string } }) { try { const result = await handlers.update(request, params.id); return result instanceof NextResponse ? result : NextResponse.json(result); } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); } }
export async function DELETE(_request: Request, { params }: { params: { id: string } }) { try { return NextResponse.json(await handlers.remove(params.id)); } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }); } }