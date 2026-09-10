"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney, formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

async function fetchCustomers(q: string) {
  const res = await fetch(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  if (!res.ok) throw new Error("Failed to load customers");
  return res.json();
}

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["customers", query], queryFn: () => fetchCustomers(query) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">Customers</h1>
        <p className="text-sm text-muted">Everyone who has ever ordered from Vibe Athletics.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input className="pl-9" placeholder="Search name or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Total Spent</th>
              <th className="px-5 py-3 font-medium">Customer Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-muted">Loading…</td>
              </tr>
            )}
            {data?.map((c: any) => (
              <tr key={c.id} className="hover:bg-black/[0.015]">
                <td className="px-5 py-3">
                  <Link href={`/customers/${c.id}`} className="font-medium text-ink hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted">{c.phone}</td>
                <td className="px-5 py-3 text-muted">{c.totalOrders}</td>
                <td className="px-5 py-3 font-medium text-ink">{formatMoney(c.totalSpent)}</td>
                <td className="px-5 py-3 text-muted">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
