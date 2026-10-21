/** Xưởng Cơ Khí Tốc Độ — Study là nhà duy nhất cho SRS lẫn catalog Last Layer. */
/* Xưởng Cơ Khí Tốc Độ — algorithm notation is independently scalable; the study apparatus and timer chrome remain calibrated. */
import { Check, Dices, Download, FileUp, Sparkles, TimerReset } from "@/components/ui/BootstrapIcon";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { BldStudyLab } from "@/features/bld";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { CubeNet } from "@/components/common/CubeNet";
import { LastLayerExplorer } from "@/features/last-layer";
import { SolveTimer, type TimerCompletion } from "@/components/common/SolveTimer";
import { StatusFeedback } from "@/components/ui/BootstrapUI";
import { caseKey, dueAndWeakCases, exportLastLayerStudy, gradeCase, importLastLayerStudy, prioritizeStudyQueue, readLastLayerStudy, readMasteredCaseKeys, todayReviewCount, weeklyReviewSchedule, writeLastLayerStudy, writeMasteredCaseKeys, type StudyGrade, type StudyState } from "@/features/last-layer";
import { listLastLayerCasesInBrowser, type LastLayerCatalogCase } from "@/lib/solverRuntime";
import { readSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { formatTimerReadout } from "@/lib/solveHistory";

function download(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function StudyCatalogSkeleton() { return <div className="mt-4 placeholder-glow text-body-secondary" role="status" aria-label="Đang nạp catalog Study"><div className="row g-3"><div className="col-12 col-lg-7"><div className="border rounded p-3"><span className="placeholder col-3 mb-3" /><span className="placeholder col-12" style={{ height: "16rem" }} /><div className="d-flex gap-2 mt-3"><span className="placeholder col-3" /><span className="placeholder col-3" /></div></div></div><div className="col-12 col-lg-5"><div className="border rounded p-3"><span className="placeholder col-5 mb-3" /><span className="placeholder col-12" style={{ height: "9rem" }} /><span className="placeholder col-8 mt-3" /></div></div></div><span className="visually-hidden">Đang nạp catalog Study</span></div>; }
export const studyLaneForQuery = (lane: string | null): "lastLayer" | "bld" => lane === "bld" ? "bld" : "lastLayer";

export function LastLayerStudyLab({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const [location] = useLocation();
  const [family, setFamily] = useState<"all" | "zbll" | "1lll">("all");
  const [catalog, setCatalog] = useState<LastLayerCatalogCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState<StudyState>(() => readLastLayerStudy());
  const [masteredKeys, setMasteredKeys] = useState<Set<string>>(() => readMasteredCaseKeys());
  const [activeCase, setActiveCase] = useState<LastLayerCatalogCase | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [caseView, setCaseView] = useState<"2d" | "3d">("2d");
  const [celebrated, setCelebrated] = useState(false);
  const [importError, setImportError] = useState("");
  const [studyLane, setStudyLane] = useState<"lastLayer" | "bld">("lastLayer");
  const [solverSettings, setSolverSettings] = useState<SolverSettings>(() => readSolverSettings());
  const backupRef = useRef<HTMLInputElement>(null);

  const requestedCase = useMemo(() => {
    const params = new URLSearchParams(window.location.search || location.split("?")[1] || "");
    const family = params.get("family");
    const id = params.get("case");
    return (family === "zbll" || family === "1lll") && id ? { family: family as "zbll" | "1lll", id } : null;
  }, [location]);
  const requestedLane = useMemo(() => new URLSearchParams(window.location.search || location.split("?")[1] || "").get("lane"), [location]);

  useEffect(() => { const refresh = () => setSolverSettings(readSolverSettings()); window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh); return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); }; }, []);
  useEffect(() => { let live = true; listLastLayerCasesInBrowser({ family: "all", limit: 2000 }).then((cases) => { if (live) { setCatalog(cases); setLoading(false); } }).catch(() => { if (live) { setCatalog([]); setLoading(false); } }); return () => { live = false; }; }, []);
  useEffect(() => {
    if (!requestedCase || !catalog.length) return;
    const match = catalog.find((item) => item.family === requestedCase.family && item.id === requestedCase.id);
    if (!match) return;
    setStudyLane("lastLayer");
    setFamily(requestedCase.family);
    selectCase(match);
  }, [catalog, requestedCase]);
  useEffect(() => { setStudyLane(studyLaneForQuery(requestedLane)); }, [requestedLane]);
  useEffect(() => { writeLastLayerStudy(study); }, [study]);
  useEffect(() => { writeMasteredCaseKeys(masteredKeys); }, [masteredKeys]);

  const scope = useMemo(() => family === "all" ? catalog : catalog.filter((item) => item.family === family), [catalog, family]);
  const queue = useMemo(() => dueAndWeakCases(scope, study.records, masteredKeys), [scope, study.records, masteredKeys]);
  const ranked = useMemo(() => prioritizeStudyQueue(scope, study.records, masteredKeys), [scope, study.records, masteredKeys]);
  const reviewedToday = todayReviewCount(study.records);
  const dailyPercent = Math.min(100, Math.round((reviewedToday / study.dailyGoal) * 100));
  const weeklySchedule = useMemo(() => weeklyReviewSchedule(study.records), [study.records]);
  const weeklyTotal = weeklySchedule.reduce((sum, day) => sum + day.dueCount, 0);
  const weakest = ranked.filter((item) => masteredKeys.has(caseKey(item)) && (study.records[caseKey(item)]?.attempts ?? 0) > 0).slice(0, 5);
  const queueLabel = queue.length ? (masteredKeys.has(caseKey(queue[0])) ? (vi ? "ÔN LẠI ĐẾN HẠN / CASE YẾU" : "DUE REVIEW / WEAK CASE") : (vi ? "CASE CHƯA THUỘC" : "UNMASTERED CASE")) : (vi ? "ĐÃ XỬ LÝ HÀNG ĐỢI" : "QUEUE CLEARED");
  const activeMastered = activeCase ? masteredKeys.has(caseKey(activeCase)) : false;

  const selectCase = (candidate: LastLayerCatalogCase) => { setActiveCase(candidate); setLastElapsed(null); setShowAlgorithm(false); setTimerVersion((value) => value + 1); };
  const chooseNext = (preferWeak = false) => { const candidates = preferWeak ? weakest : queue; const fallback = candidates.length ? candidates : ranked; if (fallback.length) selectCase(fallback[0]); };
  useEffect(() => { if (!activeCase && catalog.length) chooseNext(); }, [activeCase, catalog.length]);
  const toggleMastered = () => { if (!activeCase) return; const key = caseKey(activeCase); setMasteredKeys((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; }); };
  const completeTimer = (completion: TimerCompletion) => setLastElapsed(completion.elapsedMs);
  const grade = (value: StudyGrade) => { if (!activeCase || lastElapsed === null) return; const key = caseKey(activeCase); const record = gradeCase(activeCase, study.records[key], lastElapsed, value); setStudy((current) => ({ ...current, records: { ...current.records, [key]: record } })); if (value !== "again") setMasteredKeys((current) => new Set(Array.from(current).concat(key))); setLastElapsed(null); setShowAlgorithm(false); setTimerVersion((version) => version + 1); setActiveCase(null); };
  useEffect(() => { if (reviewedToday >= study.dailyGoal) setCelebrated(true); }, [reviewedToday, study.dailyGoal]);
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const restored = importLastLayerStudy(JSON.parse(await file.text())); setStudy(restored.state); setMasteredKeys(restored.masteredKeys); setImportError(""); setCelebrated(false); } catch { setImportError(vi ? "Không thể đọc backup tiến độ này." : "This study backup could not be read."); } finally { event.target.value = ""; } };

  return <section>
    <header className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        <p className="small text-uppercase fw-semibold text-primary mb-1">CFOP STUDY</p>
        <h1 className="display-6 fw-semibold mb-2">{vi ? "Học thêm" : "Study"}</h1>
        <p className="text-body-secondary mb-0">{studyLane === "lastLayer" ? (vi ? "Ôn Last Layer theo case, giữ nhịp SRS và luyện đúng phần còn yếu." : "Review Last Layer case by case, keep an SRS rhythm, and practice what is weakest.") : (vi ? "Đi từng bước từ công thức đầu tiên đến một routine 3-Style rõ ràng." : "Move from your first algorithm to a clear 3-Style routine, one stage at a time.")}</p>
      </div>
      {studyLane === "lastLayer" && <span className="badge rounded-pill text-bg-primary px-3 py-2">{masteredKeys.size}/{catalog.length} {vi ? "case đã thuộc" : "cases mastered"}</span>}
    </header>
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="nav nav-pills" role="tablist" aria-label={vi ? "Loại luyện tập" : "Practice type"}>
            <button type="button" role="tab" aria-selected={studyLane === "lastLayer"} className={studyLane === "lastLayer" ? "nav-link active" : "nav-link"} onClick={() => setStudyLane("lastLayer")}>Last Layer</button>
            <button type="button" role="tab" aria-selected={studyLane === "bld"} className={studyLane === "bld" ? "nav-link active" : "nav-link"} onClick={() => setStudyLane("bld")}>3-Style BLD</button>
          </div>
          {studyLane === "lastLayer" && <div className="d-flex flex-wrap gap-2">
            <input ref={backupRef} onChange={onImport} accept="application/json,.json" type="file" className="d-none" />
            <button type="button" onClick={() => backupRef.current?.click()} className="btn btn-outline-secondary btn-sm"><FileUp className="fs-6 me-1" />{vi ? "Nhập tiến độ" : "Import progress"}</button>
            <button type="button" onClick={() => download("cfop-last-layer-study-backup.json", exportLastLayerStudy(study, masteredKeys))} className="btn btn-outline-secondary btn-sm"><Download className="fs-6 me-1" />{vi ? "Xuất backup" : "Export backup"}</button>
          </div>}
        </div>
      </div>
    </div>
    {studyLane === "lastLayer" ? <>
      {importError ? <StatusFeedback tone="danger" title={vi ? "Không thể nhập tiến độ" : "Could not import progress"}>{importError}</StatusFeedback> : null}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4">
        <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="small text-uppercase text-body-secondary mb-1">{vi ? "Hôm nay" : "Today"}</p><p className="h3 mb-1">{reviewedToday}/{study.dailyGoal}</p><p className="small text-body-secondary mb-0">{vi ? "lượt đã ôn" : "reviews completed"}</p></div></div></div>
        <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="small text-uppercase text-body-secondary mb-1">{vi ? "Tiến độ ngày" : "Daily progress"}</p><p className="h3 mb-1">{dailyPercent}%</p><p className="small text-body-secondary mb-0">{vi ? "mục tiêu hiện tại" : "of today's goal"}</p></div></div></div>
        <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="small text-uppercase text-body-secondary mb-1">{vi ? "Hàng đợi" : "Queue"}</p><p className="h3 mb-1">{queue.length}</p><p className="small text-body-secondary mb-0">{vi ? "case ưu tiên" : "priority cases"}</p></div></div></div>
        <div className="col"><div className="card border-0 shadow-sm h-100"><div className="card-body"><p className="small text-uppercase text-body-secondary mb-1">Catalog</p><p className="h3 mb-1">{catalog.length}</p><p className="small text-body-secondary mb-0">{vi ? "case Last Layer" : "Last Layer cases"}</p></div></div></div>
      </div>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="row align-items-center g-3">
            <div className="col-12 col-lg-4"><div className="d-flex align-items-center justify-content-between gap-3"><div><p className="small text-uppercase fw-semibold text-primary mb-1">{vi ? "Mục tiêu hôm nay" : "Today's goal"}</p><strong>{reviewedToday}/{study.dailyGoal} {vi ? "case đã ôn" : "cases reviewed"}</strong></div><span className="fw-semibold">{dailyPercent}%</span></div></div>
            <div className="col-12 col-lg"><div className="progress" aria-label={vi ? "Tiến độ mục tiêu hôm nay" : "Today's goal progress"}><div className="progress-bar" style={{ width: `${dailyPercent}%` }} /></div><p className="small text-body-secondary mt-2 mb-0">{queue.length} {vi ? "case trong hàng đợi ưu tiên · chỉnh mục tiêu trong Cài đặt" : "priority cases in queue · change the goal in Settings"}</p></div>
            <div className="col-12 col-lg-auto"><button type="button" onClick={() => chooseNext()} disabled={!queue.length} className="btn btn-primary w-100"><Dices className="fs-6 me-1" />{vi ? "Chọn case tiếp theo" : "Choose next case"}</button></div>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <section className="col-12 col-xl-8" aria-label={vi ? "Case đang học" : "Active study case"}>
          <div className="card border-0 shadow-sm h-100"><div className="card-body p-3 p-lg-4">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 border-bottom pb-3"><div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{queueLabel}</p><h2 className="h4 mb-1">{activeCase ? `${activeCase.family.toUpperCase()} · ${activeCase.group} · ${activeCase.id}` : (loading ? (vi ? "Đang nạp case…" : "Loading cases…") : (vi ? "Hết case" : "No cases"))}</h2>{loading ? <div className="d-flex align-items-center gap-2 small text-body-secondary mt-2" role="status"><span className="spinner-border spinner-border-sm" aria-hidden="true" />{vi ? "Đang nạp catalog…" : "Loading catalog…"}</div> : null}</div>{activeCase && <span className={activeMastered ? "badge text-bg-success" : "badge text-bg-secondary"}>{activeMastered ? (vi ? "Đã thuộc" : "Mastered") : (vi ? "Đang học" : "Learning")}</span>}</div>
            {activeCase ? <div className="row g-4 mt-1">
              <div className="col-12 col-lg-7"><div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><div className="btn-group" role="group" aria-label={vi ? "Chế độ xem cube" : "Cube view"}><button type="button" onClick={() => setCaseView("2d")} className={caseView === "2d" ? "btn btn-primary" : "btn btn-outline-secondary"}>2D</button><button type="button" onClick={() => setCaseView("3d")} className={caseView === "3d" ? "btn btn-primary" : "btn btn-outline-secondary"}>3D</button></div><span className="small text-body-secondary">{vi ? "Xem, nhớ, rồi bấm giờ" : "View, recall, then time it"}</span></div>{caseView === "2d" ? <div className="border rounded bg-body-tertiary p-3 text-center"><CubeNet state={activeCase.state} /></div> : <Cube3DGuide state={activeCase.state} step={0} crossColor={solverSettings.crossColor} alignCross lastLayerCase={{ family: activeCase.family, id: activeCase.id }} />}<div className="d-flex flex-wrap gap-2 border-top pt-3 mt-3"><button type="button" onClick={() => setShowAlgorithm((value) => !value)} className="btn btn-outline-secondary btn-sm">{showAlgorithm ? <Check className="fs-6 me-1" /> : <Sparkles className="fs-6 me-1" />}{showAlgorithm ? (vi ? "Ẩn công thức" : "Hide algorithm") : (vi ? "Xem công thức" : "Show algorithm")}</button><button type="button" onClick={toggleMastered} className="btn btn-outline-secondary btn-sm"><Check className="fs-6 me-1" />{activeMastered ? (vi ? "Bỏ đánh dấu" : "Unmark mastered") : (vi ? "Đánh dấu đã thuộc" : "Mark mastered")}</button></div>{showAlgorithm && <pre className="bg-body-tertiary border rounded p-3 mt-3 text-wrap mb-0">{activeCase.algorithm}</pre>}</div>
              <div className="col-12 col-lg-5"><div className="card bg-body-tertiary border-0 h-100"><div className="card-body"><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "Luyện nhớ" : "Recall drill"}</p><h3 className="h5">{vi ? "Bấm giờ case này" : "Time this case"}</h3><p className="small text-body-secondary">{vi ? "Dừng timer rồi tự chấm mức nhớ để SRS lên lịch lần gặp lại." : "Stop the timer, then grade your recall so SRS can schedule the next review."}</p><SolveTimer key={timerVersion} onComplete={completeTimer} soundEnabled={false} inspectionEnabled={false} /><div className="border-top pt-3 mt-3"><p className="small text-body-secondary mb-2">{lastElapsed === null ? (vi ? "Dừng timer để tự đánh giá" : "Stop timer to self-grade") : `${vi ? "Kết quả" : "Result"} · ${formatTimerReadout(lastElapsed)}`}</p>{lastElapsed !== null && <div className="row g-2"><div className="col-6"><GradeButton label={vi ? "Quên" : "Again"} tone="red" onClick={() => grade("again")} /></div><div className="col-6"><GradeButton label={vi ? "Khó" : "Hard"} tone="ink" onClick={() => grade("hard")} /></div><div className="col-6"><GradeButton label={vi ? "Nhớ" : "Good"} tone="mint" onClick={() => grade("good")} /></div><div className="col-6"><GradeButton label={vi ? "Dễ" : "Easy"} tone="mint" onClick={() => grade("easy")} /></div></div>}</div></div></div></div>
            </div> : loading ? <StudyCatalogSkeleton /> : <div className="mt-4"><StatusFeedback tone="secondary" title={vi ? "Chưa có case phù hợp" : "No matching cases"}>{vi ? "Thử chọn một family để tiếp tục học." : "Choose a family to continue studying."}</StatusFeedback><div className="btn-group mt-3" role="group" aria-label={vi ? "Chọn family học" : "Choose study family"}><button type="button" onClick={() => setFamily("zbll")} className={family === "zbll" ? "btn btn-primary" : "btn btn-outline-secondary"}>ZBLL</button><button type="button" onClick={() => setFamily("1lll")} className={family === "1lll" ? "btn btn-primary" : "btn btn-outline-secondary"}>1LLL</button></div></div>}
          </div></div>
        </section>
        <aside className="col-12 col-xl-4" aria-label={vi ? "Lịch ôn tập" : "Review schedule"}><div className="card border-0 shadow-sm h-100"><div className="card-body p-3 p-lg-4"><div className="d-flex align-items-start justify-content-between gap-3"><div><p className="small text-uppercase fw-semibold text-primary mb-1">{vi ? "Lịch ôn" : "Review plan"}</p><h2 className="h5 mb-1">{vi ? "7 ngày tới" : "Next 7 days"}</h2></div><span className="badge text-bg-secondary">{weeklyTotal} {vi ? "cần ôn" : "due"}</span></div><div className="row row-cols-7 g-1 mt-3" role="list" aria-label={vi ? "Lịch ôn tập tuần" : "Weekly review schedule"}>{weeklySchedule.map((day) => { const weekday = day.date.toLocaleDateString(vi ? "vi-VN" : "en-US", { weekday: "short" }).replace(".", ""); return <div key={day.date.toISOString()} role="listitem" className="col text-center small"><div className={day.isToday ? "border rounded p-1 bg-primary text-white" : "border rounded p-1 bg-body-tertiary"}><span className="d-block">{weekday}</span><b className="d-block">{day.date.getDate()}</b><strong>{day.dueCount}</strong></div></div>; })}</div>{celebrated && <div className="alert alert-success mt-3 mb-0"><Sparkles className="fs-6 me-1" />{vi ? "Hoàn thành mục tiêu hôm nay" : "Daily goal complete"}<button type="button" onClick={() => setCelebrated(false)} className="btn-close float-end" aria-label={vi ? "Đóng thông báo" : "Dismiss notification"} /></div>}<div className="border-top mt-4 pt-3"><p className="small text-body-secondary mb-2">{vi ? "Case yếu cần ưu tiên" : "Weak cases to prioritize"}</p><button type="button" onClick={() => chooseNext(true)} disabled={!weakest.length} className="btn btn-outline-secondary w-100"><TimerReset className="fs-6 me-1" />{vi ? "Ôn case yếu nhất" : "Review weakest case"}</button></div></div></div></aside>
      </div>
      <div className="mt-4"><LastLayerExplorer language={language} catalog={catalog} family={family} selectedCase={activeCase} masteredKeys={masteredKeys} onFamily={(next) => { setFamily(next); setActiveCase(null); }} onSelect={selectCase} /></div>
    </> : <BldStudyLab language={language} />}
  </section>;
}

function GradeButton({ label, tone, onClick }: { label: string; tone: "red" | "ink" | "mint"; onClick: () => void }) { const classes = tone === "red" ? "btn btn-outline-danger w-100" : tone === "mint" ? "btn btn-primary w-100" : "btn btn-outline-secondary w-100"; return <button onClick={onClick} className={classes}>{label}</button>; }
