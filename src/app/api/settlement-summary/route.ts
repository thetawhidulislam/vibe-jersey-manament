import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getSettlementSummary } from "@/lib/settlement";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await getSettlementSummary());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}