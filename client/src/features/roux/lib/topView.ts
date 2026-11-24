export type TopViewCell = { x: number; y: number; letter: string; side: boolean };

const SIDES = {
  top: [47, 46, 45],
  bottom: [18, 19, 20],
  left: [36, 37, 38],
  right: [11, 10, 9],
} as const;

export function topViewCells(facelets: string): TopViewCell[] {
  if (facelets.length !== 54) return [];
  const cells: TopViewCell[] = [];
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
