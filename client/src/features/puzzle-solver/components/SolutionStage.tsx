import type { ReactNode } from "react";
import { isSquareOneAlgorithm } from "@/lib/squareOneModel";
import { CubeAlgorithmReplay } from "@/components/common/CubeAlgorithmReplay";
import type { PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";
import type { TimerEventId } from "@/lib/timerEvents";

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
  setup: string;
  moves: readonly string[];
  cursor: number;
  direction?: "forward" | "backward";
  motionId: number;
  language: "vi" | "en";
  placeholder?: ReactNode;
  speed?: number;
}) {
  const playable = puzzle === "square1" ? isSquareOneAlgorithm(setup) : isPlayableAlgorithm(setup);
  const ready = setup.trim() !== "" && playable;
  if (!ready)
    return (
      <div className="mx-auto grid h-80 w-full max-w-xl place-items-center px-6 text-center text-sm text-muted">
        {placeholder}
      </div>
    );
  const forward = direction === "forward" && cursor > 0;
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
        tempoScale={3.4 * speed}
        model3d={puzzle === "square1"}
      />
    </div>
  );
}
