/**
 * The 4×4 Parity lane of /study: the PLL parity algorithms (22 cases) with
 * the same SRS practice loop as the other lanes — time the recall, grade
 * Again/Hard/Good/Easy, and let the queue resurface weak cases.
 */
import { Download, FileUp } from "@/components/ui/Icon";
import { StatusFeedback } from "@/components/ui/StudioUI";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { StudySchedulePanel } from "@/features/last-layer/components/StudySchedulePanel";
import { FourByFourParityCasePanel } from "./FourByFourParityCasePanel";
import { FourByFourParityCatalogPanel } from "./FourByFourParityCatalogPanel";
import {
  FOUR_BY_FOUR_PARITY_COUNTS,
  PARITY_CATALOG,
  type FourByFourParityCatalogCase,
} from "../lib/fourByFourParityCatalog";
import {
  dueAndWeakCases,
  exportFourByFourParityStudy,
  gradeFourByFourParityCase,
  importFourByFourParityStudy,
  prioritizeStudyQueue,
  readFourByFourParityStudy,
  readMasteredFourByFourParityCaseKeys,
  todayReviewCount,
  weeklyReviewSchedule,
  writeFourByFourParityStudy,
  writeMasteredFourByFourParityCaseKeys,
  fourByFourParityCaseKey,
  type FourByFourParityGrade,
  type FourByFourParityStudyState,
} from "../lib/fourByFourParityStudy";

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

export function FourByFourParityStudyLab({
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
  const [study, setStudy] = useState<FourByFourParityStudyState>(() => readFourByFourParityStudy());
  const [masteredKeys, setMasteredKeys] = useState<Set<string>>(() =>
    readMasteredFourByFourParityCaseKeys()
  );
  const [activeCase, setActiveCase] = useState<FourByFourParityCatalogCase | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [importError, setImportError] = useState("");
  const backupRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(() => [...PARITY_CATALOG], []);

  useEffect(() => {
    writeFourByFourParityStudy(study);
  }, [study]);
  useEffect(() => {
    writeMasteredFourByFourParityCaseKeys(masteredKeys);
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
        masteredKeys.has(fourByFourParityCaseKey(item)) &&
        (study.records[fourByFourParityCaseKey(item)]?.attempts ?? 0) > 0
    )
    .slice(0, 5);
  const activeMastered = activeCase
    ? masteredKeys.has(fourByFourParityCaseKey(activeCase))
    : false;

  const selectCase = useCallback((candidate: FourByFourParityCatalogCase) => {
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
  }, [activeCase, ranked]);
  const toggleMastered = () => {
    if (!activeCase) return;
    const key = fourByFourParityCaseKey(activeCase);
    setMasteredKeys(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const grade = (value: FourByFourParityGrade) => {
    if (!activeCase || lastElapsed === null) return;
    const key = fourByFourParityCaseKey(activeCase);
    const record = gradeFourByFourParityCase(
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
      masteredCount: masteredKeys.size,
      catalogCount: catalog.length,
    });
  }, [reviewedToday, study.dailyGoal, queue.length, masteredKeys.size, catalog.length, onStatsChange]);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = importFourByFourParityStudy(JSON.parse(await file.text()));
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
        <div className="text-sm text-muted">
          {t("parity.laneSummary", { count: FOUR_BY_FOUR_PARITY_COUNTS["pll-parity"] })}
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
                "cfop-4x4parity-study-backup.json",
                exportFourByFourParityStudy(study, masteredKeys)
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
          <FourByFourParityCasePanel
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
        <FourByFourParityCatalogPanel
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
