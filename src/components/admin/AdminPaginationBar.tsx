"use client";

import { Button } from "@/components/ui/button";
import type { AdminPagination } from "@/utils/adminPagination";

type Props = {
  pagination: AdminPagination | null;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPaginationBar({ pagination, onPageChange, className }: Props) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages, total, pageSize } = pagination;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400 ${className ?? ""}`}
    >
      <span>
        Showing {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="tabular-nums px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
