"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

async function fetchJerseys() {
  const res = await fetch("/api/jerseys");
  if (!res.ok) throw new Error("Failed to load jerseys");
  return res.json();
}

export default function JerseysPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["jerseys"], queryFn: fetchJerseys });

  const deleteMutation = useMutation({
    mutationFn: async (jerseyId: string) => {
      const res = await fetch(`/api/jerseys/${jerseyId}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Failed to delete jersey");
      return payload;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      toast.success("Jersey deleted permanently");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to delete jersey");
    },
  });

  const handleDelete = (jersey: any) => {
    toast(`Delete ${jersey.name}?`, {
      description: "This action permanently removes the jersey and its stock records.",
      action: {
        label: "Delete permanently",
        onClick: () => deleteMutation.mutate(jersey.id),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">Jerseys</h1>
          <p className="text-sm text-muted">Manage your catalog and stock.</p>
        </div>
        <Link href="/jerseys/add">
          <Button variant="secondary">
            <Plus size={16} /> Add Jersey
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Jersey</th>
              <th className="px-5 py-3 font-medium">Team</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Buying</th>
              <th className="px-5 py-3 font-medium">Selling</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data?.map((j: any) => {
              const totalStock = j.stocks.reduce((s: number, x: any) => s + x.quantity, 0);
              const outOfStock = totalStock === 0;
              const lowStock = !outOfStock && totalStock <= 15;
              return (
                <tr key={j.id} className="hover:bg-black/[0.015]">
                  <td className="px-5 py-3 font-medium text-ink">{j.name}</td>
                  <td className="px-5 py-3 text-muted">{j.team}</td>
                  <td className="px-5 py-3">
                    {outOfStock ? (
                      <Badge variant="danger">Out of stock</Badge>
                    ) : lowStock ? (
                      <Badge variant="warn">{totalStock} pcs · Low</Badge>
                    ) : (
                      <Badge variant="ok">{totalStock} pcs</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">{formatMoney(j.buyingPrice)}</td>
                  <td className="px-5 py-3 text-muted">{formatMoney(j.sellingPrice)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={j.status ? "ok" : "neutral"}>{j.status ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/jerseys/${j.id}/edit`}>
                        <Button variant="ghost" size="sm" aria-label={`Edit ${j.name}`}>
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${j.name}`}
                        className="text-danger hover:bg-danger/10"
                        onClick={() => handleDelete(j)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  No jerseys yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
