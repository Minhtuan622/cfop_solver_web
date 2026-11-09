/** Study is the only home for the Last Layer SRS and for the 3-Style BLD path. */
import { Download, FileUp } from "@/components/ui/Icon";
import { PageHeader, StatusFeedback } from "@/components/ui/StudioUI";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { BldStudyLab } from "@/features/bld";
import { LastLayerExplorer } from "@/features/last-layer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  listLastLayerCasesInBrowser,
  type LastLayerCatalogCase,
} from "@/lib/solverRuntime";
import { readSolverSettings, type SolverSettings } from "@/lib/appSettings";
import {
  caseKey,
  dueAndWeakCases,
  exportLastLayerStudy,
  gradeCase,
  importLastLayerStudy,
  prioritizeStudyQueue,
  readLastLayerStudy,
  readMasteredCaseKeys,
  todayReviewCount,
  weeklyReviewSchedule,
  writeLastLayerStudy,
  writeMasteredCaseKeys,
  type StudyGrade,
  type StudyState,
} from "@/features/last-layer";
import { StudyCasePanel } from "./StudyCasePanel";
import { StudySchedulePanel } from "./StudySchedulePanel";
import { StudyToolbar, type StudyLane } from "./StudyToolbar";

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
export const studyLaneForQuery = (lane: string | null): StudyLane =>
  lane === "bld" ? "bld" : "lastLayer";

