import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "volt" | "flame" | "ink";
  subtitle?: string;
}

const accentMap = {
  volt: "bg-volt/25 text-ink",
  flame: "bg-flame/10 text-flame",
  ink: "bg-ink/5 text-ink",
};

export function StatCard({ label, value, icon: Icon, accent = "ink", subtitle }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentMap[accent])}>
          <Icon size={16} />
        </div>
      </div>
      <div className="stat-number mt-2 text-4xl font-semibold text-ink">{value}</div>
      {subtitle ? <div className="mt-1 text-[11px] text-muted">{subtitle}</div> : null}
    </Card>
  );
}
