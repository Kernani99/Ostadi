import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "rose" | "violet" | "warning";

const tones: Record<Tone, string> = {
  primary: "bg-accent text-accent-foreground",
  info: "bg-info/10 text-info",
  rose: "bg-chart-4/10 text-chart-4",
  violet: "bg-chart-5/10 text-chart-5",
  warning: "bg-warning/15 text-warning",
};

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: Tone;
};

export function StatCard({ title, value, description, icon: Icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="tabular text-3xl font-bold leading-none">{value}</p>
        {description && <p className="pt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
    </Card>
  );
}
