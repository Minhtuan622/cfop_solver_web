/** Study is the only home for the Last Layer SRS and for the 3-Style BLD path. */
import { Download, FileUp } from "@/components/ui/Icon";
import { PageHeader, StatusFeedback } from "@/components/ui/StudioUI";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { BldStudyLab } from "@/features/bld";
import { CfopStudyLab } from "@/features/cfop";
import { TwoByTwoStudyLab } from "@/features/twoByTwo";
import { PyraminxStudyLab } from "@/features/pyraminx";
import { SkewbStudyLab } from "@/features/skewb";
import { SquareOneStudyLab } from "@/features/squareOne";
import { FourByFourParityStudyLab } from "@/features/fourByFourParity";
import { FiveByFiveL2EStudyLab } from "@/features/fiveByFiveL2E";
import { FtoL3tStudyLab } from "@/features/ftoL3t";
import { Fto2LookL3tStudyLab } from "@/features/fto2LookL3t";
import { LastLayerExplorer } from "@/features/last-layer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  listLastLayerCasesInBrowser,
  type LastLayerCatalogCase,
} from "@/lib/solverRuntime";
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
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import {
  readLaneProgress,
  writeLaneProgress,
  type LaneProgressMap,
} from "../lib/studyLaneProgress";

const BACKUP_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink outline-none transition data-[highlighted]:bg-surface-3";

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
  lane === "bld"
    ? "bld"
    : lane === "cfop"
      ? "cfop"
      : lane === "2x2" || lane === "twobytwo"
        ? "twoByTwo"
        : lane === "pyraminx" || lane === "pyram"
          ? "pyraminx"
          : lane === "skewb"
            ? "skewb"
            : lane === "sq1" || lane === "square1" || lane === "square-1"
              ? "sq1"
              : lane === "4x4" || lane === "444" || lane === "parity"
                ? "parity"
                : lane === "5x5" || lane === "555" || lane === "l2e"
                  ? "l2e"
                  : lane === "fto2" || lane === "2look" || lane === "l3t2"
                    ? "l3t2"
                  : lane === "fto" || lane === "l3t"
                    ? "l3t"
                    : "lastLayer";

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
  const [cfopStats, setCfopStats] = useState({
    reviewedToday: 0,
    dailyGoal: 12,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [twoByTwoStats, setTwoByTwoStats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [bldStats, setBldStats] = useState({
    reviewedToday: 0,
    dailyGoal: 12,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [pyraminxStats, setPyraminxStats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [skewbStats, setSkewbStats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [sq1Stats, setSq1Stats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [parityStats, setParityStats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [l2eStats, setL2EStats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [l3t2Stats, setL3T2Stats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
  const [l3tStats, setL3TStats] = useState({
    reviewedToday: 0,
    dailyGoal: 10,
    goalPercent: 0,
    queueCount: 0,
    masteredCount: 0,
    catalogCount: 0,
  });
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
  // Non-LL lanes keep their own SRS stats; the toolbar shows whichever lane is active.
  const laneStats = {
    cfop: cfopStats,
    twoByTwo: twoByTwoStats,
    bld: bldStats,
    pyraminx: pyraminxStats,
    skewb: skewbStats,
    sq1: sq1Stats,
    parity: parityStats,
    l2e: l2eStats,
    l3t: l3tStats,
    l3t2: l3t2Stats,
  } as const;
  const activeLaneStats =
    studyLane === "lastLayer" ? null : laneStats[studyLane];

  // Lưu tiến độ của chủ đề đang mở cho lưới chủ đề (xem studyLaneProgress).
  const [laneProgress, setLaneProgress] = useState<LaneProgressMap>(readLaneProgress);
  const currentMastered = activeLaneStats?.masteredCount ?? masteredKeys.size;
  const currentTotal = activeLaneStats?.catalogCount ?? catalog.length;
  useEffect(() => {
    setLaneProgress(
      writeLaneProgress(studyLane, { mastered: currentMastered, total: currentTotal })
    );
  }, [studyLane, currentMastered, currentTotal]);

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
        title={t("study.title")}
        description={
          studyLane === "lastLayer"
            ? t("study.description.lastLayer")
            : studyLane === "bld"
              ? t("study.description.bld")
              : studyLane === "twoByTwo"
                ? t("study.description.twoByTwo")
                : studyLane === "pyraminx"
                  ? t("study.description.pyraminx")
                  : studyLane === "skewb"
                    ? t("study.description.skewb")
                    : studyLane === "sq1"
                      ? t("study.description.sq1")
                      : studyLane === "parity"
                        ? t("study.description.parity")
                        : studyLane === "l2e"
                          ? t("study.description.l2e")
                          : studyLane === "l3t"
                            ? t("study.description.l3t")
                            : studyLane === "l3t2"
                              ? t("study.description.l3t2")
                              : t("study.description.cfop")
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
              {/* Nhập/xuất tiến độ ít dùng: gom vào một menu nhỏ. */}
              <Dropdown
                id="study-backup-menu"
                label={t("study.backupMenu")}
                variant="soft"
                button={
                  <>
                    <Download className="text-base" aria-hidden="true" />
                    <span>{t("study.backupMenu")}</span>
                  </>
                }
              >
                <DropdownItem
                  className={BACKUP_ITEM_CLASS}
                  onSelect={() => backupRef.current?.click()}
                >
                  <FileUp className="text-base" aria-hidden="true" />
                  {t("study.importProgress")}
                </DropdownItem>
                <DropdownItem
                  className={BACKUP_ITEM_CLASS}
                  onSelect={() =>
                    download(
                      "cfop-last-layer-study-backup.json",
                      exportLastLayerStudy(study, masteredKeys)
                    )
                  }
                >
                  <Download className="text-base" aria-hidden="true" />
                  {t("study.exportBackup")}
                </DropdownItem>
              </Dropdown>
            </>
          ) : undefined
        }
      />

      <StudyToolbar
        lane={studyLane}
        onLaneChange={setStudyLane}
        reviewedToday={activeLaneStats?.reviewedToday ?? reviewedToday}
        dailyGoal={activeLaneStats?.dailyGoal ?? study.dailyGoal}
        goalPercent={activeLaneStats?.goalPercent ?? dailyPercent}
        queueCount={activeLaneStats?.queueCount ?? queue.length}
        masteredCount={activeLaneStats?.masteredCount ?? masteredKeys.size}
        catalogCount={activeLaneStats?.catalogCount ?? catalog.length}
        progress={laneProgress}
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

          <div className="grid grid-cols-12 gap-6 mt-6">
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
              onMasteredChange={setMasteredKeys}
            />
          </div>
        </>
      ) : studyLane === "cfop" ? (
        <div className="mt-6">
          <CfopStudyLab language={language} onStatsChange={setCfopStats} />
        </div>
      ) : studyLane === "twoByTwo" ? (
        <div className="mt-6">
          <TwoByTwoStudyLab language={language} onStatsChange={setTwoByTwoStats} />
        </div>
      ) : studyLane === "pyraminx" ? (
        <div className="mt-6">
          <PyraminxStudyLab language={language} onStatsChange={setPyraminxStats} />
        </div>
      ) : studyLane === "skewb" ? (
        <div className="mt-6">
          <SkewbStudyLab language={language} onStatsChange={setSkewbStats} />
        </div>
      ) : studyLane === "sq1" ? (
        <div className="mt-6">
          <SquareOneStudyLab language={language} onStatsChange={setSq1Stats} />
        </div>
      ) : studyLane === "parity" ? (
        <div className="mt-6">
          <FourByFourParityStudyLab language={language} onStatsChange={setParityStats} />
        </div>
      ) : studyLane === "l2e" ? (
        <div className="mt-6">
          <FiveByFiveL2EStudyLab language={language} onStatsChange={setL2EStats} />
        </div>
      ) : studyLane === "l3t" ? (
        <div className="mt-6">
          <FtoL3tStudyLab language={language} onStatsChange={setL3TStats} />
        </div>
      ) : studyLane === "l3t2" ? (
        <div className="mt-6">
          <Fto2LookL3tStudyLab language={language} onStatsChange={setL3T2Stats} />
        </div>
      ) : (
        <div className="mt-6">
          <BldStudyLab language={language} onStatsChange={setBldStats} />
        </div>
      )}
    </div>
  );
}
