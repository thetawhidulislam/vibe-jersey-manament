import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

type CrudModel = {
  findMany: (args: unknown) => Promise<unknown[]>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

export function createCrudHandlers(model: CrudModel, parse: (body: unknown) => { success: true; data: Record<string, unknown> } | { success: false; error: unknown }) {
  return {
    async list() { await requireUser(); return model.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }); },
    async create(request: Request) { await requireUser(); const parsed = parse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 }); return model.create({ data: parsed.data }); },
    async update(request: Request, id: string) { await requireUser(); const parsed = parse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 }); return model.update({ where: { id }, data: parsed.data }); },
    async remove(id: string) { await requireUser(); await model.delete({ where: { id } }); return { success: true }; },
  };
}