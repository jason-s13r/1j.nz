import pug from "pug";


export const toSlug = (tag: string) => tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");

export function pagedList<T>(list: T[], pageNum: number, pageSize: number) {
    const startIndex = Math.max(0, pageNum - 1) * pageSize;

    const page = list.slice(startIndex, startIndex + pageSize);
    const hasNext = list.length > (startIndex + page.length);
    const hasPrev = startIndex > 0;

  return {
    page,
    hasNext,
    hasPrev,
    total: list.length,
  };
}
