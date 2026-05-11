export type AdminPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Parse `page` and `pageSize` (or legacy `limit`) from URL search params.
 * Defaults: page=1, pageSize=20. Max pageSize=100.
 */
export function parseAdminPagination(searchParams: URLSearchParams): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  const parsedPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const rawSize = parseInt(
    searchParams.get("pageSize") ?? searchParams.get("limit") ?? "20",
    10,
  );
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(rawSize) ? rawSize : 20));

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export function buildAdminPagination(
  page: number,
  pageSize: number,
  total: number,
): AdminPagination {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { page, pageSize, total, totalPages };
}
