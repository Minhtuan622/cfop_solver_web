/**
 * Sân khấu 3D dùng chung cho mọi event của trang Giải (3×3, 2×2, Pyraminx,
 * Skewb): cùng bộ vẽ 3D của Timer. Khối dựng một lần; mỗi bước chỉ cập nhật
 * scramble nền và phát đúng nước đi hiện tại nên không nháy, không dựng lại.
 */
import type { ReactNode } from "react";
import { CubeAlgorithmReplay } from "@/components/common/CubeAlgorithmReplay";
import type { PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";
import type { TimerEventId } from "@/lib/timerEvents";

/** Chuỗi lượt chỉ gồm ký hiệu WCA hợp lệ (để không đưa chữ đang gõ dở cho player). */
const VALID_ALG =
  /^(?:(?:(?:[URFDLB]w?|[urfdlb]|[MESxyz]|\d[URFDLB]w|[A-Z]{2,3}v?|[URFDLB]v)(?:\+\+|--|\d?'?)|(?:UR|DR|DL|UL|ALL|[URDL])\d{1,2}[+-])(?:\s+|$))*$/;

export function isPlayableAlgorithm(text: string) {
  return VALID_ALG.test(text.trim() + " ") || !text.trim();
}

export function SolutionStage({
  eventId,
  puzzle,
  setup,
  moves,
  cursor,
  direction = "forward",
  motionId,
  language,
  placeholder,
  speed = 1,
}: {
  eventId: TimerEventId;
  puzzle: PuzzleId;
  /** Chuỗi lượt đưa khối đã giải về trạng thái bắt đầu (scramble). */
  setup: string;
  moves: readonly string[];
  /** Số nước đã đi (0 = trạng thái bắt đầu). */
  cursor: number;
  direction?: "forward" | "backward";
  /** Đổi giá trị này để phát lại nước vừa đi. */
  motionId: number;
  language: "vi" | "en";
  /** Hiện khi chưa có gì để vẽ (chưa có scramble hợp lệ). */
  placeholder?: ReactNode;
  /** Tốc độ phát của thanh điều khiển (0.5–2). */
  speed?: number;
}) {
  const ready = setup.trim() !== "" && isPlayableAlgorithm(setup);
  if (!ready)
    return (
      <div className="mx-auto grid h-80 w-full max-w-xl place-items-center px-6 text-center text-sm text-muted">
        {placeholder}
      </div>
    );
  const forward = direction === "forward" && cursor > 0;
  // Đi tới thì phát nước thứ `cursor`; lùi hoặc nhảy về thì chỉ đặt đúng trạng thái.
  const applied = moves.slice(0, forward ? cursor - 1 : cursor).join(" ");
  const step = forward ? (moves[cursor - 1] ?? "") : "";
  return (
    <div className="mx-auto h-80 w-full max-w-xl">
      <CubeAlgorithmReplay
        eventId={eventId}
        puzzle={puzzle}
        scramble={`${setup} ${applied}`.trim()}
        algorithm={step}
        language={language}
        replayToken={motionId}
        // Một nước phải xong trước khi nước kế tiếp tới (cách nhau 700/speed ms),
        // nếu không các nước đè lên nhau và khối nhảy cóc. cubing.js mặc định
        // ~1 giây một nước nên nhân lên.
        tempoScale={3.4 * speed}
      />
    </div>
  );
}
