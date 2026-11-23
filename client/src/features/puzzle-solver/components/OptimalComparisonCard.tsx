/**
 * Thẻ "So với lời giải ngắn nhất" của trang Giải: tìm lời giải không theo CFOP
 * cho đúng trạng thái đang giải rồi đặt số lượt cạnh lời giải CFOP.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  compareWithOptimal,
  type OptimalComparison,
} from "../lib/optimalSolve";

export function OptimalComparisonCard({
  cfopSolution,
}: {
  /** Lời giải CFOP gốc của bộ giải (cùng hướng cầm với trạng thái nhập). */
  cfopSolution: string;
}) {
  const { t } = useLanguage();
  const [result, setResult] = useState<OptimalComparison | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    setError(false);
    try {
      setResult(await compareWithOptimal(cfopSolution));
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      className="mt-6 rounded-card bg-surface p-5 sm:p-6"
      aria-labelledby="optimal-comparison-heading"
    >
      <h2
        id="optimal-comparison-heading"
        className="text-base font-semibold tracking-tight"
      >
        {t("optimal.title")}
      </h2>
      <p className="mt-1 mb-0 text-sm text-muted">{t("optimal.hint")}</p>
      {result ? (
        <div className="mt-4 flex flex-col gap-3" aria-live="polite">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4">
              <StatTile label="CFOP" value={String(result.cfopMoves)} />
            </div>
            <div className="col-span-4">
              <StatTile
                label={t("optimal.shortest")}
                value={String(result.moves)}
              />
            </div>
            <div className="col-span-4">
              <StatTile
                label={t("optimal.difference")}
                value={`${result.extraMoves > 0 ? "+" : ""}${result.extraMoves}`}
              />
            </div>
          </div>
          <p
            data-testid="optimal-solution"
            className="mb-0 rounded-panel bg-surface-2 px-4 py-3 font-mono text-sm break-words"
          >
            {result.solution}
          </p>
          <p className="mb-0 text-xs text-muted">{t("optimal.frame")}</p>
        </div>
      ) : (
        <div className="mt-4">
          <Button
            variant="soft"
            disabled={pending}
            aria-busy={pending || undefined}
            onClick={() => void run()}
          >
            {pending ? t("optimal.searching") : t("optimal.run")}
          </Button>
          {error ? (
            <p role="alert" className="mt-3 mb-0 text-sm text-danger">
              {t("optimal.error")}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
