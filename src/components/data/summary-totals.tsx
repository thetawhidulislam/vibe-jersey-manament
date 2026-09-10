import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function SummaryTotals({ totals }: { totals: { label: string; value: number }[] }) {
  return <Card><CardHeader><CardTitle>Totals</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
    {totals.map((total, index) => <div key={total.label} className={`flex justify-between ${index === totals.length - 1 ? "border-t border-border pt-2 text-base font-semibold text-ink" : "text-muted"}`}><span>{total.label}</span><span>{formatCurrency(total.value)}</span></div>)}
  </CardContent></Card>;
}