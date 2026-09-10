"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataForm } from "@/components/data/data-form";
import { DataTable, type DataColumn } from "@/components/data/data-table";
import { SummaryTotals } from "@/components/data/summary-totals";
import { formatCurrency, formatDate, sumBy } from "@/lib/utils";
import { useEntries } from "@/lib/use-entries";
import type { EntryField } from "@/lib/validations/entry";

type Investment = { id: string; investor: string; amount: number; date: string; note?: string };
const today = () => new Date().toISOString().slice(0, 10);
const fields: EntryField[] = [
  { name: "date", label: "Date", type: "date", required: true },
  { name: "investor", label: "Investor", type: "select", required: true, options: [{ value: "TAWHID", label: "Tawhid" }, { value: "OVI", label: "Ovi" }, { value: "RABBI", label: "Rabbi" }] },
  { name: "amount", label: "Amount (tk)", type: "number", step: "0.01", required: true },
  { name: "note", label: "Note (optional)", type: "text" },
];
const columns: DataColumn<Investment>[] = [
  { key: "date", label: "Date", format: (value) => formatDate(String(value)) },
  { key: "investor", label: "Investor", format: (value) => String(value).toLowerCase().replace(/^./, (char) => char.toUpperCase()) },
  { key: "amount", label: "Amount", format: (value) => formatCurrency(Number(value)) },
  { key: "note", label: "Note" },
];

export default function InvestPage() {
  const { data = [], isLoading, save, remove } = useEntries<Investment>("/api/investments");
  const [editing, setEditing] = useState<Investment | null>(null);
  const initialValues = editing ? { date: editing.date.slice(0, 10), investor: editing.investor, amount: editing.amount, note: editing.note || "" } : { date: today(), investor: "", amount: 0, note: "" };
  async function submit(values: Record<string, string | number>) { await save({ id: editing?.id, values }); setEditing(null); toast.success(editing ? "Investment updated" : "Investment added"); }
  async function deleteEntry(id: string) { if (!window.confirm("Delete this investment?")) return; await remove(id); toast.success("Investment deleted"); }
  const totals = ["TAWHID", "OVI", "RABBI"].map((investor) => ({ label: investor[0] + investor.slice(1).toLowerCase(), value: sumBy(data.filter((entry) => entry.investor === investor), "amount") }));
  totals.push({ label: "Grand Total", value: sumBy(data, "amount") });
  return <div className="max-w-5xl space-y-6">
    <div><h1 className="font-display text-4xl font-semibold text-ink">Total Invest</h1><p className="text-sm text-muted">Track every partner investment separately.</p></div>
    <Card><CardHeader><CardTitle>{editing ? "Edit Investment" : "Add Investment"}</CardTitle></CardHeader><CardContent><DataForm fields={fields} initialValues={initialValues} onSubmit={submit} submitLabel={editing ? "Update investment" : "Add investment"} /></CardContent></Card>
    <Card className="overflow-hidden"><CardHeader><CardTitle>Investment Entries</CardTitle></CardHeader>{isLoading ? <CardContent className="text-sm text-muted">Loading...</CardContent> : <DataTable columns={columns} rows={data} onEdit={setEditing} onDelete={deleteEntry} />}</Card>
    <SummaryTotals totals={totals} />
  </div>;
}