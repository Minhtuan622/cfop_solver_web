/**
 * Hình nhìn từ trên xuống của lớp cuối cho các case Roux: mặt U (3×3) và hàng
 * trên cùng của bốn mặt bên. Thuần dữ liệu: nhận chuỗi 54 ký tự URFDLB và trả
 * về các ô kèm toạ độ trên lưới 5×5 (viền ngoài mỏng cho mặt bên).
 */
export type TopViewCell = { x: number; y: number; letter: string; side: boolean };

/** Chỉ số sticker của hàng trên cùng mỗi mặt bên, theo thứ tự trái → phải (hoặc trên → dưới) khi nhìn từ trên. */
const SIDES = {
  top: [47, 46, 45], // B, từ trái (phía L) sang phải (phía R)
  bottom: [18, 19, 20], // F
  left: [36, 37, 38], // L, từ trên (phía B) xuống (phía F)
  right: [11, 10, 9], // R, từ trên (phía B) xuống (phía F)
} as const;

export function topViewCells(facelets: string): TopViewCell[] {
  if (facelets.length !== 54) return [];
  const cells: TopViewCell[] = [];
  // Mặt U: ô (hàng, cột) của lưới 3×3 nằm ở giữa lưới 5×5, dịch 1.
  for (let row = 0; row < 3; row += 1)
    for (let column = 0; column < 3; column += 1)
      cells.push({ x: column + 1, y: row + 1, letter: facelets[row * 3 + column], side: false });
  SIDES.top.forEach((index, column) =>
    cells.push({ x: column + 1, y: 0, letter: facelets[index], side: true })
  );
  SIDES.bottom.forEach((index, column) =>
    cells.push({ x: column + 1, y: 4, letter: facelets[index], side: true })
  );
  SIDES.left.forEach((index, row) =>
    cells.push({ x: 0, y: row + 1, letter: facelets[index], side: true })
  );
  SIDES.right.forEach((index, row) =>
    cells.push({ x: 4, y: row + 1, letter: facelets[index], side: true })
  );
  return cells;
}
