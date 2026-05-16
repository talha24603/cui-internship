import type { Prisma } from "@prisma/client";

export type EndDateRangeParseResult =
  | { ok: true; filter: Prisma.DateTimeNullableFilter | undefined }
  | { ok: false; message: string };

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function dayBoundary(isoDay: string, endOfDay: boolean): Date | null {
  if (!ISO_DAY.test(isoDay)) return null;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const d = new Date(`${isoDay}${suffix}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Optional internship end-date range from URL search params (YYYY-MM-DD).
 * Used by faculty and admin internship list APIs.
 */
export function parseEndDateRangeFromSearchParams(
  params: URLSearchParams,
): EndDateRangeParseResult {
  const fromRaw = params.get("endDateFrom")?.trim() ?? "";
  const toRaw = params.get("endDateTo")?.trim() ?? "";
  if (!fromRaw && !toRaw) {
    return { ok: true, filter: undefined };
  }
  const filter: Prisma.DateTimeNullableFilter = {};
  if (fromRaw) {
    const d = dayBoundary(fromRaw, false);
    if (!d) {
      return { ok: false, message: "Invalid endDateFrom; use YYYY-MM-DD" };
    }
    filter.gte = d;
  }
  if (toRaw) {
    const d = dayBoundary(toRaw, true);
    if (!d) {
      return { ok: false, message: "Invalid endDateTo; use YYYY-MM-DD" };
    }
    filter.lte = d;
  }
  if (filter.gte && filter.lte) {
    const a = filter.gte instanceof Date ? filter.gte : new Date(filter.gte);
    const b = filter.lte instanceof Date ? filter.lte : new Date(filter.lte);
    if (a.getTime() > b.getTime()) {
      return { ok: false, message: "endDateFrom must be on or before endDateTo" };
    }
  }
  return { ok: true, filter };
}
