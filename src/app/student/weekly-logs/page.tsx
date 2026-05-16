import { Suspense } from "react";
import WeeklyLogsClient from "./WeeklyLogsClient";
import { Skeleton } from "@/components/ui/skeleton";

function WeeklyLogsFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="rounded-2xl border border-white/45 bg-white/85 p-5 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_1fr]">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function WeeklyLogsPage() {
  return (
    <Suspense fallback={<WeeklyLogsFallback />}>
      <WeeklyLogsClient />
    </Suspense>
  );
}
