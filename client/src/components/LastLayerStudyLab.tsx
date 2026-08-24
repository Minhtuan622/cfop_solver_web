/** Xưởng Cơ Khí Tốc Độ — Study là nhà duy nhất cho SRS lẫn catalog Last Layer. */
/* Xưởng Cơ Khí Tốc Độ — algorithm notation is independently scalable; the study apparatus and timer chrome remain calibrated. */
import { Check, Download, FileUp, Sparkles, TimerReset } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { BldStudyLab } from "@/components/BldStudyLab";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { CubeNet } from "@/components/CubeNet";
import { LastLayerExplorer } from "@/components/LastLayerExplorer";
import { SolveTimer, type TimerCompletion } from "@/components/SolveTimer";
import { StatusFeedback } from "@/components/BootstrapUI";
import { caseKey, dueAndWeakCases, exportLastLayerStudy, gradeCase, importLastLayerStudy, prioritizeStudyQueue, readLastLayerStudy, readMasteredCaseKeys, todayReviewCount, weeklyReviewSchedule, writeLastLayerStudy, writeMasteredCaseKeys, type StudyGrade, type StudyState } from "@/lib/lastLayerStudy";
import { listLastLayerCasesInBrowser, type LastLayerCatalogCase } from "@/lib/solverRuntime";
import { readSolverSettings, type SolverSettings } from "@/lib/appSettings";

