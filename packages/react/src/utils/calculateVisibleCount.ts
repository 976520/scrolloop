export function calculateVisibleCount(height: number, itemSize: number): number {
  return Math.ceil(height / itemSize);
}

