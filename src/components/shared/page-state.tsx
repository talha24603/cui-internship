type PageMessageProps = {
  message: string;
  className?: string;
};

export function PageError({ message, className = "" }: PageMessageProps) {
  return (
    <p
      className={`rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300 ${className}`}
    >
      {message}
    </p>
  );
}

export function PageEmpty({ message, className = "" }: PageMessageProps) {
  return (
    <p
      className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 ${className}`}
    >
      {message}
    </p>
  );
}
