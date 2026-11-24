/**
 * Vòng luyện SRS dùng chung của các lane Học thêm: giữ trạng thái học và danh
 * sách case đã thuộc (tự ghi vào localStorage), xếp hàng ôn, chọn case kế tiếp,
 * chấm điểm, nhập backup và báo số liệu cho thanh công cụ bên ngoài.
 *
 * Lane giữ state chọn bộ (family) và catalog của mình rồi truyền vào; hook này
 * không biết gì về puzzle cụ thể.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";
import {
  caseStudyKey,
  dueAndWeakCases,
  prioritizeStudyQueue,
  todayReviewCount,
  weeklyReviewSchedule,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
} from "@/lib/caseStudy";
import type { CasePracticeProps } from "./components/CasePracticePanel";

/** Số liệu SRS trực tiếp mà lane báo cho thanh công cụ của trang Học thêm. */
export type CaseStudyLaneStats = {
  reviewedToday: number;
  dailyGoal: number;
  goalPercent: number;
  queueCount: number;
  masteredCount: number;
  catalogCount: number;
};

/** Các hàm lưu trữ của một lane (xem `createCaseStudyStore`). */
export type CaseStudyLaneStore<StudyRecord extends CaseStudyRecord> = {
  read: () => CaseStudyState<StudyRecord["family"]>;
  write: (state: CaseStudyState<StudyRecord["family"]>) => void;
  readMasteredKeys: () => Set<string>;
  writeMasteredKeys: (keys: Set<string>) => void;
  grade: (item: LastLayerCatalogCase, existing: StudyRecord | undefined, elapsedMs: number, grade: CaseStudyGrade) => StudyRecord;
  importStudy: (payload: unknown) => { state: CaseStudyState<StudyRecord["family"]>; masteredKeys: Set<string> };
};

export type UseCaseStudyLaneOptions<Case extends LastLayerCatalogCase, StudyRecord extends CaseStudyRecord> = {
  store: CaseStudyLaneStore<StudyRecord>;
  /** Các case của bộ đang chọn. Phải giữ cùng tham chiếu giữa các lần render. */
  catalog: Case[];
  /**
   * Bộ đang chọn khi lane có nhiều bộ: số case đã thuộc chỉ đếm trong bộ này.
   * Bỏ trống khi lane chỉ có một bộ (đếm mọi case đã thuộc).
   */
  family?: string;
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
};

export function useCaseStudyLane<Case extends LastLayerCatalogCase, StudyRecord extends CaseStudyRecord>({
  store,
  catalog,
  family,
  onStatsChange,
}: UseCaseStudyLaneOptions<Case, StudyRecord>) {
  type State = CaseStudyState<StudyRecord["family"]>;
  const { t } = useLanguage();
  const [study, setStudy] = useState<State>(() => store.read());
  const [masteredKeys, setMasteredKeys] = useState<Set<string>>(() =>
    store.readMasteredKeys()
  );
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [importError, setImportError] = useState("");
  const backupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    store.write(study);
  }, [study]);
  useEffect(() => {
    store.writeMasteredKeys(masteredKeys);
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
        masteredKeys.has(caseStudyKey(item)) &&
        (study.records[caseStudyKey(item)]?.attempts ?? 0) > 0
    )
    .slice(0, 5);
  const masteredCount = useMemo(
    () =>
      family === undefined
        ? masteredKeys.size
        : Array.from(masteredKeys).filter(key => key.startsWith(`${family}:`)).length,
    [masteredKeys, family]
  );
  const activeMastered = activeCase
    ? masteredKeys.has(caseStudyKey(activeCase))
    : false;

  const selectCase = useCallback((candidate: Case) => {
    setActiveCase(candidate);
    setLastElapsed(null);
    setShowAlgorithm(false);
    setTimerVersion(value => value + 1);
  }, []);
  /** Bỏ case đang luyện (vd. khi đổi bộ); case kế tiếp được chọn lại tự động. */
  const resetActiveCase = () => {
    setActiveCase(null);
    setLastElapsed(null);
    setShowAlgorithm(false);
    setTimerVersion(version => version + 1);
  };
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
  // Mở từ liên kết có `?case=<id>` (vd. từ phân tích solve): chọn đúng case đó một lần.
  const requestedCase = useRef(
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("case")
  );
  useEffect(() => {
    const id = requestedCase.current;
    if (!id) return;
    const found = catalog.find(item => item.id === id);
    if (!found) return;
    requestedCase.current = null;
    selectCase(found);
  }, [catalog, selectCase]);
  const toggleMastered = () => {
    if (!activeCase) return;
    const key = caseStudyKey(activeCase);
    setMasteredKeys(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const grade = (value: CaseStudyGrade) => {
    if (!activeCase || lastElapsed === null) return;
    const key = caseStudyKey(activeCase);
    const record = store.grade(
      activeCase,
      study.records[key] as StudyRecord | undefined,
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
      masteredCount,
      catalogCount: catalog.length,
    });
  }, [reviewedToday, study.dailyGoal, queue.length, masteredCount, catalog.length, onStatsChange]);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = store.importStudy(JSON.parse(await file.text()));
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

  const casePanelProps: CasePracticeProps<Case> = {
    activeCase,
    mastered: activeMastered,
    showAlgorithm,
    onToggleAlgorithm: () => setShowAlgorithm(value => !value),
    onToggleMastered: toggleMastered,
    lastElapsed,
    onTimerComplete: (completion: TimerCompletion) =>
      setLastElapsed(completion.elapsedMs),
    timerVersion,
    onGrade: grade,
    onChooseNext: () => chooseNext(),
    canChooseNext: Boolean(queue.length || ranked.length),
  };

  const catalogPanelProps = {
    cases: catalog,
    masteredKeys,
    activeCase,
    onSelect: selectCase,
    onMasteredChange: setMasteredKeys,
  };

  return {
    study,
    masteredKeys,
    weeklySchedule,
    weeklyTotal,
    weakCaseCount: weakest.length,
    reviewWeakest: () => chooseNext(true),
    celebrated,
    dismissCelebration: () => setCelebrated(false),
    importError,
    backupRef,
    onImport,
    resetActiveCase,
    casePanelProps,
    catalogPanelProps,
  };
}

export type CaseStudyLane = ReturnType<typeof useCaseStudyLane>;
