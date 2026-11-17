/**
 * The Skewb lane of /study: Sarah Intermediate (10 triggers: 1T · 2T · 3T)
 * and Sarah Advanced (93 cases, 16 subsets), with the same SRS practice loop
 * as the other lanes — time the recall, grade Again/Hard/Good/Easy, and let
 * the queue resurface weak cases.
 */
import { Download, FileUp } from "@/components/ui/Icon";
import { StatusFeedback } from "@/components/ui/StudioUI";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { StudySchedulePanel } from "@/features/last-layer/components/StudySchedulePanel";
import { SkewbCasePanel } from "./SkewbCasePanel";
import { SkewbCatalogPanel } from "./SkewbCatalogPanel";
import {
  SKEWB_COUNTS,
  skewbCatalogOf,
  type SkewbCatalogCase,
  type SkewbFamily,
} from "../lib/skewbCatalog";
import {
  dueAndWeakCases,
  exportSkewbStudy,
  gradeSkewbCase,
  importSkewbStudy,
  prioritizeStudyQueue,
  readSkewbStudy,
  readMasteredSkewbCaseKeys,
  todayReviewCount,
  weeklyReviewSchedule,
  writeSkewbStudy,
  writeMasteredSkewbCaseKeys,
  skewbCaseKey,
  type SkewbGrade,
  type SkewbStudyState,
} from "../lib/skewbStudy";

