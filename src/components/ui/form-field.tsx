import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, hint, error, className, children }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </label>
  );
}
