/** Danh sách scramble và thẻ nhập kết quả cho Multi-Blind. */
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { formatMultiBlindTime, multiBlindResult } from "@/lib/multiBlind";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";

export function MultiBlindScrambleList({
  scrambles,
  loading,
}: {
  scrambles: string[];
  loading: boolean;
}) {
  const { t } = useLanguage();
  if (loading)
    return (
      <div className="mb-4">
        <span className="block h-3 rounded-full bg-surface-3 w-10/12" />
        <span className="block h-3 rounded-full bg-surface-3 w-8/12 mt-2" />
      </div>
    );
  if (!scrambles.length)
    return (
      <p className="text-sm text-muted mb-4">
        {t("timer.multiBlindPickCount")}
      </p>
    );
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold mb-2">
        {t("timer.multiBlindBundle", { count: scrambles.length })}
      </p>
      <ol className="overflow-hidden rounded-panel bg-surface list-decimal pl-6">
        {scrambles.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="block px-4 py-3 text-sm font-mono break-words"
          >
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
export function MultiBlindResultCard({
  completion,
  attempted,
  solved,
  onSolvedChange,
  onSave,
}: {
  completion: TimerCompletion;
  attempted: number;
  solved: number;
  onSolvedChange: (value: number) => void;
  onSave: () => void;
}) {
  const { t } = useLanguage();
  const result = multiBlindResult({ attempted, solved }, completion.elapsedMs);
  return (
    <div className="rounded-card bg-surface mt-4">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-tight mb-1">
              {t("timer.multiBlindConfirm")}
            </p>
            <p className="text-sm text-muted mb-0">
              {t("timer.multiBlindScoreRule", {
                time: formatMultiBlindTime(completion.elapsedMs),
              })}
            </p>
          </div>
          <label className="mb-1.5 block text-sm font-medium text-ink mb-0">
            {t("timer.multiBlindSolved")}
            <input
              aria-label={t("timer.multiBlindSolvedAria")}
              type="number"
              min="0"
              max={attempted}
              value={solved}
              onChange={event =>
                onSolvedChange(
                  Math.min(
                    attempted,
                    Math.max(0, Number(event.target.value) || 0)
                  )
                )
              }
              className="w-full rounded-field bg-surface px-3.5 py-2.5 text-sm text-ink transition placeholder:text-placeholder focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 mt-1 w-auto"
            />
          </label>
        </div>
        <div
          className={
            result.valid
              ? "rounded-panel px-4 py-3 text-sm bg-success-soft text-ink mt-4 mb-4"
              : "rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mt-4 mb-4"
          }
        >
          {t("timer.multiBlindSummary", {
            solved: result.solved,
            attempted: result.attempted,
            score: result.score,
            unsolved: result.unsolved,
            limit: formatMultiBlindTime(result.timeLimitMs),
          })}
          {!result.valid ? t("timer.multiBlindDnf") : ""}
        </div>
        <Button variant="primary" size="md" type="button" onClick={onSave}>
          {t("timer.multiBlindSave")}
        </Button>
      </div>
    </div>
  );
}