function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function SkewbStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  /** Reports live SRS stats so the surrounding toolbar can show them. */
  onStatsChange?: (stats: {
    reviewedToday: number;
    dailyGoal: number;
    goalPercent: number;
    queueCount: number;
    masteredCount: number;
    catalogCount: number;
  }) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<SkewbFamily>("sarah-intermediate");
  const [study, setStudy] = useState<SkewbStudyState>(() => readSkewbStudy());
  const [masteredKeys, setMasteredKeys] = useState<Set<string>>(() =>
    readMasteredSkewbCaseKeys()
  );
  const [activeCase, setActiveCase] = useState<SkewbCatalogCase | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [importError, setImportError] = useState("");
  const backupRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(
    () => [...skewbCatalogOf(family)],
    [family]
  );

  useEffect(() => {
    writeSkewbStudy(study);
  }, [study]);
  useEffect(() => {
    writeMasteredSkewbCaseKeys(masteredKeys);
  }, [masteredKeys]);

  const queue = useMemo(
    () => dueAndWeakCases(catalog, study.records, masteredKeys),
    [catalog, study.records, masteredKeys]
  );
  const ranked = useMemo(
    () => prioritizeStudyQueue(catalog, study.records, masteredKeys),
    [catalog, study.records, masteredKeys]
  );
  const reviewedToday = todayReviewCount(study.records);
  const weeklySchedule = useMemo(
    () => weeklyReviewSchedule(study.records),
    [study.records]
  );
  const weeklyTotal = weeklySchedule.reduce(
    (sum, day) => sum + day.dueCount,
    0
  );
  const weakest = ranked
    .filter(
      item =>
        masteredKeys.has(skewbCaseKey(item)) &&
        (study.records[skewbCaseKey(item)]?.attempts ?? 0) > 0
    )
    .slice(0, 5);
  const familyMasteredCount = useMemo(
    () =>
      Array.from(masteredKeys).filter(key => key.startsWith(`${family}:`)).length,
    [masteredKeys, family]
  );
  const activeMastered = activeCase
    ? masteredKeys.has(skewbCaseKey(activeCase))
    : false;

  const selectCase = useCallback((candidate: SkewbCatalogCase) => {
    setActiveCase(candidate);
    setLastElapsed(null);
    setShowAlgorithm(false);
    setTimerVersion(value => value + 1);
  }, []);
  const chooseNext = (preferWeak = false) => {
    const candidates = preferWeak ? weakest : queue;
    const fallback = candidates.length ? candidates : ranked;
    if (fallback.length) selectCase(fallback[0]);
  };
  useEffect(() => {
    if (!activeCase) chooseNext();
    // chooseNext intentionally omitted; it is stable enough for this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase, ranked, family]);
  const toggleMastered = () => {
    if (!activeCase) return;
    const key = skewbCaseKey(activeCase);
    setMasteredKeys(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const grade = (value: SkewbGrade) => {
    if (!activeCase || lastElapsed === null) return;
    const key = skewbCaseKey(activeCase);
    const record = gradeSkewbCase(
      activeCase,
      study.records[key],
      lastElapsed,
      value
    );
    setStudy(current => ({
      ...current,
      records: { ...current.records, [key]: record },
    }));
    if (value !== "again")
      setMasteredKeys(current => new Set(Array.from(current).concat(key)));
    setLastElapsed(null);
    setShowAlgorithm(false);
    setTimerVersion(version => version + 1);
    setActiveCase(null);
  };
  useEffect(() => {
    if (reviewedToday >= study.dailyGoal) setCelebrated(true);
  }, [reviewedToday, study.dailyGoal]);

  useEffect(() => {
    onStatsChange?.({
      reviewedToday,
      dailyGoal: study.dailyGoal,
      goalPercent: Math.min(100, Math.round((reviewedToday / study.dailyGoal) * 100)),
      queueCount: queue.length,
      masteredCount: familyMasteredCount,
      catalogCount: catalog.length,
    });
  }, [reviewedToday, study.dailyGoal, queue.length, familyMasteredCount, catalog.length, onStatsChange]);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = importSkewbStudy(JSON.parse(await file.text()));
      setStudy(restored.state);
      setMasteredKeys(restored.masteredKeys);
      setImportError("");
      setCelebrated(false);
    } catch {
      setImportError(t("study.importError"));
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("skewb.setLabel")}>
          {(["sarah-intermediate", "sarah-advanced"] as const).map(value => (
            <button
              key={value}
              type="button"
              aria-pressed={family === value}
              onClick={() => {
                setFamily(value);
                setActiveCase(null);
                setLastElapsed(null);
                setShowAlgorithm(false);
                setTimerVersion(version => version + 1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20 ${
                family === value
                  ? "bg-primary text-on-primary hover:bg-primary-hover"
                  : "bg-surface-2 text-ink hover:bg-surface-3"
              }`}
            >
              {value === "sarah-intermediate"
                ? t("skewb.setSarahIntermediate", {
                    count: SKEWB_COUNTS["sarah-intermediate"],
                  })
                : t("skewb.setSarahAdvanced", {
                    count: SKEWB_COUNTS["sarah-advanced"],
                  })}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          {family === "sarah-intermediate"
            ? t("skewb.laneSummarySarahIntermediate", {
                count: SKEWB_COUNTS["sarah-intermediate"],
              })
            : t("skewb.laneSummarySarahAdvanced", {
                count: SKEWB_COUNTS["sarah-advanced"],
              })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={backupRef}
            onChange={onImport}
            accept="application/json,.json"
            type="file"
            className="hidden"
            aria-label={t("study.importProgress")}
          />
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => backupRef.current?.click()}
          >
            <FileUp className="text-base mr-1" />
            {t("study.importProgress")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() =>
              download(
                "cfop-skewb-study-backup.json",
                exportSkewbStudy(study, masteredKeys)
              )
            }
          >
            <Download className="text-base mr-1" />
            {t("study.exportBackup")}
          </Button>
        </div>
      </div>

      {importError ? (
        <div className="mt-4">
          <StatusFeedback tone="danger" title={t("study.importErrorTitle")}>
            {importError}
          </StatusFeedback>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <SkewbCasePanel
            activeCase={activeCase}
            mastered={activeMastered}
            showAlgorithm={showAlgorithm}
            onToggleAlgorithm={() => setShowAlgorithm(value => !value)}
            onToggleMastered={toggleMastered}
            lastElapsed={lastElapsed}
            onTimerComplete={(completion: TimerCompletion) =>
              setLastElapsed(completion.elapsedMs)
            }
            timerVersion={timerVersion}
            language={language}
            onGrade={grade}
            onChooseNext={() => chooseNext()}
            canChooseNext={Boolean(queue.length || ranked.length)}
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <StudySchedulePanel
            schedule={weeklySchedule}
            totalDue={weeklyTotal}
            weakCaseCount={weakest.length}
            onReviewWeakest={() => chooseNext(true)}
            celebration={celebrated}
            onDismissCelebration={() => setCelebrated(false)}
          />
        </div>
      </div>

      <div className="mt-6">
        <SkewbCatalogPanel
          cases={catalog}
          masteredKeys={masteredKeys}
          activeCase={activeCase}
          onSelect={selectCase}
          onMasteredChange={setMasteredKeys}
        />
      </div>
    </div>
  );
}
