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

type Cost = { id: string; itemName: string; quantity: number; amount: number; date: string; note?: string };
const today = () => new Date().toISOString().slice(0, 10);
const fields: EntryField[] = [
  { name: "date", label: "Date", type: "date", required: true },
  { name: "itemName", label: "Item name", type: "text", required: true },
  { name: "quantity", label: "Quantity", type: "number", required: true },
  { name: "amount", label: "Total cost (tk)", type: "number", step: "0.01", required: true },
  { name: "note", label: "Note (optional)", type: "text" },
];
const columns: DataColumn<Cost>[] = [
  { key: "date", label: "Date", format: (value) => formatDate(String(value)) },
  { key: "itemName", label: "Item" },
  { key: "quantity", label: "Quantity", format: (value) => `${value} pcs` },
  { key: "amount", label: "Total cost", format: (value) => formatCurrency(Number(value)) },
  { key: "note", label: "Note" },
];

export default function CostPage() {
  const { data = [], isLoading, save, remove } = useEntries<Cost>("/api/costs");
  const [editing, setEditing] = useState<Cost | null>(null);
  const initialValues = editing ? { date: editing.date.slice(0, 10), itemName: editing.itemName, quantity: editing.quantity, amount: editing.amount, note: editing.note || "" } : { date: today(), itemName: "", quantity: 1, amount: 0, note: "" };
  async function submit(values: Record<string, string | number>) { await save({ id: editing?.id, values }); setEditing(null); toast.success(editing ? "Cost updated" : "Cost added"); }
  async function deleteEntry(id: string) { if (!window.confirm("Delete this cost entry?")) return; await remove(id); toast.success("Cost deleted"); }
  return <div className="max-w-5xl space-y-6">
    <div><h1 className="font-display text-4xl font-semibold text-ink">Total Cost</h1><p className="text-sm text-muted">Record stock purchases. Amount is the total cost for each entry.</p></div>
    <Card><CardHeader><CardTitle>{editing ? "Edit Cost Entry" : "Add Cost Entry"}</CardTitle></CardHeader><CardContent><DataForm fields={fields} initialValues={initialValues} onSubmit={submit} submitLabel={editing ? "Update cost" : "Add cost"} /></CardContent></Card>
    <Card className="overflow-hidden"><CardHeader><CardTitle>Cost Entries</CardTitle></CardHeader>{isLoading ? <CardContent className="text-sm text-muted">Loading...</CardContent> : <DataTable columns={columns} rows={data} onEdit={setEditing} onDelete={deleteEntry} />}</Card>
    <SummaryTotals totals={[{ label: "Grand Total", value: sumBy(data, "amount") }]} />
  </div>;
}