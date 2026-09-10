"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataForm } from "@/components/data/data-form";
import { DataTable, type DataColumn } from "@/components/data/data-table";
import { SummaryTotals } from "@/components/data/summary-totals";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useEntries } from "@/lib/use-entries";
import type { EntryField } from "@/lib/validations/entry";

type MemberBalance = { id: string; name: string; totalCollected: number; totalDeposited: number; currentBalance: number };
type Deposit = { id: string; memberId: string; amount: number; date: string; note?: string };
const today = () => new Date().toISOString().slice(0, 10);

export default function SettlementPage() {
  const queryClient = useQueryClient();
  const { data: summary = [], isLoading: summaryLoading } = useQuery<MemberBalance[]>({ queryKey: ["/api/settlement-summary"], queryFn: async () => { const response = await fetch("/api/settlement-summary"); if (!response.ok) throw new Error("Failed to load balances"); return response.json(); } });
  const { data: deposits = [], isLoading, save, remove } = useEntries<Deposit>("/api/deposits");
  const [editing, setEditing] = useState<Deposit | null>(null);
  const [settlingMember, setSettlingMember] = useState<MemberBalance | null>(null);
  const memberById = new Map(summary.map((member) => [member.id, member]));
  const fields: EntryField[] = [
    { name: "date", label: "Date", type: "date", required: true },
    ...(settlingMember
      ? [{ name: "memberId", label: "Member", type: "text" as const, required: true, readOnly: true }]
      : [{ name: "memberId", label: "Member", type: "select" as const, required: true, options: summary.map((member) => ({ value: member.id, label: member.name })) }]),
    { name: "amount", label: "Amount (tk)", type: "number", step: "0.01", required: true, readOnly: Boolean(settlingMember) },
    { name: "note", label: "Note (optional)", type: "text" },
  ];
  const initialValues = editing
    ? { date: editing.date.slice(0, 10), memberId: editing.memberId, amount: editing.amount, note: editing.note || "" }
    : { date: today(), memberId: settlingMember?.id || "", amount: settlingMember?.currentBalance || 0, note: "" };

  async function submit(values: Record<string, string | number>) {
    await save({ id: editing?.id, values });
    await queryClient.invalidateQueries({ queryKey: ["/api/settlement-summary"] });
    setEditing(null);
    setSettlingMember(null);
    toast.success(editing ? "Deposit updated" : "Balance settled");
  }
  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this deposit?")) return;
    await remove(id);
    await queryClient.invalidateQueries({ queryKey: ["/api/settlement-summary"] });
    toast.success("Deposit deleted");
  }
  const columns: DataColumn<Deposit>[] = [
    { key: "date", label: "Date", format: (value) => formatDate(String(value)) },
    { key: "memberId", label: "Member", format: (value) => memberById.get(String(value))?.name || "Unknown member" },
    { key: "amount", label: "Amount", format: (value) => formatCurrency(Number(value)) },
    { key: "note", label: "Note" },
  ];
  const grandTotal = summary.reduce((total, member) => total + member.currentBalance, 0);

  return <div className="max-w-5xl space-y-6">
    <div><h1 className="font-display text-4xl font-semibold text-ink">Member Settlements</h1><p className="text-sm text-muted">Track cash collected by members and deposited to the admin.</p></div>
    <SummaryTotals totals={[{ label: "Grand Total Owed", value: grandTotal }]} />
    <Card><CardHeader><CardTitle>Member Balances</CardTitle></CardHeader><CardContent className="space-y-3">
      {summaryLoading ? <p className="text-sm text-muted">Loading...</p> : summary.map((member) => <div key={member.id} className="grid gap-3 border-b border-border pb-3 last:border-0 last:pb-0 sm:grid-cols-[1.3fr_1fr_1fr_1fr_auto] sm:items-center">
        <div className="font-medium text-ink">{member.name}</div><div><div className="text-xs text-muted">Collected</div><div>{formatCurrency(member.totalCollected)}</div></div><div><div className="text-xs text-muted">Deposited</div><div>{formatCurrency(member.totalDeposited)}</div></div><div><div className="text-xs text-muted">Balance</div><div className="font-semibold text-ink">{formatCurrency(member.currentBalance)}</div></div>
        {member.currentBalance > 0 ? <Button size="sm" variant="secondary" onClick={() => { setEditing(null); setSettlingMember(member); }}>Settle</Button> : <span />}
      </div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{settlingMember ? `Settle ${settlingMember.name}` : editing ? "Edit Deposit" : "Add Deposit"}</CardTitle></CardHeader><CardContent><DataForm fields={fields} initialValues={initialValues} onSubmit={submit} submitLabel={settlingMember ? "Confirm settlement" : editing ? "Update deposit" : "Add deposit"} /></CardContent></Card>
    <Card className="overflow-hidden"><CardHeader><CardTitle>Deposit Entries</CardTitle></CardHeader>{isLoading ? <CardContent className="text-sm text-muted">Loading...</CardContent> : <DataTable columns={columns} rows={deposits} onEdit={(deposit) => { setSettlingMember(null); setEditing(deposit); }} onDelete={deleteEntry} />}</Card>
  </div>;
}