export function canLoadPage<T>(
  page: number,
  pages: Map<number, T[]>,
  loadingPages: Set<number>,
  total: number,
  pageSize: number,
  hasMore: boolean
): boolean {
  // 이미 로드 중이거나 로드되었을 경우
  // already loaded or loading
  if (pages.has(page) || loadingPages.has(page)) return false;

  // 이미 전체 데이터를 받았고, 해당 페이지 범위를 벗어난 경우
  // already got all data and out of range
  if (total > 0 && page * pageSize >= total) return false;

  // 더 이상 데이터가 없고, 현재 페이지가 마지막 페이지보다 큰 경우
  // no more data and current page is greater than last page
  if (!hasMore && page > Math.floor(total / pageSize)) return false;

  return true;
}