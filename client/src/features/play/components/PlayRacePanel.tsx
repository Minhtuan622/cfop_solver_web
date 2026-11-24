import { Dices, Play } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/StudioUI";
import { buttonClass } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RaceStatus } from "../lib/playTypes";

export function PlayRacePanel({
  status,
  scramble,
  inspectionEnabled,
  onInspectionChange,
  busy,
  onNewScramble,
  onStart,
  onCancel,
}: {
  status: RaceStatus;
  scramble: string;
  inspectionEnabled: boolean;
  onInspectionChange: (enabled: boolean) => void;
  busy: boolean;
  onNewScramble: () => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="mt-2 rounded-panel bg-surface-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("play.scramble")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {status === "idle" ? (
            <>
              <button
                type="button"
                className={buttonClass("secondary", "sm")}
                onClick={onNewScramble}
              >
                <Dices className="text-base" aria-hidden="true" />
                {t("play.newScramble")}
              </button>
              <button
                type="button"
                className={buttonClass("primary", "sm")}
                onClick={event => {
                  event.currentTarget.blur();
                  onStart();
                }}
              >
                <Play className="text-base" aria-hidden="true" />
                {t("play.startButton")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={buttonClass("danger", "sm")}
              onClick={event => {
                event.currentTarget.blur();
                onCancel();
              }}
            >
              {status === "solving" ? t("play.stopDnf") : t("play.cancelAttempt")}
            </button>
          )}
        </div>
      </div>
      <p className="mb-0 mt-2 font-mono text-sm leading-relaxed text-ink">{scramble}</p>
      <div className="mt-3">
        <Switch
          id="play-inspection"
          checked={inspectionEnabled}
          onChange={onInspectionChange}
          disabled={busy}
          label={t("play.inspectionLabel")}
        />
      </div>
    </div>
  );
}
