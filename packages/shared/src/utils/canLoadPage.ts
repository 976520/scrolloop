export function canLoadPage<T>(
  page: number,
  pages: Map<number, T[]>,
  loadingPages: Set<number>,
  total: number,
  pageSize: number,
  hasMore: boolean
): boolean {
  if (pages.has(page) || loadingPages.has(page)) return false;

  if (total > 0 && page * pageSize >= total) return false;

  if (!hasMore && page > Math.floor(total / pageSize)) return false;

  return true;
}
