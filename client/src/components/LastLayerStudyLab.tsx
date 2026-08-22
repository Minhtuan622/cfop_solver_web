/** Xưởng Cơ Khí Tốc Độ — study bay: một apparatus chính, score-strip phụ và mint chỉ báo trạng thái. */
import { Check, Dices, Download, FileUp, RotateCcw, Sparkles, TimerReset } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { CubeNet } from "@/components/CubeNet";
import { SolveTimer, type TimerCompletion } from "@/components/SolveTimer";
import { caseKey, dueAndWeakCases, exportLastLayerStudy, gradeCase, importLastLayerStudy, prioritizeStudyQueue, readLastLayerStudy, readMasteredCaseKeys, todayReviewCount, weeklyReviewSchedule, writeLastLayerStudy, writeMasteredCaseKeys, type StudyGrade, type StudyState } from "@/lib/lastLayerStudy";
import { listLastLayerCasesInBrowser, type LastLayerCatalogCase } from "@/lib/solverRuntime";

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
  const backupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    listLastLayerCasesInBrowser({ family: "all", limit: 2000 }).then((cases) => { if (live) { setCatalog(cases); setLoading(false); } }).catch(() => { if (live) { setCatalog([]); setLoading(false); } });
    return () => { live = false; };
  }, []);
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

  const chooseNext = (preferWeak = false) => {
    const candidates = preferWeak ? weakest : queue;
    const fallback = candidates.length ? candidates : ranked;
    if (!fallback.length) return;
    setActiveCase(fallback[0]); setLastElapsed(null); setShowAlgorithm(false); setTimerVersion((value) => value + 1);
  };
  useEffect(() => { if (!activeCase && catalog.length) chooseNext(); }, [activeCase, catalog.length]);

  const completeTimer = (completion: TimerCompletion) => { setLastElapsed(completion.elapsedMs); };
  const grade = (value: StudyGrade) => {
    if (!activeCase || lastElapsed === null) return;
    const key = caseKey(activeCase);
    const record = gradeCase(activeCase, study.records[key], lastElapsed, value);
    setStudy((current) => ({ ...current, records: { ...current.records, [key]: record } }));
    if (value !== "again") setMasteredKeys((current) => new Set(Array.from(current).concat(key)));
    setLastElapsed(null); setShowAlgorithm(false); setTimerVersion((version) => version + 1);
    setActiveCase(null);
  };
  useEffect(() => { if (reviewedToday >= study.dailyGoal) setCelebrated(true); }, [reviewedToday, study.dailyGoal]);
  const updateDailyGoal = (value: string) => {
    const dailyGoal = Math.min(200, Math.max(1, Math.round(Number(value) || 1)));
    setStudy((current) => ({ ...current, dailyGoal }));
  };
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const restored = importLastLayerStudy(JSON.parse(await file.text())); setStudy(restored.state); setMasteredKeys(restored.masteredKeys); setImportError(""); setCelebrated(false); } catch { setImportError(vi ? "Không thể đọc backup tiến độ này." : "This study backup could not be read."); } finally { event.target.value = ""; } };

  return <section className="last-layer-study space-y-6">
    <section className="relative overflow-hidden border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8] shadow-[7px_7px_0_#1ba77a] sm:p-7"><div className="tick-ruler" /><div className="relative flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#1ba77a]">LAST LAYER · STUDY BAY</p><h2 className="mt-2 text-2xl font-black tracking-[-0.06em] sm:text-3xl">{vi ? "Luyện ZBLL / 1LLL" : "ZBLL / 1LLL study"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#f4f0e8]/65">{vi ? "Case mới đi trước; case đã thuộc quay lại theo hạn ôn, lỗi và tốc độ gần nhất." : "New cases come first; mastered cases return by due date, misses, and recent speed."}</p></div><div className="flex flex-wrap gap-2"><input ref={backupRef} onChange={onImport} accept="application/json,.json" type="file" className="hidden" /><button onClick={() => backupRef.current?.click()} className="scanner-button scanner-secondary border-white/20 bg-white/5 text-[#f4f0e8]"><FileUp className="h-4 w-4" />{vi ? "NHẬP TIẾN ĐỘ" : "IMPORT"}</button><button onClick={() => download("cfop-last-layer-study-backup.json", exportLastLayerStudy(study, masteredKeys))} className="scanner-button border-[#1ba77a] bg-[#1ba77a] text-[#17221d]"><Download className="h-4 w-4" />{vi ? "XUẤT TIẾN ĐỘ" : "EXPORT"}</button></div></div>{importError && <p className="relative mt-4 border border-[#d95743]/70 bg-[#d95743]/15 p-3 font-mono text-xs text-[#f4f0e8]">{importError}</p>}</section>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="study-apparatus border-2 border-[#17221d] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#17221d]/14 pb-3"><div><p className="font-mono text-[9px] font-bold tracking-[0.16em] text-[#1ba77a]">{queueLabel}</p><h3 className="mt-1 font-mono text-xl font-black">{activeCase ? `${activeCase.family.toUpperCase()} · ${activeCase.group} · ${activeCase.id}` : (loading ? (vi ? "ĐANG NẠP CASE…" : "LOADING CASES…") : (vi ? "HẾT CASE" : "NO CASES"))}</h3></div><div className="flex items-center gap-2"><select value={family} onChange={(event) => { setFamily(event.target.value as "all" | "zbll" | "1lll"); setActiveCase(null); }} aria-label={vi ? "Family để luyện" : "Practice family"} className="h-9 rounded-sm border border-[#17221d]/25 bg-[#f4f0e8] px-2 font-mono text-[10px] font-bold outline-none"><option value="all">ALL · ZBLL + 1LLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select><button onClick={() => chooseNext()} disabled={!queue.length} className="scanner-button h-9 px-3 disabled:opacity-40"><Dices className="h-4 w-4" />{vi ? "CASE KẾ" : "NEXT"}</button></div></div>
      {activeCase ? <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="min-w-0"><div className="study-cube-stage grid place-items-center border-2 border-[#17221d] bg-[#e9e3d6] p-4"><CubeNet state={activeCase.state} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-[#17221d]/10 py-3"><button onClick={() => setShowAlgorithm((value) => !value)} className="font-mono text-[10px] font-bold text-[#1b7b5e]">{showAlgorithm ? (vi ? "ẨN CÔNG THỨC" : "HIDE ALGORITHM") : (vi ? "XEM CÔNG THỨC" : "SHOW ALGORITHM")}</button><span className="font-mono text-[9px] text-[#17221d]/50">{vi ? "SPACE / ENTER / CHẠM" : "SPACE / ENTER / TOUCH"}</span></div>{showAlgorithm && <pre className="mt-3 whitespace-pre-wrap break-words border-l-4 border-[#1ba77a] bg-[#f4f0e8] p-3 font-mono text-sm font-bold leading-6">{activeCase.algorithm}</pre>}</div><div className="flex flex-col gap-4"><Cube3DGuide state={activeCase.state} step={0} crossColor="U" lastLayerCase={{ family: activeCase.family, id: activeCase.id }} /><SolveTimer key={timerVersion} onComplete={completeTimer} soundEnabled={false} inspectionEnabled={false} /><div className="border-y border-[#17221d]/12 py-3"><p className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#17221d]/55">{lastElapsed === null ? (vi ? "DỪNG TIMER ĐỂ TỰ ĐÁNH GIÁ" : "STOP TIMER TO SELF-GRADE") : `${vi ? "KẾT QUẢ" : "RESULT"} · ${format(lastElapsed)}`}</p>{lastElapsed !== null && <div className="mt-3 grid grid-cols-2 gap-2"><GradeButton label={vi ? "QUÊN" : "AGAIN"} tone="red" onClick={() => grade("again")} /><GradeButton label={vi ? "KHÓ" : "HARD"} tone="ink" onClick={() => grade("hard")} /><GradeButton label={vi ? "NHỚ" : "GOOD"} tone="mint" onClick={() => grade("good")} /><GradeButton label={vi ? "DỄ" : "EASY"} tone="mint" onClick={() => grade("easy")} /></div>}</div></div></div> : <div className="grid min-h-80 place-items-center border-2 border-dashed border-[#17221d]/20 bg-[#f4f0e8] p-5 text-center font-mono text-xs text-[#17221d]/55">{loading ? (vi ? "ĐANG NẠP CATALOG…" : "LOADING CATALOG…") : (vi ? "Không có case trong bộ lọc này." : "No cases in this filter.")}</div>}</div>
      <aside className="study-record-sheet border-2 border-[#17221d] bg-[#f8f5ed] p-4">
        <p className="font-mono text-[9px] font-bold tracking-[0.15em] text-[#1ba77a]">{vi ? "MỤC TIÊU HÔM NAY" : "TODAY'S GOAL"}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="font-mono text-4xl font-black tracking-[-0.1em]">{reviewedToday}<span className="text-lg text-[#17221d]/45">/{study.dailyGoal}</span></p>
          <label className="font-mono text-[9px] font-bold text-[#17221d]/55">{vi ? "CASE" : "CASES"}
            <input type="number" min="1" max="200" value={study.dailyGoal} onChange={(event) => updateDailyGoal(event.target.value)} className="mt-1 block w-16 border-b-2 border-[#17221d]/25 bg-transparent py-1 text-right font-mono text-sm outline-none focus:border-[#1ba77a]" />
          </label>
        </div>
        <div className="mt-3 h-2 overflow-hidden bg-[#17221d]/10"><span className="block h-full bg-[#1ba77a] transition-[width] duration-200" style={{ width: `${dailyPercent}%` }} /></div>
        <p className="mt-2 font-mono text-[9px] text-[#17221d]/55">{dailyPercent}% · {queue.length} {vi ? "case ưu tiên" : "priority cases"}</p>
        <div className="study-week-calendar mt-5 border-y border-[#17221d]/12 py-4"><div className="flex items-baseline justify-between gap-3"><p className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#17221d]/55">{vi ? "LỊCH ÔN · 7 NGÀY" : "REVIEW · 7 DAYS"}</p><p className="font-mono text-[9px] text-[#1b7b5e]">{weeklyTotal} {vi ? "cần ôn" : "due"}</p></div><div className="mt-3 grid grid-cols-7 gap-1" role="list" aria-label={vi ? "Lịch ôn tập tuần" : "Weekly review schedule"}>{weeklySchedule.map((day) => { const weekday = day.date.toLocaleDateString(vi ? "vi-VN" : "en-US", { weekday: "short" }).replace(".", ""); return <div key={day.date.toISOString()} role="listitem" className={`study-week-day ${day.isToday ? "study-week-day-today" : ""} ${day.dueCount > 0 ? "study-week-day-due" : ""}`}><span>{weekday}</span><b>{day.date.getDate()}</b><strong>{day.dueCount}</strong>{day.overdueCount > 0 && <i title={vi ? `${day.overdueCount} case quá hạn` : `${day.overdueCount} overdue cases`}>+{day.overdueCount}</i>}</div>; })}</div><p className="mt-3 font-mono text-[9px] leading-4 text-[#17221d]/55">{vi ? "Hôm nay gồm case đến hạn và quá hạn; các ngày sau hiển thị theo due date." : "Today includes due and overdue cases; future days follow each case due date."}</p></div>
        {celebrated && <div className="mt-4 border-2 border-[#1ba77a] bg-[#1ba77a]/15 p-3"><p className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#1b7b5e]"><Sparkles className="h-4 w-4" />{vi ? "HOÀN THÀNH MỤC TIÊU HÔM NAY" : "DAILY GOAL COMPLETE"}</p><button onClick={() => setCelebrated(false)} className="mt-2 font-mono text-[9px] underline text-[#17221d]/55">{vi ? "Đóng" : "Dismiss"}</button></div>}
        <div className="mt-5 border-t border-[#17221d]/12 pt-4"><p className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#17221d]/55">{vi ? "ÔN TẬP THÔNG MINH" : "SMART REVIEW"}</p><p className="mt-2 font-mono text-[10px] leading-5 text-[#17221d]/70">{vi ? "Hàng đợi ưu tiên case đến hạn, bị quên, hoặc có trung bình thời gian cao." : "The queue prioritizes due cases, recent misses, and slow average times."}</p><button onClick={() => chooseNext(true)} disabled={!weakest.length} className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-bold text-[#1b7b5e] disabled:opacity-40"><TimerReset className="h-4 w-4" />{vi ? "LẤY CASE CẦN ÔN" : "PICK WEAK CASE"}</button></div>
      </aside>
    </section>
  </section>;
}

function GradeButton({ label, tone, onClick }: { label: string; tone: "red" | "ink" | "mint"; onClick: () => void }) { const classes = tone === "red" ? "border-[#d95743] bg-[#d95743]/10 text-[#9b3023]" : tone === "mint" ? "border-[#1ba77a] bg-[#1ba77a] text-[#17221d]" : "border-[#17221d] bg-[#17221d] text-[#f4f0e8]"; return <button onClick={onClick} className={`rounded-sm border px-2 py-2 font-mono text-[9px] font-bold ${classes}`}>{label}</button>; }