export function LastLayerStudyLab({ language }: { language: "vi" | "en" }) {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [family, setFamily] = useState<"all" | "zbll" | "1lll">("all");
  const [catalog, setCatalog] = useState<LastLayerCatalogCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState<StudyState>(() => readLastLayerStudy());
  const [masteredKeys, setMasteredKeys] = useState<Set<string>>(() =>
    readMasteredCaseKeys()
  );
  const [activeCase, setActiveCase] = useState<LastLayerCatalogCase | null>(
    null
  );
  const [timerVersion, setTimerVersion] = useState(0);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [caseView, setCaseView] = useState<"2d" | "3d">("2d");
  const [celebrated, setCelebrated] = useState(false);
  const [importError, setImportError] = useState("");
  const [studyLane, setStudyLane] = useState<StudyLane>("lastLayer");
  const [solverSettings, setSolverSettings] = useState<SolverSettings>(() =>
    readSolverSettings()
  );
  const backupRef = useRef<HTMLInputElement>(null);

  const requestedCase = useMemo(() => {
    const params = new URLSearchParams(
      window.location.search || location.split("?")[1] || ""
    );
    const family = params.get("family");
    const id = params.get("case");
    return (family === "zbll" || family === "1lll") && id
      ? { family: family as "zbll" | "1lll", id }
      : null;
  }, [location]);
  const requestedLane = useMemo(
    () =>
      new URLSearchParams(
        window.location.search || location.split("?")[1] || ""
      ).get("lane"),
    [location]
  );

  useEffect(() => {
    const refresh = () => setSolverSettings(readSolverSettings());
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(() => {
    let live = true;
    listLastLayerCasesInBrowser({ family: "all", limit: 2000 })
      .then(cases => {
        if (live) {
          setCatalog(cases);
          setLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setCatalog([]);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!requestedCase || !catalog.length) return;
    const match = catalog.find(
      item =>
        item.family === requestedCase.family && item.id === requestedCase.id
    );
    if (!match) return;
    setStudyLane("lastLayer");
    setFamily(requestedCase.family);
    selectCase(match);
  }, [catalog, requestedCase]);
  useEffect(() => {
    setStudyLane(studyLaneForQuery(requestedLane));
  }, [requestedLane]);
  useEffect(() => {
    writeLastLayerStudy(study);
  }, [study]);
  useEffect(() => {
    writeMasteredCaseKeys(masteredKeys);
  }, [masteredKeys]);

  const scope = useMemo(
    () =>
      family === "all"
        ? catalog
        : catalog.filter(item => item.family === family),
    [catalog, family]
  );
  const queue = useMemo(
    () => dueAndWeakCases(scope, study.records, masteredKeys),
    [scope, study.records, masteredKeys]
  );
  const ranked = useMemo(
    () => prioritizeStudyQueue(scope, study.records, masteredKeys),
    [scope, study.records, masteredKeys]
  );
  const reviewedToday = todayReviewCount(study.records);
  const dailyPercent = Math.min(
    100,
    Math.round((reviewedToday / study.dailyGoal) * 100)
  );
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
        masteredKeys.has(caseKey(item)) &&
        (study.records[caseKey(item)]?.attempts ?? 0) > 0
    )
    .slice(0, 5);
  const activeMastered = activeCase
    ? masteredKeys.has(caseKey(activeCase))
    : false;

  const selectCase = (candidate: LastLayerCatalogCase) => {
    setActiveCase(candidate);
    setLastElapsed(null);
    setShowAlgorithm(false);
    setTimerVersion(value => value + 1);
  };
  const chooseNext = (preferWeak = false) => {
    const candidates = preferWeak ? weakest : queue;
    const fallback = candidates.length ? candidates : ranked;
    if (fallback.length) selectCase(fallback[0]);
  };
  useEffect(() => {
    if (!activeCase && catalog.length) chooseNext();
  }, [activeCase, catalog.length]);
  const toggleMastered = () => {
    if (!activeCase) return;
    const key = caseKey(activeCase);
    setMasteredKeys(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const completeTimer = (completion: TimerCompletion) =>
    setLastElapsed(completion.elapsedMs);
  const grade = (value: StudyGrade) => {
    if (!activeCase || lastElapsed === null) return;
    const key = caseKey(activeCase);
    const record = gradeCase(
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
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = importLastLayerStudy(JSON.parse(await file.text()));
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
      <PageHeader
        eyebrow={t("study.eyebrow")}
        title={t("study.title")}
        description={
          studyLane === "lastLayer"
            ? t("study.description.lastLayer")
            : t("study.description.bld")
        }
        actions={
          studyLane === "lastLayer" ? (
            <>
              <input
                ref={backupRef}
                onChange={onImport}
                accept="application/json,.json"
                type="file"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => backupRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
              >
                <FileUp className="text-base mr-1" />
                {t("study.importProgress")}
              </button>
              <button
                type="button"
                onClick={() =>
                  download(
                    "cfop-last-layer-study-backup.json",
                    exportLastLayerStudy(study, masteredKeys)
                  )
                }
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
              >
                <Download className="text-base mr-1" />
                {t("study.exportBackup")}
              </button>
            </>
          ) : undefined
        }
      />

      <StudyToolbar
        lane={studyLane}
        onLaneChange={setStudyLane}
        reviewedToday={reviewedToday}
        dailyGoal={study.dailyGoal}
        goalPercent={dailyPercent}
        hint={t("study.goalHint", { count: queue.length })}
        queueCount={queue.length}
        masteredCount={masteredKeys.size}
        catalogCount={catalog.length}
      />

      {studyLane === "lastLayer" ? (
        <>
          {importError ? (
            <div className="mt-6">
              <StatusFeedback tone="danger" title={t("study.importErrorTitle")}>
                {importError}
              </StatusFeedback>
            </div>
          ) : null}

          <div className="grid grid-cols-12 gap-6 mt-0">
            <div className="col-span-12 xl:col-span-8">
              <StudyCasePanel
                activeCase={activeCase}
                loading={loading}
                mastered={activeMastered}
                view={caseView}
                onViewChange={setCaseView}
                showAlgorithm={showAlgorithm}
                onToggleAlgorithm={() => setShowAlgorithm(value => !value)}
                onToggleMastered={toggleMastered}
                lastElapsed={lastElapsed}
                onTimerComplete={completeTimer}
                timerVersion={timerVersion}
                crossColor={solverSettings.crossColor}
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
            <LastLayerExplorer
              catalog={catalog}
              family={family}
              selectedCase={activeCase}
              masteredKeys={masteredKeys}
              onFamily={next => {
                setFamily(next);
                setActiveCase(null);
              }}
              onSelect={selectCase}
            />
          </div>
        </>
      ) : (
        <div className="mt-6">
          <BldStudyLab language={language} />
        </div>
      )}
    </div>
  );
}
