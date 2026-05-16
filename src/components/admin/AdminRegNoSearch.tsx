"use client";

type AdminRegNoSearchProps = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

const inputClass =
  "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 font-mono text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b2e83]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export function AdminRegNoSearch({ id = "admin-reg-no-search", value, onChange, className }: AdminRegNoSearchProps) {
  return (
    <div className={className ?? "w-full max-w-sm space-y-1"}>
      <label htmlFor={id} className="text-xs font-medium text-slate-700 dark:text-slate-300">
        Search by registration no.
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="AA00-BBB-000"
        autoComplete="off"
        className={inputClass}
      />
    </div>
  );
}
