import { formatMultiBlindTime, multiBlindTimeLimitMs } from "@/lib/multiBlind";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";

export function MultiBlindAttemptPanel({
  attempted,
  onAttemptedChange,
  loading,
  onGenerate,
}: {
  attempted: number;
  onAttemptedChange: (attempted: number) => void;
  loading: boolean;
  onGenerate: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card bg-surface bg-surface-2 mb-4">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="mb-1.5 block text-sm font-medium text-ink mb-0">
            {t("timer.multiBlindAttempted")}
            <input
              aria-label={t("timer.multiBlindAttemptedAria")}
              type="number"
              min="2"
              max="99"
              value={attempted}
              onChange={event =>
                onAttemptedChange(
                  Math.max(2, Math.min(99, Number(event.target.value) || 2))
                )
              }
              className="w-full rounded-field bg-surface px-3.5 py-2.5 text-sm text-ink transition placeholder:text-placeholder focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 rounded-lg px-3 py-1.5 text-xs mt-1 w-auto"
            />
          </label>
          <span className="text-sm text-muted">
            {t("timer.multiBlindLimit")}:{" "}
            {formatMultiBlindTime(
              multiBlindTimeLimitMs(attempted)
            )}
          </span>
          <Button
            variant="outline"
            size="xs"
            type="button"

            disabled={loading}
            onClick={onGenerate}
            aria-label={t("timer.multiBlindGenerateAria")}
          >
            {t("timer.multiBlindGenerate", {
              count: attempted,
            })}
          </Button>
        </div>
      </div>
    </div>
  );
}
