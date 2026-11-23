import { useEffect, useState } from "react";

/**
 * Theo dõi một media query. Giá trị đầu tiên đọc ngay khi khởi tạo (không nháy
 * khi mở trang); trình duyệt không có `matchMedia` thì luôn là `false`.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && Boolean(window.matchMedia?.(query).matches)
  );
  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return undefined;
    const update = () => setMatches(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}
