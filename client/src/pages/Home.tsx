/**
 * Soft Focus Workspace: a calm, reusable desktop-first Rubik canvas. Surfaces are
 * grouped by spacing, soft elevation and color—not decorative borders—while 3D cube
 * movement remains the sole rich animation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronRight, CircleGauge, History, Play, RotateCcw, ShieldCheck, Sparkles, Trash2,
} from "@/components/ui/BootstrapIcon";
import { Timer } from "@/components/ui/BootstrapIcon";
import { Link } from "wouter";
import { CubeNet, SOLVED_STATE } from "@/components/common/CubeNet";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { BldReport } from "@/features/bld";
import { CfopReport, SolverStat } from "@/features/solver";
import { CubeStateEditor } from "@/components/common/CubeStateEditor";
import { CameraScanner } from "@/components/common/CameraScanner";
import { PageHeader, StatusFeedback } from "@/components/ui/BootstrapUI";
import { stateFromScramble } from "@/lib/fastCube";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import { F2L_SLOTS, lastLayerModeLabel, openingModeLabel } from "@/lib/solverPresentation";
import { readSolverSettings } from "@/lib/appSettings";
import { readBldProfile, writeBldProfile } from "@/features/bld";
import { analyzeBldInBrowser, solveInBrowser, validateStateInBrowser, warmSolverInBrowser, type BldResult, type CrossColor, type CubeValidation, type F2LSlot, type LastLayerMode, type OpeningMode, type SolverResult } from "@/lib/solverRuntime";

type CubeMotionKind = "idle" | "move" | "seek" | "phase" | "reset";
type CursorIntent = "step" | "playback" | "seek" | "phase" | "reset";
type RecentCubeState = { id: string; state: string; label: string; savedAt: string; crossColor: CrossColor };
const RECENT_STATE_KEY = "cfop-studio-recent-states-v1";
export default function Home() {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<"scramble" | "state">("scramble");
  const [solverKind, setSolverKind] = useState<"cfop" | "bld">("cfop");
  const [crossColor, setCrossColor] = useState<CrossColor>(() => readSolverSettings().crossColor);
  const [opening, setOpening] = useState<OpeningMode>(() => readSolverSettings().opening);
  const [openingDepth, setOpeningDepth] = useState(() => readSolverSettings().openingDepth);
  const [openingFindResult, setOpeningFindResult] = useState(() => readSolverSettings().openingFindResult);
  const [directNodeBudget, setDirectNodeBudget] = useState(() => readSolverSettings().directNodeBudget);
  const [lastLayer, setLastLayer] = useState<LastLayerMode>(() => readSolverSettings().lastLayer);
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>(() => readSolverSettings().preferredSlot);
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>(() => readSolverSettings().excludedSlots);
  const [initialScramble] = useState(() => randomThreeByThreeScramble());
  const [value, setValue] = useState(initialScramble);
  const [savedScramble, setSavedScramble] = useState(initialScramble);
  const [savedState, setSavedState] = useState(SOLVED_STATE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [bldResult, setBldResult] = useState<BldResult | null>(null);
  const [bldProfile, setBldProfile] = useState(() => readBldProfile());
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [solverStatus, setSolverStatus] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cubeMotion, setCubeMotion] = useState<{ id: number; kind: CubeMotionKind; direction: "forward" | "backward"; phaseName?: string }>({ id: 0, kind: "idle", direction: "forward" });
  const [cubeView, setCubeView] = useState<"2d" | "3d">("3d");
  const [error, setError] = useState("");
  const [stateValidation, setStateValidation] = useState<CubeValidation | null>(null);
  const [paintColor, setPaintColor] = useState<CrossColor>("U");
  const [recentStates, setRecentStates] = useState<RecentCubeState[]>(() => { try { const stored = JSON.parse(localStorage.getItem(RECENT_STATE_KEY) ?? "[]"); return Array.isArray(stored) ? stored.filter((item): item is RecentCubeState => typeof item?.state === "string" && item.state.length === 54).slice(0, 8) : []; } catch { return []; } });
  useEffect(() => { warmSolverInBrowser().catch(() => undefined); }, []);
  useEffect(() => { writeBldProfile(bldProfile); }, [bldProfile]);
  const stateHistory = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const cursorRef = useRef(0);
  const motionIdRef = useRef(0);
  const [, setStateHistoryVersion] = useState(0);

  const previewState = useMemo(() => {
    if (mode === "state") return stateValidation?.valid ? value : SOLVED_STATE;
    try { return value.trim() ? stateFromScramble(value) : SOLVED_STATE; } catch { return SOLVED_STATE; }
  }, [mode, value]);
  const currentState = useMemo(() => {
    if (!result) return previewState;
    return cursor === 0 ? result.initial_state : result.trace[cursor - 1]?.state ?? result.final_state;
  }, [cursor, previewState, result]);
  const previousState = useMemo(() => {
    if (!result || cursor === 0) return undefined;
    return cursor === 1 ? result.initial_state : result.trace[cursor - 2]?.state;
  }, [cursor, result]);
  const currentStep = result?.trace[cursor - 1];
  const activePhase = cursor > 0
    ? result?.phases.find((phase) => cursor > phase.start && cursor <= phase.end)
      ?? result?.phases.find((phase) => phase.end === cursor)
      ?? null
    : null;
  const totalMoves = result?.trace.length ?? 0;
  const openingTelemetry = result?.opening;
  const lastLayerTelemetry = result?.last_layer;
  const openingOutcome = useMemo(() => {
    const first = result?.phases[0];
    if (!first) return null;
    if (first.name.startsWith("xxxxcross_")) return { kind: "xxxxcross" as const, slots: first.name.slice("xxxxcross_".length).split("_"), moves: first.moves.length };
    if (first.name.startsWith("xxxcross_")) return { kind: "xxxcross" as const, slots: first.name.slice("xxxcross_".length).split("_"), moves: first.moves.length };
    if (first.name.startsWith("xxcross_")) return { kind: "xxcross" as const, slots: first.name.slice("xxcross_".length).split("_"), moves: first.moves.length };
    if (first.name.startsWith("xcross_")) return { kind: "xcross" as const, slot: first.name.slice("xcross_".length), moves: first.moves.length };
    return { kind: "cross" as const, slot: null, moves: first.moves.length };
  }, [result]);
  const activeXCrossSlots = activePhase?.name.startsWith("xxxxcross_") ? activePhase.name.slice("xxxxcross_".length).split("_") : activePhase?.name.startsWith("xxxcross_") ? activePhase.name.slice("xxxcross_".length).split("_") : activePhase?.name.startsWith("xxcross_") ? activePhase.name.slice("xxcross_".length).split("_") : activePhase?.name.startsWith("xcross_") ? [activePhase.name.slice("xcross_".length)] : undefined;
  const activeLastLayerCase = activePhase && (activePhase.name === "zbll" || activePhase.name === "1lll") && activePhase.case_id ? { family: activePhase.name, id: activePhase.case_id } : undefined;
  const phaseNameAt = useCallback((position: number) => {
    if (!result || position <= 0) return undefined;
    return result.phases.find((phase) => position > phase.start && position <= phase.end)?.name
      ?? result.phases.find((phase) => phase.end === position)?.name;
  }, [result]);
  const updateCursor = useCallback((next: number, intent: CursorIntent = "seek") => {
    const limit = result?.trace.length ?? 0;
    const target = Math.max(0, Math.min(limit, next));
    const previous = cursorRef.current;
    if (target === previous) return;
    const direction = target >= previous ? "forward" as const : "backward" as const;
    const fromPhase = phaseNameAt(previous);
    const toPhase = phaseNameAt(target);
    const distance = Math.abs(target - previous);
    const kind: CubeMotionKind = intent === "reset" || target === 0 ? "reset" : intent === "phase" || (distance > 1 && fromPhase !== toPhase) ? "phase" : distance === 1 ? "move" : "seek";
    cursorRef.current = target;
    setCubeMotion({ id: ++motionIdRef.current, kind, direction, phaseName: toPhase });
    setCursor(target);
  }, [phaseNameAt, result]);

  useEffect(() => {
    if (!playing || !result) return;
    const id = window.setInterval(() => {
      const next = cursorRef.current + 1;
      if (next > result.trace.length) { setPlaying(false); return; }
      updateCursor(next, "playback");
    }, Math.max(100, Math.round(360 / playbackSpeed)));
    return () => window.clearInterval(id);
  }, [playbackSpeed, playing, result, updateCursor]);

  useEffect(() => {
    if (mode !== "state") { setStateValidation(null); return; }
    const candidate = value.trim();
    if (candidate.length !== 54) { setStateValidation({ valid: false, message: language === "vi" ? "Cần đủ 54 sticker trước khi kiểm tra." : "Enter all 54 stickers before validation." }); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      validateStateInBrowser(candidate).then((validation) => { if (active) setStateValidation(validation); }).catch((reason) => { if (active) setStateValidation({ valid: false, message: reason instanceof Error ? reason.message : "Validation failed." }); });
    }, 280);
    return () => { active = false; window.clearTimeout(timer); };
  }, [language, mode, value]);

  async function runSolver() {
    if (mode === "state" && !stateValidation?.valid) { setError(stateValidation?.message ?? (language === "vi" ? "Đang kiểm tra trạng thái cube." : "Validating cube state.")); return; }
    setLoading(true);
    setPlaying(false);
    setError("");
    setSolverStatus(language === "vi" ? "Đang chuẩn bị dữ liệu cube…" : "Preparing cube data…");
    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (solverKind === "bld") {
        setSolverStatus(language === "vi" ? "Đang dựng memo 3-Style…" : "Building 3-Style memo…");
        const next = await analyzeBldInBrowser(mode, value.trim());
        setBldResult(next);
        setResult(null);
        cursorRef.current = 0;
        setCubeMotion({ id: ++motionIdRef.current, kind: "reset", direction: "forward" });
        setCursor(0);
        if (mode === "state") rememberRecentState(value.trim(), crossColor);
        return;
      }
      setSolverStatus(language === "vi" ? `Đang tìm ${openingModeLabel(opening, language)}…` : `Searching ${openingModeLabel(opening, language)}…`);
      const next = await solveInBrowser(mode, value.trim(), crossColor, opening, { preferredSlot, excludedSlots }, lastLayer, openingDepth, openingFindResult, directNodeBudget);
      setResult(next);
      setBldResult(null);
      cursorRef.current = 0;
      setCubeMotion({ id: ++motionIdRef.current, kind: "reset", direction: "forward" });
      setCursor(0);
      if (mode === "state") rememberRecentState(value.trim(), crossColor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể chạy solver với đầu vào này.");
    } finally {
      setLoading(false);
      setSolverStatus("");
    }
  }

  const phaseCount = result?.phases.filter((phase) => phase.moves.length > 0).length ?? 0;
  const rememberRecentState = (state: string, color: CrossColor) => {
    if (state.length !== 54) return;
    const next: RecentCubeState[] = [{ id: `${Date.now()}-${state.slice(0, 6)}`, state, crossColor: color, label: `${language === "vi" ? "State" : "State"} · ${new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date())}`, savedAt: new Date().toISOString() }, ...recentStates.filter((item) => item.state !== state)].slice(0, 8);
    setRecentStates(next); localStorage.setItem(RECENT_STATE_KEY, JSON.stringify(next));
  };
  const loadRecentState = (item: RecentCubeState) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(item.state); setSavedState(item.state); setCrossColor(item.crossColor); setResult(null); setBldResult(null); setCursor(0); setError(""); };
  const removeRecentState = (id: string) => { const next = recentStates.filter((item) => item.id !== id); setRecentStates(next); localStorage.setItem(RECENT_STATE_KEY, JSON.stringify(next)); };
  const selectCursor = (next: number, intent: CursorIntent = "seek") => { setPlaying(false); updateCursor(next, intent); };
  const applyStateEdit = (next: string) => {
    const current = value.length === 54 ? value : SOLVED_STATE;
    if (next === current) return;
    stateHistory.current.past = [...stateHistory.current.past, current].slice(-80);
    stateHistory.current.future = [];
    setValue(next);
    setSavedState(next);
   
    setStateHistoryVersion((version) => version + 1);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };
  const undoStateEdit = () => {
    const previous = stateHistory.current.past.at(-1);
    if (!previous) return;
    const current = value.length === 54 ? value : SOLVED_STATE;
    stateHistory.current.past = stateHistory.current.past.slice(0, -1);
    stateHistory.current.future = [...stateHistory.current.future, current].slice(-80);
    setValue(previous);
    setSavedState(previous);
    setBldResult(null);
    setStateHistoryVersion((version) => version + 1);
  };
  const redoStateEdit = () => {
    const next = stateHistory.current.future.at(-1);
    if (!next) return;
    const current = value.length === 54 ? value : SOLVED_STATE;
    stateHistory.current.future = stateHistory.current.future.slice(0, -1);
    stateHistory.current.past = [...stateHistory.current.past, current].slice(-80);
    setValue(next);
    setSavedState(next);
    setBldResult(null);
    setStateHistoryVersion((version) => version + 1);
  };
  const switchInputMode = (next: "scramble" | "state") => {
    if (next === mode) return;
    if (mode === "scramble") setSavedScramble(value); else setSavedState(value);
    setMode(next);
    setValue(next === "scramble" ? savedScramble : savedState);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setPlaying(false);
    setError("");
  };

  return (
    <div className="studio-page bs-page">
      <div className="container py-4">
        <PageHeader
          title={solverKind === "bld" ? (language === "vi" ? "Luyện ghi nhớ" : "Memory practice") : (language === "vi" ? "Giải Rubik" : "Rubik Solver")}
          description={solverKind === "bld" ? (language === "vi" ? "Tạo memo 3-Style từ trạng thái cube và tiếp tục luyện tập theo lộ trình." : "Build a 3-Style memo from the cube state and continue with guided practice.") : mode === "state" ? (language === "vi" ? "Tô màu trạng thái cube hoặc dán 54 sticker để tìm cách giải." : "Paint the cube state or paste 54 stickers to find a solution.") : (language === "vi" ? "Nhập scramble, xem từng chặng CFOP và luyện theo cách giải được kiểm chứng." : "Enter a scramble, inspect each CFOP stage and practise the verified solution.")}
          actions={<Link href="/timer" className="btn btn-outline-secondary"><Timer className="fs-6 me-1" />{language === "vi" ? "Bấm giờ" : "Timer"}</Link>}
        />

        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="small text-uppercase text-body-secondary mb-1">{language === "vi" ? "Không gian làm việc" : "Workspace"}</p>
                <h2 className="h5 mb-0">{solverKind === "bld" ? (language === "vi" ? "Nâng cao · 3-Style BLD" : "Advanced · 3-Style BLD") : (language === "vi" ? "Solver CFOP" : "CFOP solver")}</h2>
              </div>
              {loading ? <div className="alert alert-primary py-2 px-3 mb-0 d-flex align-items-center gap-2" role="status" aria-live="polite"><span className="spinner-border spinner-border-sm" aria-hidden="true" /><span className="small">{solverStatus}</span></div> : <span className="badge rounded-pill text-bg-success"><ShieldCheck className="fs-6 me-1" />{language === "vi" ? "Sẵn sàng" : "Ready"}</span>}
            </div>
            <div className="row g-3 align-items-center mt-2">
              <div className="col-12 col-lg-auto">
                <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Chế độ solver" : "Solver mode"}>
                  {(["cfop", "bld"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={solverKind === item} onClick={() => { setSolverKind(item); setResult(null); setBldResult(null); setCursor(0); setPlaying(false); setError(""); }} className={solverKind === item ? "btn btn-primary" : "btn btn-outline-primary"}>{item === "cfop" ? (language === "vi" ? "Giải Rubik" : "Solve Rubik") : (language === "vi" ? "Nâng cao" : "Advanced")}</button>)}
                </div>
              </div>
              <div className="col-12 col-lg-auto">
                <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Nguồn đầu vào" : "Input source"}>
                  {(["scramble", "state"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => switchInputMode(item)} className={mode === item ? "btn btn-primary" : "btn btn-outline-primary"}>{item === "scramble" ? t("input.scramble") : t("input.state")}</button>)}
                </div>
              </div>
              {solverKind === "cfop" ? <div className="col-12 col-lg"><div className="beginner-hint small d-flex flex-wrap align-items-center gap-2 mb-0 p-2 px-3"><span>{language === "vi" ? "Nhập khối rồi bấm Tìm cách giải; các tùy chọn nâng cao là không bắt buộc." : "Enter the cube and choose Find a solution; advanced options are optional."}</span><button type="button" className="btn btn-link btn-sm ms-auto p-0" onClick={() => { const defaults = readSolverSettings(); setCrossColor(defaults.crossColor); setOpening(defaults.opening); setOpeningDepth(defaults.openingDepth); setOpeningFindResult(defaults.openingFindResult); setDirectNodeBudget(defaults.directNodeBudget); setLastLayer(defaults.lastLayer); setPreferredSlot(defaults.preferredSlot); setExcludedSlots(defaults.excludedSlots); }}>{language === "vi" ? "Đặt lại" : "Reset"}</button></div></div> : null}
            </div>
          </div>
        </section>

        <section className="row g-4 align-items-start">
          <aside className="col-12 col-xl-5">
            <section className="card h-100">
              <div className="card-header d-flex align-items-start justify-content-between gap-2">
                <div><p className="small text-uppercase text-body-secondary mb-1">{language === "vi" ? "Bước 1 · Nhập dữ liệu" : "Step 1 · Input"}</p><h2 className="h5 mb-0">{mode === "scramble" ? (language === "vi" ? "Scramble của khối" : "Cube scramble") : (language === "vi" ? "Trạng thái khối" : "Cube state")}</h2></div>
                <span className="badge text-bg-light">{mode === "scramble" ? "SCRAMBLE" : "54 STICKERS"}</span>
              </div>
              <div className="card-body">
                {solverKind === "bld" && <div className="alert alert-info small"><strong>BUFFER / UF (C)</strong> · UBL (A)<br />{language === "vi" ? "Chuẩn bị trace memo và execution key." : "Prepare memo trace and execution key."}</div>}
                {opening !== "cross" && opening !== "xxxxcross" && <div className="accordion mb-3" id="studio-f2l-settings"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-f2l-settings-body" aria-expanded="false" aria-controls="studio-f2l-settings-body">{language === "vi" ? "Cài đặt slot F2L" : "F2L slot settings"}</button></h3><div id="studio-f2l-settings-body" className="accordion-collapse collapse"><div className="accordion-body"><label className="form-label">{language === "vi" ? "Ưu tiên F2L" : "F2L priority"}</label><div className="btn-group w-100" role="group"><button type="button" onClick={() => setPreferredSlot(undefined)} className={!preferredSlot ? "btn btn-primary" : "btn btn-outline-secondary"}>{language === "vi" ? "Tự" : "Any"}</button>{F2L_SLOTS.map((slot) => <button key={slot} type="button" disabled={excludedSlots.includes(slot)} onClick={() => setPreferredSlot(preferredSlot === slot ? undefined : slot)} className={preferredSlot === slot ? "btn btn-primary" : "btn btn-outline-secondary"}>{slot}</button>)}</div><label className="form-label mt-3">{language === "vi" ? "Loại trừ slot" : "Exclude slots"}</label><div className="btn-group w-100" role="group">{F2L_SLOTS.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => { setExcludedSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]); if (preferredSlot === slot) setPreferredSlot(undefined); }} className={excludedSlots.includes(slot) ? "btn btn-danger" : "btn btn-outline-secondary"}>{slot}</button>)}</div></div></div></div></div>}
                {mode === "scramble" ? <textarea aria-label={t("input.label")} value={value} onChange={(event) => { setValue(event.target.value); setSavedScramble(event.target.value); setBldResult(null); }} placeholder={language === "vi" ? "Nhập scramble · R U R' U'" : "Enter scramble · R U R' U'"} spellCheck={false} className="form-control mt-4" rows={5} /> : <><div className="mt-4"><CubeStateEditor state={value} onChange={applyStateEdit} disabled={loading} canUndo={stateHistory.current.past.length > 0} canRedo={stateHistory.current.future.length > 0} onUndo={undoStateEdit} onRedo={redoStateEdit} selectedColor={paintColor} onSelectedColorChange={setPaintColor} controlsOnly /></div><p className="small text-body-secondary mt-2">{language === "vi" ? "Tô trực tiếp trên sơ đồ 2D lớn cạnh Cube 3D." : "Paint directly on the large 2D net beside the 3D cube."}</p><div className={stateValidation?.valid ? "alert alert-success mt-3" : "alert alert-danger mt-3"}>{stateValidation?.valid ? `✓ ${stateValidation.message}` : stateValidation?.message ?? (language === "vi" ? "Đang chờ kiểm tra state." : "Waiting to validate state.")}</div>{recentStates.length > 0 && <div className="mt-3"><p className="small fw-semibold mb-2"><History className="fs-6 me-1" /> {language === "vi" ? "State gần đây" : "Recent states"}</p><div className="list-group">{recentStates.map((item) => <div key={item.id} className="list-group-item d-flex align-items-center gap-2"><button type="button" onClick={() => loadRecentState(item)} className="btn btn-link text-start text-truncate flex-grow-1 p-0">{item.label}</button><button type="button" onClick={() => removeRecentState(item.id)} aria-label={language === "vi" ? `Xóa ${item.label}` : `Remove ${item.label}`} className="btn btn-outline-danger btn-sm"><Trash2 className="fs-6" /></button></div>)}</div></div>}<div className="accordion mt-3" id="studio-state-paste"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-state-paste-body" aria-expanded="false" aria-controls="studio-state-paste-body">{language === "vi" ? "Dán chuỗi 54 sticker" : "Paste 54-sticker state"}</button></h3><div id="studio-state-paste-body" className="accordion-collapse collapse"><div className="accordion-body"><textarea value={value} onChange={(event) => applyStateEdit(event.target.value.replaceAll(/\s/g, "").toUpperCase())} spellCheck={false} className="form-control" rows={3} /></div></div></div></div></>}
                {error && <div className="mt-3"><StatusFeedback tone="danger" title={language === "vi" ? "Không thể chạy solver" : "Solver could not run"}>{error}</StatusFeedback></div>}
                <button disabled={loading || !value.trim() || (mode === "state" && !stateValidation?.valid)} onClick={runSolver} className="btn btn-primary btn-lg w-100 mt-4">{loading ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />{solverStatus}</> : <><Sparkles className="fs-6 me-1" />{solverKind === "bld" ? (language === "vi" ? "TẠO MEMO 3-STYLE" : "BUILD 3-STYLE MEMO") : t("input.solve")}</>}</button>
              </div>
            </section>
            <section className="card mt-3"><div className="card-header p-0"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-camera-body" aria-expanded="false" aria-controls="studio-camera-body">{language === "vi" ? "Quét camera · tùy chọn" : "Camera scan · optional"}</button></div><div id="studio-camera-body" className="collapse"><div className="card-body"><CameraScanner onState={(state) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(state); setSavedState(state); setResult(null); setBldResult(null); setCursor(0); setError(""); }} /></div></div></section>
            <section className="card mt-3" aria-label={language === "vi" ? "Thông tin khối" : "Cube information"}><div className="card-header"><h2 className="h6 mb-0">{language === "vi" ? "Thông tin khối" : "Cube information"}</h2></div><div className="card-body"><p className="small text-body-secondary mb-0">{mode === "scramble" ? (language === "vi" ? "Bạn đã nhập cách khối được xáo trộn. Bấm nút Tìm cách giải khi sẵn sàng." : "You entered how the cube was mixed. Choose Find a solution when ready.") : (language === "vi" ? "Bạn đang tô màu trực tiếp trên hình khối. Hoàn tất cả sáu mặt rồi bấm Tìm cách giải." : "You are coloring the cube directly. Complete all six sides, then choose Find a solution.")}</p></div></section>
          </aside>

          <section className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm">
              <div className="card-header d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div><p className="small text-uppercase text-body-secondary mb-1">{solverKind === "bld" ? "3-STYLE · MEMO" : `${t("guide.step")} · ${String(cursor).padStart(2, "0")} / ${String(totalMoves).padStart(2, "0")}`}</p><h2 className="h4 mb-1">{solverKind === "bld" ? (bldResult ? (language === "vi" ? "Đường ghi nhớ đã sẵn sàng" : "Memory path is ready") : (language === "vi" ? "Tạo memo từ trạng thái cube" : "Build a memo from this cube")) : activePhase ? simplePhase(activePhase.name, language) : t("guide.ready")}</h2><p className="text-body-secondary mb-0">{solverKind === "bld" ? (bldResult ? (language === "vi" ? "Cạnh và góc đã được tách để bạn chuyển sang Study luyện theo từng bước." : "Edges and corners are separated; continue in Study for the guided learning path.") : (language === "vi" ? "Studio chỉ tạo và xem memo. Học và luyện theo lộ trình nằm ở Study." : "Studio creates and previews memo; the guided learning path lives in Study.")) : currentStep ? `${t("guide.move")}: ${currentStep.move}` : t("guide.help")}</p></div><div className="text-end"><span className="small text-body-secondary d-block">{solverKind === "bld" ? (language === "vi" ? "Cạnh / góc" : "Edges / corners") : t("guide.move").toUpperCase()}</span><strong className="fs-3">{solverKind === "bld" ? (bldResult ? `${bldResult.analysis.edges.memo.length} / ${bldResult.analysis.corners.memo.length}` : "—") : currentStep?.move ?? "—"}</strong></div>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><div className="btn-group" role="tablist" aria-label={language === "vi" ? "Chế độ xem khối Rubik" : "Rubik cube view"}><button type="button" role="tab" aria-selected={cubeView === "2d"} onClick={() => setCubeView("2d")} className={cubeView === "2d" ? "btn btn-primary btn-sm" : "btn btn-outline-primary btn-sm"}>2D</button><button type="button" role="tab" aria-selected={cubeView === "3d"} onClick={() => setCubeView("3d")} className={cubeView === "3d" ? "btn btn-primary btn-sm" : "btn btn-outline-primary btn-sm"}>3D</button></div><span className="small text-body-secondary">{result ? `${totalMoves} ${language === "vi" ? "lượt xoay" : "turns"}` : (language === "vi" ? "Chưa có lời giải" : "No solution yet")}</span></div>
                <div className="rounded bg-body-tertiary p-2 p-md-3 d-flex justify-content-center">{cubeView === "2d" ? <CubeNet state={solverKind === "bld" ? (bldResult?.initial_state ?? currentState) : mode === "state" ? (value.length === 54 ? value : SOLVED_STATE) : currentState} editable={mode === "state" && solverKind !== "bld"} selectedColor={paintColor} onStateChange={applyStateEdit} disabled={loading} emphasis="studio" /> : <Cube3DGuide state={solverKind === "bld" ? (bldResult?.initial_state ?? currentState) : currentState} previousState={previousState} move={solverKind === "bld" ? undefined : currentStep?.move} step={cursor} crossColor={crossColor} alignCross xcrossSlots={activeXCrossSlots} lastLayerCase={activeLastLayerCase} transition={cubeMotion.kind} transitionDirection={cubeMotion.direction} transitionId={cubeMotion.id} phaseLabel={cubeMotion.phaseName ? simplePhase(cubeMotion.phaseName, language) : undefined} turnDurationMs={playing ? Math.max(120, Math.round(280 / playbackSpeed)) : 340} />}</div>
                {solverKind !== "bld" && <><div className="d-flex flex-wrap align-items-center gap-2 mt-3"><button onClick={() => selectCursor(Math.max(0, cursor - 1), "step")} disabled={cursor === 0} aria-label={t("guide.previous")} className="btn btn-outline-secondary"><ArrowLeft className="fs-6" /></button><button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} aria-label={playing ? t("guide.pause") : t("guide.play")} className="btn btn-primary">{playing ? <RotateCcw className="fs-6" /> : <Play className="fs-6" />}</button><button onClick={() => selectCursor(Math.min(totalMoves, cursor + 1), "step")} disabled={!result || cursor === totalMoves} aria-label={t("guide.next")} className="btn btn-outline-secondary"><ArrowRight className="fs-6" /></button><button onClick={() => selectCursor(0, "reset")} disabled={!result} aria-label={t("guide.reset")} className="btn btn-outline-secondary ms-auto"><RotateCcw className="fs-6" /></button></div><div className="row g-3 align-items-center mt-2"><div className="col"><input aria-label={language === "vi" ? "Chọn bước xoay" : "Choose a turn"} type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => selectCursor(Number(event.target.value), "seek")} className="form-range" /><small className="text-body-secondary">{cursor} {language === "vi" ? "lượt xoay" : "turns"}</small></div><div className="col-12 col-sm-auto"><label className="form-label mb-0">{language === "vi" ? "Tốc độ" : "Speed"} {playbackSpeed.toFixed(2)}×<input aria-label={language === "vi" ? "Tốc độ phát" : "Playback speed"} type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} className="form-range" /></label></div></div></>}
              </div>
            </div>
            {solverKind !== "bld" && openingOutcome && <div className={openingTelemetry?.did_fallback ? "alert alert-warning mt-3 mb-0" : "alert alert-success mt-3 mb-0"}><strong>{language === "vi" ? "Bước đầu đã sẵn sàng:" : "First steps are ready:"}</strong> {openingOutcome.moves} {language === "vi" ? "lượt xoay" : "turns"}{openingTelemetry?.did_fallback ? ` · ${language === "vi" ? "Ứng dụng đã tự chọn cách phù hợp." : "The app chose a suitable method automatically."}` : ""}</div>}
            {solverKind !== "bld" && lastLayerTelemetry && <div className={lastLayerTelemetry.did_fallback ? "alert alert-warning mt-3 mb-0" : "alert alert-success mt-3 mb-0"}><strong>{language === "vi" ? "Phần cuối:" : "Final part:"}</strong> {lastLayerModeLabel(lastLayerTelemetry.achieved, language)}</div>}
          </section>
        </section>

        {(result || bldResult) ? <section className="row g-4 mt-1"><div className="col-12 col-lg-4"><div className="row row-cols-1 row-cols-sm-3 row-cols-lg-1 g-3"><div className="col"><SolverStat label={language === "vi" ? "LƯỢT XOAY" : "TURNS"} value={result ? String(totalMoves) : "—"} icon={<CircleGauge className="fs-4" />} /></div><div className="col"><SolverStat label={language === "vi" ? "CHẶNG" : "STAGES"} value={result ? String(phaseCount) : "—"} icon={<ChevronRight className="fs-4" />} /></div><div className="col"><SolverStat label={language === "vi" ? "TRẠNG THÁI" : "STATUS"} value="✓" icon={<ShieldCheck className="fs-4" />} /></div></div></div><div className="col-12 col-lg-8"><section className="card"><div className="card-body">{solverKind === "bld" && bldResult ? <BldReport result={bldResult} language={language} profile={bldProfile} onProfile={setBldProfile} /> : result ? <CfopReport result={result} language={language} activePhase={activePhase?.name ?? null} cursor={cursor} onSelectPhase={(phase) => selectCursor(phase.end, "phase")} onSelectMove={(moveIndex) => selectCursor(moveIndex, "seek")} /> : null}</div></section></div></section> : null}
      </div>
    </div>
  );
}
