import type { CSSProperties } from "react";

/** Khoảng hở giữa khối nổi với nút bấm và với mép khung nhìn (px). */
export const GAP = 8;
export const VIEWPORT_MARGIN = 8;
/** Chiều cao khối nổi mong muốn (tương đương `max-h-72`). */
export const PREFERRED_HEIGHT = 288;
/** Bề rộng tối thiểu của khối nổi (tương đương `min-w-48`). */
export const MIN_WIDTH = 192;

export type FloatingGeometry = {
  /** "bottom": mở xuống dưới nút; "top": lật lên trên nút. */
  placement: "bottom" | "top";
  /** Toạ độ tài liệu của mép trái khối nổi (px). */
  left: number;
  /** Bề rộng khối nổi (px), không nhỏ hơn bề rộng nút. */
  width: number;
  /** Chiều cao tối đa được phép (px) sau khi trừ khoảng hở. */
  maxHeight: number;
  /**
   * Toạ độ tài liệu của mép khối nổi sát nút: mép trên của khối khi mở
   * xuống, mép dưới của khối khi lật lên.
   */
  anchor: number;
};

/**
 * Chọn hướng mở và ghim kích thước khối nổi (danh sách tuỳ chọn, menu) theo
 * chỗ trống quanh nút.
 *
 * Toạ độ trả về là **toạ độ tài liệu** (đã cộng phần cuộn) để khối nổi gắn
 * vào `document.body` bằng portal và định vị tuyệt đối: không bị tổ tiên có
 * `overflow-hidden` cắt, không bị lệch bởi tổ tiên có transform/filter, và
 * bám theo nút khi cuộn trang mà không cần đo lại. Hàm thuần túy để test
 * được logic lật lên trong jsdom, vốn không đo được bố cục thật.
 */
export function computeFloatingGeometry(input: {
  viewportWidth: number;
  viewportHeight: number;
  /** Cuộn hiện thời của trang (`window.pageXOffset`/`pageYOffset`). */
  scrollX: number;
  scrollY: number;
  /** Toạ độ khung nhìn của nút bấm (từ `getBoundingClientRect`). */
  triggerTop: number;
  triggerBottom: number;
  triggerLeft: number;
  triggerWidth: number;
  minWidth?: number;
  preferredHeight?: number;
}): FloatingGeometry {
  const width = Math.max(input.triggerWidth, input.minWidth ?? MIN_WIDTH);
  const preferred = Math.max(0, input.preferredHeight ?? PREFERRED_HEIGHT);
  const roomBelow =
    input.viewportHeight - VIEWPORT_MARGIN - (input.triggerBottom + GAP);
  const roomAbove = input.triggerTop - GAP - VIEWPORT_MARGIN;
  // Mở xuống là mặc định; chỉ lật lên khi phía trên rộng hơn phía dưới.
  const placement = roomBelow >= roomAbove ? "bottom" : "top";
  const room = placement === "bottom" ? roomBelow : roomAbove;
  const left = Math.min(
    Math.max(input.triggerLeft + input.scrollX, VIEWPORT_MARGIN + input.scrollX),
    Math.max(
      VIEWPORT_MARGIN + input.scrollX,
      input.scrollX + input.viewportWidth - VIEWPORT_MARGIN - width,
    ),
  );
  return {
    placement,
    left,
    width,
    maxHeight: Math.max(0, Math.min(preferred, room)),
    anchor:
      placement === "bottom"
        ? input.triggerBottom + input.scrollY + GAP
        : input.triggerTop + input.scrollY - GAP,
  };
}

/**
 * Đổi kết quả đo thành style cho khối nổi nằm trong wrapper.absolute trải
 * đúng một khung nhìn tính từ đỉnh tài liệu (xem `Select`/`Dropdown`).
 *
 * Khi lật lên, mép dưới khối nổi phải khớp `anchor`: dùng `top` cộng
 * `translateY(-100%)` vì `bottom` của phần tử absolute tính từ đáy wrapper
 * (đỉnh tài liệu), không phải từ đáy khung nhìn.
 */
export function floatingStyle(
  geometry: FloatingGeometry,
  options: {
    /** "end": mép phải khối nổi khớp mép phải nút (menu); "start": mép trái. */
    align: "start" | "end";
    /** Mép phải của nút theo toạ độ tài liệu (cần khi `align: "end"`). */
    rightDoc: number;
    viewportWidth: number;
  },
): CSSProperties {
  const horizontal: CSSProperties =
    options.align === "end"
      ? { right: options.viewportWidth - options.rightDoc }
      : { left: geometry.left };
  return {
    ...horizontal,
    top: geometry.anchor,
    width: geometry.width,
    maxHeight: geometry.maxHeight,
    ...(geometry.placement === "top"
      ? { transform: "translateY(-100%)" }
      : null),
  };
}

/** So sánh style nổi trước/sau một lần đo để bỏ qua lần render vô ích. */
export function sameFloatingStyle(
  a: CSSProperties,
  b: CSSProperties,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key as keyof CSSProperties] !== b[key as keyof CSSProperties]) {
      return false;
    }
  }
  return true;
}
