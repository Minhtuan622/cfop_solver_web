/**
 * Số move cross tối ưu cho từng màu đáy của scramble hiện tại.
 *
 * Mỗi ô tô đúng màu tâm, ghi số move (HTM) để xếp xong cross màu đó; ô ít
 * move nhất có nhãn "tốt nhất". Số đọc thẳng từ bảng tra cross của bộ giải
 * Rust (BFS đầy đủ), nên là giá trị tối ưu chứ không phải ước lượng.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import { scrambledState } from "@/lib/scrambleOrientation";
import { crossLengthsInBrowser, type CrossLengths } from "@/lib/solverRuntime";
import { cn } from "@/lib/utils";

type FaceLetter = keyof CrossLengths;

/** Trắng, vàng trước (hai màu cross phổ biến nhất), rồi bốn màu bên. */
const DISPLAY_ORDER: FaceLetter[] = ["D", "U", "F", "B", "R", "L"];

const COLOR_NAME_KEY: Record<FaceLetter, string> = {
  U: "settings.color.yellow",
  R: "settings.color.orange",
  F: "settings.color.green",
  D: "settings.color.white",
  L: "settings.color.red",
  B: "settings.color.blue",
};

/** Mặt sáng (trắng, vàng) cần chữ tối để đọc được. */
const LIGHT_FACES = new Set<FaceLetter>(["U", "D"]);

type State =
  | { status: "loading" }
  | { status: "ready"; lengths: CrossLengths }
  | { status: "error" };

/** Lấy số move cross của `scramble`; bỏ qua kết quả của scramble cũ. */
export function useCrossLengths(scramble: string, enabled: boolean): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    if (!enabled || !scramble.trim()) return;
    let stale = false;
    setState({ status: "loading" });
    let state: string;
    try {
      // Trạng thái thật khi tráo theo chuẩn WCA (trắng U, xanh lá F).
      state = scrambledState(scramble);
    } catch {
      setState({ status: "error" });
      return;
    }
    crossLengthsInBrowser("state", state).then(
      lengths => {
        if (!stale) setState({ status: "ready", lengths });
      },
      () => {
        if (!stale) setState({ status: "error" });
      }
    );
    return () => {
      stale = true;
    };
  }, [scramble, enabled]);
  return state;
}

export function CrossLengthStrip({
  scramble,
  className,
}: {
  scramble: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const state = useCrossLengths(scramble, true);
  // Scramble có xoay khối (vd. BLD với lượt wide) không cho số có nghĩa: ẩn đi.
  if (state.status === "error") return null;
  const lengths = state.status === "ready" ? state.lengths : null;
  const best = lengths
    ? Math.min(...DISPLAY_ORDER.map(face => lengths[face]))
    : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 mb-4",
        className
      )}
      aria-busy={state.status === "loading"}
    >
      <span className="text-sm font-medium text-muted">
        {t("timer.crossLengths")}
      </span>
      <ul
        className="flex flex-wrap items-center gap-2"
        aria-label={t("timer.crossLengths")}
      >
        {DISPLAY_ORDER.map(face => {
          const moves = lengths?.[face];
          const isBest = moves !== undefined && moves === best;
          const color = t(COLOR_NAME_KEY[face]);
          const label =
            moves === undefined
              ? color
              : t("timer.crossLengthAria", { color, moves: String(moves) }) +
                (isBest ? ` (${t("timer.crossBest")})` : "");
          return (
            <li
              key={face}
              data-best={isBest || undefined}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold tabular-nums",
                  LIGHT_FACES.has(face) ? "text-[#1b1f27]" : "text-white"
                )}
                style={{ backgroundColor: CUBE_COLORS[face] }}
                title={label}
                aria-label={label}
              >
                {moves ?? "·"}
              </span>
              {/* Màu tốt nhất: một vạch màu nhấn dưới ô (không viền, không nhãn chữ).
                  Ô khác giữ chỗ trống cùng cỡ để hàng không nhảy. */}
              <span
                aria-hidden="true"
                className={cn("h-1 w-5 rounded-full", isBest ? "bg-accent" : "bg-transparent")}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
