"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DataColumn<T> = { key: keyof T; label: string; format?: (value: T[keyof T], row: T) => string };

export function DataTable<T extends { id: string }>({
  columns, rows, onEdit, onDelete,
}: { columns: DataColumn<T>[]; rows: T[]; onEdit: (row: T) => void; onDelete: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-sm">
        <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-muted"><tr>
          {columns.map((column) => <th key={String(column.key)} className="px-5 py-3 font-medium">{column.label}</th>)}
          <th className="px-5 py-3 text-right font-medium">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => <tr key={row.id} className="hover:bg-black/[0.015]">
            {columns.map((column) => <td key={String(column.key)} className="px-5 py-3 text-muted">{column.format ? column.format(row[column.key], row) : String(row[column.key] ?? "-")}</td>)}
            <td className="px-5 py-3 text-right"><div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" aria-label="Edit entry" onClick={() => onEdit(row)}><Pencil size={14} /></Button>
              <Button variant="ghost" size="sm" aria-label="Delete entry" className="text-danger hover:bg-danger/10" onClick={() => onDelete(row.id)}><Trash2 size={14} /></Button>
            </div></td>
          </tr>)}
          {rows.length === 0 && <tr><td colSpan={columns.length + 1} className="px-5 py-8 text-center text-muted">No entries yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}