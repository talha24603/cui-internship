import type { ReactNode } from "react";
import { Card as UiCard, CardContent } from "@/components/ui/card";

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <UiCard className={className} onClick={onClick}>
      <CardContent>{children}</CardContent>
    </UiCard>
  );
}

export function LabelValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = (status || "UNKNOWN").toUpperCase();
  const className =
    value.includes("APPROVED") || value.includes("VERIFIED") || value.includes("RESOLVED")
      ? "bg-emerald-100 text-emerald-700"
      : value.includes("REJECTED") || value.includes("DISMISSED")
        ? "bg-rose-100 text-rose-700"
        : value.includes("PENDING") || value.includes("REVIEW")
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{value}</span>;
}
