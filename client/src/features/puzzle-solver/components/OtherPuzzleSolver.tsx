/**
 * Bộ giải riêng cho 2×2×2, Pyraminx và Skewb: nhập (hoặc tạo) scramble, bấm
 * Giải để nhận lời giải ngắn từ cubing.js, rồi xem lại bằng mô hình 3D.
 */
import { useState } from "react";
import { PillGroup } from "@/components/ui/DesignSystem";
import { Textarea } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StudioUI";
import { CubeAlgorithmReplay } from "@/components/common/CubeAlgorithmReplay";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateTimerScramble } from "@/lib/timerEvents";
import {
  OTHER_PUZZLES,
  OTHER_PUZZLE_IDS,
  PuzzleSolveError,
  solveOtherPuzzle,
  type OtherPuzzleId,
  type PuzzleSolveResult,
} from "../lib/puzzleSolve";

export function OtherPuzzleSolver() {
  const { language, t } = useLanguage();
  const [puzzle, setPuzzle] = useState<OtherPuzzleId>("222");
  const [scramble, setScramble] = useState("");
  const [result, setResult] = useState<PuzzleSolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [replayToken, setReplayToken] = useState(0);
  const [copied, setCopied] = useState(false);
  const info = OTHER_PUZZLES[puzzle];

  const choosePuzzle = (next: OtherPuzzleId) => {
    setPuzzle(next);
    // Scramble của khối này không dùng được cho khối khác.
    setScramble("");
    setResult(null);
    setError(null);
  };

  const randomScramble = async () => {
    setGenerating(true);
    setError(null);
    try {
      setScramble(await generateTimerScramble(info.eventId));
      setResult(null);
    } finally {
      setGenerating(false);
    }
  };

  const solve = async () => {
    setSolving(true);
    setError(null);
    setResult(null);
    try {
      const solved = await solveOtherPuzzle(puzzle, scramble);
      setResult(solved);
      setReplayToken(token => token + 1);
    } catch (reason) {
      const code = reason instanceof PuzzleSolveError ? reason.code : "solver-failed";
      setError(t(`otherPuzzles.error.${code}`));
    } finally {
      setSolving(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard?.writeText(result.solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      /* Trình duyệt chặn clipboard: người dùng vẫn chọn chữ được. */
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <section className="col-span-12 xl:col-span-5 rounded-card bg-surface p-5 sm:p-6">
        <PillGroup
          label={t("otherPuzzles.puzzle")}
          value={puzzle}
          onChange={choosePuzzle}
          options={OTHER_PUZZLE_IDS.map(id => ({
            value: id,
            label: t(OTHER_PUZZLES[id].labelKey),
          }))}
        />
        <label
          htmlFor="other-puzzle-scramble"
          className="mt-5 mb-1 block text-sm font-medium text-ink"
        >
          {t("otherPuzzles.scramble")}
        </label>
        <Textarea
          id="other-puzzle-scramble"
          rows={3}
          value={scramble}
          placeholder={t("otherPuzzles.scramblePlaceholder")}
          onChange={event => {
            setScramble(event.target.value);
            setResult(null);
          }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={!scramble.trim() || generating || solving}
            aria-busy={solving || undefined}
            onClick={() => void solve()}
          >
            {solving ? t("otherPuzzles.solving") : t("otherPuzzles.solve")}
          </Button>
          <Button
            variant="soft"
            disabled={generating || solving}
            onClick={() => void randomScramble()}
          >
            {generating ? t("otherPuzzles.generating") : t("otherPuzzles.random")}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-4 mb-0 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <p className="mt-4 mb-0 text-xs text-muted">{t("otherPuzzles.note")}</p>
      </section>

      <section
        className="col-span-12 xl:col-span-7 rounded-card bg-surface p-5 sm:p-6"
        aria-live="polite"
      >
        {result ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <StatTile label={t("otherPuzzles.moves")} value={String(result.moves)} />
              </div>
              <div className="col-span-6">
                <StatTile label={t("otherPuzzles.puzzle")} value={t(info.labelKey)} />
              </div>
            </div>
            <div>
              <h2 className="mb-1 text-sm font-semibold tracking-tight">
                {t("otherPuzzles.solution")}
              </h2>
              <p
                data-testid="other-puzzle-solution"
                className="mb-0 rounded-panel bg-surface-2 px-4 py-3 font-mono text-sm break-words"
              >
                {result.solution || t("otherPuzzles.alreadySolved")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="soft" size="sm" onClick={() => void copy()}>
                  {copied ? t("otherPuzzles.copied") : t("otherPuzzles.copy")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplayToken(token => token + 1)}
                >
                  {t("otherPuzzles.replay")}
                </Button>
              </div>
            </div>
            <div className="h-80">
              <CubeAlgorithmReplay
                eventId={info.eventId}
                puzzle={info.puzzle}
                scramble={result.scramble}
                algorithm={result.solution}
                language={language}
                replayToken={replayToken}
              />
            </div>
          </div>
        ) : (
          <p className="mb-0 text-sm text-muted">{t("otherPuzzles.empty")}</p>
        )}
      </section>
    </div>
  );
}