function format(ms: number) { const seconds = Math.max(0, ms) / 1000; return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}.${Math.floor((seconds % 1) * 100).toString().padStart(2, "0")}`; }
function download(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }

export function LastLayerStudyLab({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const [family, setFamily] = useState<"all" | "zbll" | "1lll">("all");
  const [catalog, setCatalog] = useState<LastLayerCatalogCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState<StudyState>(() => readLastLayerStudy());
  const [masteredKeys, setMasteredKeys] = useState<Set<string>>(() => readMasteredCaseKeys());
  const [activeCase, setActiveCase] = useState<LastLayerCatalogCase | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [lastElapsed, setLastElapsed] = useState<number | null>(null);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [importError, setImportError] = useState("");
  const [studyLane, setStudyLane] = useState<"lastLayer" | "bld">("lastLayer");
  const [solverSettings, setSolverSettings] = useState<SolverSettings>(() => readSolverSettings());
  const backupRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const refresh = () => setSolverSettings(readSolverSettings()); window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh); return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); }; }, []);
  useEffect(() => { let live = true; listLastLayerCasesInBrowser({ family: "all", limit: 2000 }).then((cases) => { if (live) { setCatalog(cases); setLoading(false); } }).catch(() => { if (live) { setCatalog([]); setLoading(false); } }); return () => { live = false; }; }, []);
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

  return <section className="container py-4"><div className="nav nav-tabs" role="tablist" aria-label={vi ? "Loại luyện tập" : "Practice type"}><button type="button" role="tab" aria-selected={studyLane === "lastLayer"} className={studyLane === "lastLayer" ? "nav-link active" : "nav-link"} onClick={() => setStudyLane("lastLayer")}>LAST LAYER</button><button type="button" role="tab" aria-selected={studyLane === "bld"} className={studyLane === "bld" ? "nav-link active" : "nav-link"} onClick={() => setStudyLane("bld")}>3-STYLE BLD</button></div>{studyLane === "lastLayer" ? <>
    <div className="d-flex justify-content-end gap-2 my-3"><input ref={backupRef} onChange={onImport} accept="application/json,.json" type="file" className="d-none" /><button onClick={() => backupRef.current?.click()} className="btn btn-outline-secondary btn-sm"><FileUp className="" /> {vi ? "Nhập tiến độ" : "Import"}</button><button onClick={() => download("cfop-last-layer-study-backup.json", exportLastLayerStudy(study, masteredKeys))} className="btn btn-primary btn-sm"><Download className="" /> {vi ? "Xuất tiến độ" : "Export"}</button></div>
    {importError ? <StatusFeedback tone="danger" title={vi ? "Không thể nhập tiến độ" : "Could not import progress"}>{importError}</StatusFeedback> : null}
    {loading ? <div className="alert alert-info d-flex align-items-center gap-2" role="status" aria-live="polite"><span className="spinner-border spinner-border-sm" aria-hidden="true" /><span>{vi ? "Đang nạp Catalog Last Layer…" : "Loading the Last Layer catalog…"}</span></div> : null}
    <section className="row g-4"><div className="col-12 col-xl-8"><div className="card card-body"><div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom pb-3"><div><p className="small text-muted mb-1">{queueLabel}</p><h3 className="mb-0">{activeCase ? `${activeCase.family.toUpperCase()} · ${activeCase.group} · ${activeCase.id}` : (loading ? (vi ? "Đang nạp case…" : "Loading cases…") : (vi ? "Hết case" : "No cases"))}</h3></div><button onClick={() => chooseNext()} disabled={!queue.length} className="btn btn-primary">{vi ? "Case kế" : "Next"}</button></div>
      {activeCase ? <div className="row g-4 mt-1"><div className="col-12 col-lg-8"><div className="border rounded p-3 text-center"><CubeNet state={activeCase.state} /></div><div className="d-flex flex-wrap justify-content-between gap-2 border-top border-bottom py-3 mt-3"><button onClick={() => setShowAlgorithm((value) => !value)} className="btn btn-outline-primary btn-sm">{showAlgorithm ? (vi ? "Ẩn công thức" : "Hide algorithm") : (vi ? "Xem công thức" : "Show algorithm")}</button><button onClick={toggleMastered} className={activeMastered ? "btn btn-success btn-sm" : "btn btn-outline-secondary btn-sm"}><Check className="" /> {activeMastered ? (vi ? "Đã thuộc" : "Mastered") : (vi ? "Đánh dấu" : "Mark")}</button></div>{showAlgorithm && <pre className="bg-body-tertiary border rounded p-3 mt-3 text-wrap">{activeCase.algorithm}</pre>}</div><div className="col-12 col-lg-4"><div className="d-flex flex-column gap-3"><Cube3DGuide state={activeCase.state} step={0} crossColor={solverSettings.crossColor} alignCross lastLayerCase={{ family: activeCase.family, id: activeCase.id }} /><SolveTimer key={timerVersion} onComplete={completeTimer} soundEnabled={false} inspectionEnabled={false} /><div className="border-top pt-3"><p className="small text-muted">{lastElapsed === null ? (vi ? "Dừng timer để tự đánh giá" : "Stop timer to self-grade") : `${vi ? "Kết quả" : "Result"} · ${format(lastElapsed)}`}</p>{lastElapsed !== null && <div className="row g-2"><div className="col-6"><GradeButton label={vi ? "Quên" : "Again"} tone="red" onClick={() => grade("again")} /></div><div className="col-6"><GradeButton label={vi ? "Khó" : "Hard"} tone="ink" onClick={() => grade("hard")} /></div><div className="col-6"><GradeButton label={vi ? "Nhớ" : "Good"} tone="mint" onClick={() => grade("good")} /></div><div className="col-6"><GradeButton label={vi ? "Dễ" : "Easy"} tone="mint" onClick={() => grade("easy")} /></div></div>}</div></div></div></div> : <div className="mt-4"><StatusFeedback tone="secondary" title={loading ? (vi ? "Đang nạp catalog" : "Loading catalog") : (vi ? "Chưa có case phù hợp" : "No matching cases")}>{loading ? (vi ? "Catalog Last Layer đang được chuẩn bị. Bạn có thể chờ trong giây lát." : "The Last Layer catalog is being prepared. Please wait a moment.") : (vi ? "Thử đổi bộ lọc hoặc chọn một family khác để tiếp tục." : "Try changing the filter or selecting another family to continue.")}</StatusFeedback></div>}</div></div>
      <aside className="col-12 col-xl-4"><div className="card card-body"><p className="">{vi ? "Mục tiêu hôm nay" : "Today's goal"}</p><div className="d-flex align-items-end justify-content-between"><p className="display-6 mb-0">{reviewedToday}/{study.dailyGoal}</p><span className="small text-muted">{vi ? "Cài trong Settings" : "Set in Settings"}</span></div><div className="progress mt-3"><div className="progress-bar" style={{ width: `${dailyPercent}%` }} /></div><p className="small text-muted mt-2">{dailyPercent}% · {queue.length} {vi ? "case ưu tiên" : "priority cases"}</p><hr /><div className="d-flex justify-content-between"><p className="">{vi ? "Lịch ôn · 7 ngày" : "Review · 7 days"}</p><span className="small text-muted">{weeklyTotal} {vi ? "cần ôn" : "due"}</span></div><div className="row g-1" role="list" aria-label={vi ? "Lịch ôn tập tuần" : "Weekly review schedule"}>{weeklySchedule.map((day) => { const weekday = day.date.toLocaleDateString(vi ? "vi-VN" : "en-US", { weekday: "short" }).replace(".", ""); return <div key={day.date.toISOString()} role="listitem" className="col text-center small"><div className={day.isToday ? "border rounded p-1 bg-primary text-white" : "border rounded p-1"}><span className="d-block">{weekday}</span><b className="d-block">{day.date.getDate()}</b><strong>{day.dueCount}</strong></div></div>; })}</div>{celebrated && <div className="alert alert-success mt-3 mb-0"><Sparkles className="" /> {vi ? "Hoàn thành mục tiêu hôm nay" : "Daily goal complete"}<button onClick={() => setCelebrated(false)} className="btn-close" /></div>}<hr /><button onClick={() => chooseNext(true)} disabled={!weakest.length} className="btn btn-outline-primary"><TimerReset className="" /> {vi ? "Lấy case cần ôn" : "Pick weak case"}</button></div></aside>
      <div className="col-12"><LastLayerExplorer language={language} catalog={catalog} family={family} selectedCase={activeCase} masteredKeys={masteredKeys} onFamily={(next) => { setFamily(next); setActiveCase(null); }} onSelect={selectCase} /></div>
    </section>
  </> : <BldStudyLab language={language} />}</section>;
}

function GradeButton({ label, tone, onClick }: { label: string; tone: "red" | "ink" | "mint"; onClick: () => void }) { const classes = tone === "red" ? "btn btn-outline-danger w-100" : tone === "mint" ? "btn btn-primary w-100" : "btn btn-outline-secondary w-100"; return <button onClick={onClick} className={classes}>{label}</button>; }
