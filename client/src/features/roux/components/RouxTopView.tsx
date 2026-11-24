/**
 * Hình 2D của một case Roux: nhìn từ trên xuống lớp cuối. Trạng thái dựng bằng
 * cách áp ĐẢO công thức lên khối đã giải (cubing.js, nạp lười); trong lúc chờ
 * hiện biểu tượng chung.
 */
import { useEffect, useState } from "react";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import { kpatternToFacelets } from "@/features/timer/lib/kpatternFacelets";
import { topViewCells } from "../lib/topView";

const cache = new Map<string, Promise<string>>();

/** Chuỗi 54 ký tự của case: khối đã giải sau khi áp đảo của công thức. */
function caseFacelets(algorithm: string) {
  let found = cache.get(algorithm);
  if (!found) {
    found = (async () => {
      const [{ puzzles }, { Alg }] = await Promise.all([
        import("cubing/puzzles"),
        import("cubing/alg"),
      ]);
      const kpuzzle = await puzzles["3x3x3"].kpuzzle();
      return kpatternToFacelets(
        kpuzzle.defaultPattern().applyAlg(new Alg(algorithm).invert())
      );
    })();
    cache.set(algorithm, found);
  }
  return found;
}

export function RouxTopView({
  algorithm,
  label,
  fallback,
}: {
  algorithm: string;
  label: string;
  fallback: React.ReactNode;
}) {
  const [facelets, setFacelets] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setFacelets(null);
    void caseFacelets(algorithm)
      .then(value => {
        if (!cancelled) setFacelets(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [algorithm]);

  if (!facelets) return <>{fallback}</>;
  const cell = 20;
  const thin = 7;
  // Ô mặt bên mỏng (thin) nằm ngoài, ô mặt U vuông (cell): đổi toạ độ lưới sang pixel.
  const offset = (index: number) => (index === 0 ? 0 : thin + (index - 1) * cell);
  const size = thin * 2 + cell * 3;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="w-full max-w-none">
      {topViewCells(facelets).map(item => {
        const x = item.x === 4 ? thin + cell * 3 : offset(item.x);
        const y = item.y === 4 ? thin + cell * 3 : offset(item.y);
        const width = item.side && (item.x === 0 || item.x === 4) ? thin : cell;
        const height = item.side && (item.y === 0 || item.y === 4) ? thin : cell;
        return (
          <rect
            key={`${item.x}-${item.y}`}
            x={x + 0.5}
            y={y + 0.5}
            width={width - 1}
            height={height - 1}
            rx={1.5}
            fill={CUBE_COLORS[item.letter] ?? "currentColor"}
          />
        );
      })}
    </svg>
  );
}
