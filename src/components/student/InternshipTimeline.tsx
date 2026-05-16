"use client";

import Link from "next/link";
import type { TimelineItem } from "@/types/internship-timeline";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Lock,
  Timer,
} from "lucide-react";

function StateIcon({ state }: { state: TimelineItem["state"] }) {
  if (state === "completed") {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />;
  }
  if (state === "rejected") {
    return <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />;
  }
  if (state === "blocked") {
    return <Lock className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />;
  }
  if (state === "pending") {
    return <Timer className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />;
  }
  return <CircleDashed className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />;
}

function stateLabel(state: TimelineItem["state"]) {
  switch (state) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    case "blocked":
      return "Locked";
    case "rejected":
      return "Action needed";
    default:
      return state;
  }
}

export default function InternshipTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 md:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Internship timeline</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Track each step from creation to your final result. Select a step to open the matching page.
        </p>
      </div>
      <ol className="relative space-y-0 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
        {items.map((item) => (
          <li key={item.id} className="relative pb-8 last:pb-0">
            <span
              className="absolute -left-[25px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-50 dark:border-slate-900 dark:bg-slate-950"
              style={{ top: 0 }}
            >
              <StateIcon state={item.state} />
            </span>
            <Link
              href={item.href}
              className="group block rounded-xl border border-transparent px-1 py-0.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-[#2541b2] dark:text-slate-100 dark:group-hover:text-sky-300">
                  {item.title}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                    item.state === "completed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                      : item.state === "pending"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100"
                        : item.state === "rejected"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-100"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {stateLabel(item.state)}
                </span>
                {item.kind === "weekly" && item.weekNo != null ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Week {item.weekNo}</span>
                ) : null}
              </div>
              {item.subtitle ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.subtitle}</p>
              ) : null}
              <span className="mt-1 inline-block text-xs font-medium text-[#2541b2] opacity-0 transition group-hover:opacity-100 dark:text-sky-300">
                Open page →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
