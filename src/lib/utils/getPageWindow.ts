// Page numbers to render: a fixed-size window around the current page, clamped to [1, pageCount].
export const getPageWindow = (page: number, pageCount: number, size = 7) => {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), pageCount - size + 1));
  return Array.from({ length: Math.min(size, pageCount) }, (_, i) => start + i);
};
