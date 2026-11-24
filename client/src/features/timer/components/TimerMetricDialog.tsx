/** Hộp thoại chi tiết một chỉ số: các lượt tạo nên chỉ số, sơ đồ khối, sao chép scramble, export ảnh ao5. */
import { Eye, EyeOff, ImageDown } from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { metricEvidence, type TimerMetricKey } from "@/lib/timerRecords";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";
import { type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { IconButton } from "@/components/ui/StudioUI";
import { Button } from "@/components/ui/Button";

import { buttonClass } from "@/components/ui/Button";

import { exportAo5Image } from "../lib/timerImageExport";
import { MetricDetailCard } from "./MetricDetailCard";

export function TimerMetricDialog({
  selectedMetric,
  selectedMetricDetail,
  isThreeByThree,
  formatMetric,
  onClose,
  onExpandCube,
  onReplay,
  onAnalyze,
}: {
  selectedMetric: TimerMetricKey | null;
  selectedMetricDetail: ReturnType<typeof metricEvidence> | null;
  isThreeByThree: boolean;
  formatMetric: (value: number | null | undefined) => string;
  onClose: () => void;
  onExpandCube: (entry: SolveHistoryEntry) => void;
  onReplay: (entry: SolveHistoryEntry) => void;
  onAnalyze?: (entry: SolveHistoryEntry) => void;
}) {
  const { language, t } = useLanguage();
  const [copiedScrambleId, setCopiedScrambleId] = useState<string | null>(null);
  const [showMetricCubeNets, setShowMetricCubeNets] = useState(
    () => readStoredValue("cfop-metric-cubenets") !== "off"
  );
  // Timer quick controls are session-only overrides; long-lived defaults are owned by Settings.
  useEffect(() => {
    writeStoredValue("cfop-metric-cubenets", showMetricCubeNets ? "on" : "off");
  }, [showMetricCubeNets]);
  const metricLabel = (key: TimerMetricKey) =>
    key === "pb"
      ? t("timer.pb")
      : key === "total"
        ? t("timer.total")
        : key.toUpperCase();
  const copyMetricScramble = (entry: SolveHistoryEntry) => {
    const complete = () => {
      setCopiedScrambleId(entry.id);
      window.setTimeout(
        () =>
          setCopiedScrambleId(current =>
            current === entry.id ? null : current
          ),
        1800
      );
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard
        .writeText(entry.input)
        .then(complete)
        .catch(() => undefined);
      return;
    }
    const fallback = document.createElement("textarea");
    fallback.value = entry.input;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    complete();
  };

  return (
    <Dialog
      open={Boolean(selectedMetric)}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>
              {t("timer.metricDetail")} ·{" "}
              {selectedMetric ? metricLabel(selectedMetric) : "—"}
            </DialogTitle>
            <DialogDescription>
              {selectedMetricDetail?.value === undefined
                ? t("timer.metricNotEnough")
                : selectedMetric === "total"
                  ? `${selectedMetricDetail.entries.length} ${t("timer.total").toLowerCase()}`
                : formatMetric(selectedMetricDetail?.value)}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div
              className="inline-flex flex-wrap items-center gap-1 text-xs"
              role="group"
            >
              {isThreeByThree && (
                <IconButton
                  label={
                    showMetricCubeNets
                      ? t("timer.hideCubeNet")
                      : t("timer.showCubeNet")
                  }
                  icon={
                    showMetricCubeNets ? (
                      <EyeOff className="text-base" />
                    ) : (
                      <Eye className="text-base" />
                    )
                  }
                  onClick={() => setShowMetricCubeNets(value => !value)}
                  className={`${buttonClass("secondary", "md")}`}
                />
              )}
              {isThreeByThree &&
                selectedMetric === "ao5" &&
                selectedMetricDetail && (
                  <IconButton
                    label={t("timer.exportAo5")}
                    icon={<ImageDown className="text-base" />}
                    onClick={() =>
                      exportAo5Image(
                        selectedMetricDetail.entries,
                        selectedMetricDetail.exclusions,
                        selectedMetricDetail.value,
                        t,
                        language
                      )
                    }
                    className={`${buttonClass("primary", "md")}`}
                  />
                )}
            </div>
            <span className="text-sm text-muted">
              {selectedMetricDetail?.entries.length ?? 0}{" "}
              {t("timer.solveCount", {
                count: selectedMetricDetail?.entries.length ?? 0,
              })}
            </span>
          </div>
          {selectedMetric?.startsWith("ao") && (
            <div className="flex flex-wrap gap-1 mt-4">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success">
                {t("timer.bestDiscarded")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-danger text-on-danger">
                {t("timer.worstDiscarded")}
              </span>
            </div>
          )}
          {selectedMetricDetail?.entries.length ? (
            <div className="overflow-hidden rounded-panel bg-surface mt-4">
              {selectedMetricDetail.entries.map(entry => (
                <MetricDetailCard
                  key={entry.id}
                  entry={entry}
                  exclusion={selectedMetricDetail.exclusions[entry.id]}
                  showCubeNet={showMetricCubeNets}
                  copied={copiedScrambleId === entry.id}
                  onCopy={copyMetricScramble}
                  onExpand={onExpandCube}
                  onReplay={onReplay}
                  onAnalyze={onAnalyze}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
              {t("timer.noScrambleYet")}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
          >
            {t("timer.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
