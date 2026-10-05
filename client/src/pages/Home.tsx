/**
 * Soft Focus Workspace: a calm, reusable desktop-first Rubik canvas. Surfaces are
 * grouped by spacing, soft elevation and color—not decorative borders—while 3D cube
 * movement remains the sole rich animation.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, CircleGauge, ClipboardCopy,
  Cpu, FileJson, History, ImageDown, Info, Layers3, Loader2, Play, RotateCcw, Search, ShieldCheck, Sparkles, Trash2,
} from "@/components/ui/BootstrapIcon";
import { Timer } from "@/components/ui/BootstrapIcon";
import { Link } from "wouter";
import { CubeNet, SOLVED_STATE } from "@/components/common/CubeNet";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { BldReport } from "@/features/bld";
import { CubeStateEditor } from "@/components/common/CubeStateEditor";
import { CameraScanner } from "@/components/common/CameraScanner";
import { FieldGroup, PageHeader, StatusFeedback } from "@/components/ui/BootstrapUI";
import { stateFromScramble } from "@/lib/fastCube";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import { CROSS_COLORS, exportCFOPJson, F2L_SLOTS, LAST_LAYER_OPTIONS, lastLayerModeLabel, OPENING_OPTIONS, openingModeLabel, phaseLessonUrl, phaseStudyNote, saveBlob } from "@/lib/solverPresentation";
import { readSolverSettings } from "@/lib/appSettings";
import { readBldProfile, writeBldProfile } from "@/features/bld";
import { readMasteredCaseKeys, writeMasteredCaseKeys } from "@/features/last-layer";
import { analyzeBldInBrowser, listLastLayerCasesInBrowser, solveInBrowser, validateStateInBrowser, warmSolverInBrowser, type BldResult, type CrossColor, type CubeValidation, type F2LSlot, type LastLayerCatalogCase, type LastLayerMode, type OpeningMode, type SolverResult } from "@/lib/solverRuntime";

type CubeMotionKind = "idle" | "move" | "seek" | "phase" | "reset";
type CursorIntent = "step" | "playback" | "seek" | "phase" | "reset";
type RecentCubeState = { id: string; state: string; label: string; savedAt: string; crossColor: CrossColor };
const RECENT_STATE_KEY = "cfop-studio-recent-states-v1";
function exportCFOPImage(result: SolverResult, language: "vi" | "en", options: { ownerName: string; background: string }) {
  const vi = language === "vi";
  const width = 1400; const lineHeight = 42; const height = 220 + result.phases.length * 126;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  ctx.fillStyle = options.background; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(23,34,29,.12)"; ctx.lineWidth = 1; for (let x = 0; x < width; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); } for (let y = 0; y < height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.fillStyle = "#17221d"; ctx.fillRect(0, 0, width, 140); ctx.fillStyle = "#1ba77a"; ctx.fillRect(0, 132, width, 8);
  ctx.fillStyle = "#f4f0e8"; ctx.font = "900 46px Space Grotesk, sans-serif"; ctx.fillText("CFOP SOLVER STUDIO", 58, 70); ctx.font = "700 22px IBM Plex Mono, monospace"; ctx.fillText(options.ownerName.trim() ? `${vi ? "BÁO CÁO CỦA" : "REPORT FOR"} ${options.ownerName.trim()}` : (vi ? "BÁO CÁO LỜI GIẢI" : "SOLUTION REPORT"), 58, 108);
  ctx.fillStyle = "#17221d"; ctx.font = "900 28px Space Grotesk, sans-serif"; ctx.fillText(`${result.trace.length} ${vi ? "nước xoay · CFOP verified" : "moves · CFOP verified"}`, 58, 188);
  result.phases.forEach((phase, index) => { const top = 220 + index * 126; ctx.fillStyle = index % 2 ? "#efe9dc" : "#ffffff"; ctx.fillRect(48, top, width - 96, 102); ctx.strokeStyle = "#17221d"; ctx.strokeRect(48, top, width - 96, 102); ctx.fillStyle = "#1ba77a"; ctx.fillRect(48, top, 8, 102); ctx.fillStyle = "#17221d"; ctx.font = "900 24px Space Grotesk, sans-serif"; ctx.fillText(`${String(index + 1).padStart(2, "0")}  ${simplePhase(phase.name, language)}`, 78, top + 34); ctx.font = "700 17px IBM Plex Mono, monospace"; ctx.fillText(`${phase.moves.length} ${vi ? "nước" : "moves"}${phase.case_id && phase.case_id !== "solved" ? ` · ${phase.case_id}` : ""} · ${phase.valid_after && phase.predicate_after ? "INVARIANT ✓" : "CHECK"}`, 78, top + 64); const notation = (phase.algorithm || phase.moves.join(" ") || "—").slice(0, 132); ctx.fillStyle = "#47534d"; ctx.font = "16px IBM Plex Mono, monospace"; ctx.fillText(notation, 78, top + 88); });
  canvas.toBlob((blob) => { if (blob) saveBlob("cfop-solution-report.png", "image/png", blob); }, "image/png");
}

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
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
  const [catalogFamily, setCatalogFamily] = useState<"all" | "zbll" | "1lll">("zbll");
  const [catalogGroup, setCatalogGroup] = useState("all");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCases, setCatalogCases] = useState<LastLayerCatalogCase[]>([]);
  const [catalogInventory, setCatalogInventory] = useState<LastLayerCatalogCase[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCatalogCase, setSelectedCatalogCase] = useState<LastLayerCatalogCase | null>(null);
  const [onlyUnmasteredCases, setOnlyUnmasteredCases] = useState(false);
  const [paintColor, setPaintColor] = useState<CrossColor>("U");
  const [masteredCaseKeys, setMasteredCaseKeys] = useState<string[]>(() => Array.from(readMasteredCaseKeys()));
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
  const activeLastLayerCase = selectedCatalogCase ?? (activePhase && (activePhase.name === "zbll" || activePhase.name === "1lll") && activePhase.case_id ? { family: activePhase.name, id: activePhase.case_id } : undefined);
  const catalogGroups = useMemo(() => Array.from(new Set(catalogCases.map((catalogCase) => catalogCase.group))).sort((a, b) => a.localeCompare(b)), [catalogCases]);
  const masteredCaseSet = useMemo(() => new Set(masteredCaseKeys), [masteredCaseKeys]);
  const masteredVisibleCount = useMemo(() => catalogCases.filter((catalogCase) => masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`)).length, [catalogCases, masteredCaseSet]);
  const visibleCatalogCases = useMemo(() => onlyUnmasteredCases ? catalogCases.filter((catalogCase) => !masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`)) : catalogCases, [catalogCases, masteredCaseSet, onlyUnmasteredCases]);
  const unmasteredVisibleCount = useMemo(() => catalogCases.filter((catalogCase) => !masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`)).length, [catalogCases, masteredCaseSet]);
  const groupProgress = useMemo(() => Array.from(catalogInventory.reduce((accumulator, catalogCase) => { const key = `${catalogCase.family}:${catalogCase.group}`; const current = accumulator.get(key) ?? { family: catalogCase.family, group: catalogCase.group, mastered: 0, total: 0 }; current.total += 1; if (masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`)) current.mastered += 1; accumulator.set(key, current); return accumulator; }, new Map<string, { family: "zbll" | "1lll"; group: string; mastered: number; total: number }>()).values()).sort((left, right) => left.family.localeCompare(right.family) || left.group.localeCompare(right.group)), [catalogInventory, masteredCaseSet]);
  useEffect(() => { writeMasteredCaseKeys(new Set(masteredCaseKeys)); }, [masteredCaseKeys]);
  const chooseOpening = (nextOpening: OpeningMode) => {
    setOpening(nextOpening);
    if (nextOpening === "xxxxcross") { setPreferredSlot(undefined); setExcludedSlots([]); }
  };
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

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setCatalogLoading(true);
      listLastLayerCasesInBrowser({ family: catalogFamily, group: catalogGroup, query: catalogQuery, limit: 2000 })
        .then((cases) => { if (active) setCatalogCases(cases); })
        .catch(() => { if (active) setCatalogCases([]); })
        .finally(() => { if (active) setCatalogLoading(false); });
    }, 170);
    return () => { active = false; window.clearTimeout(timer); };
  }, [catalogFamily, catalogGroup, catalogQuery]);

  useEffect(() => {
    let active = true;
    listLastLayerCasesInBrowser({ family: catalogFamily, limit: 2000 }).then((cases) => { if (active) setCatalogInventory(cases); }).catch(() => { if (active) setCatalogInventory([]); });
    return () => { active = false; };
  }, [catalogFamily]);

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
  const loadRecentState = (item: RecentCubeState) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(item.state); setSavedState(item.state); setCrossColor(item.crossColor); setSelectedCatalogCase(null); setResult(null); setBldResult(null); setCursor(0); setError(""); };
  const loadCatalogCase = (catalogCase: LastLayerCatalogCase) => {
    stateHistory.current = { past: [], future: [] };
    setStateHistoryVersion((version) => version + 1);
    setMode("state");
    setValue(catalogCase.state);
    setSavedState(catalogCase.state);
    setLastLayer(catalogCase.family);
    setSelectedCatalogCase(catalogCase);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };
  const removeRecentState = (id: string) => { const next = recentStates.filter((item) => item.id !== id); setRecentStates(next); localStorage.setItem(RECENT_STATE_KEY, JSON.stringify(next)); };
  const toggleMasteredCase = (catalogCase: LastLayerCatalogCase) => { const key = `${catalogCase.family}:${catalogCase.id}`; setMasteredCaseKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); };
  const startUnmasteredPractice = () => { const candidates = catalogCases.filter((catalogCase) => !masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`)); if (!candidates.length) return; loadCatalogCase(candidates[Math.floor(Math.random() * candidates.length)]); };
  const selectCursor = (next: number, intent: CursorIntent = "seek") => { setPlaying(false); updateCursor(next, intent); };
  const applyStateEdit = (next: string) => {
    const current = value.length === 54 ? value : SOLVED_STATE;
    if (next === current) return;
    stateHistory.current.past = [...stateHistory.current.past, current].slice(-80);
    stateHistory.current.future = [];
    setValue(next);
    setSavedState(next);
    setSelectedCatalogCase(null);
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
    if (next === "scramble") setSelectedCatalogCase(null);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setPlaying(false);
    setError("");
  };

  return (
    <div className="studio-page bs-page">
      <div className="container py-4">
        <section className="row g-4">
          <header className="col-12 d-flex flex-wrap align-items-center gap-3">
            <PageHeader className="w-100 mb-0" title={solverKind === "bld" ? (language === "vi" ? "Luyện ghi nhớ" : "Memory practice") : (language === "vi" ? "Giải khối Rubik" : "Solve your Rubik's Cube")} description={solverKind === "bld" ? (language === "vi" ? "Dùng phần này khi bạn đã sẵn sàng luyện nâng cao." : "Use this when you are ready for advanced practice.") : mode === "state" ? (language === "vi" ? "Tô màu khối của bạn, sau đó bấm nút tìm cách giải." : "Color your cube, then choose Find a solution.") : (language === "vi" ? "Dán cách khối đang bị xáo trộn, sau đó bấm nút tìm cách giải." : "Paste how the cube was mixed, then choose Find a solution.")} />
            <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Chế độ solver" : "Solver mode"}>
              {(["cfop", "bld"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={solverKind === item} onClick={() => { setSolverKind(item); setResult(null); setBldResult(null); setCursor(0); setPlaying(false); setError(""); }} className={solverKind === item ? "btn btn-primary" : "btn btn-outline-primary"}>{item === "cfop" ? (language === "vi" ? "Giải Rubik" : "Solve Rubik") : (language === "vi" ? "Nâng cao" : "Advanced")}</button>)}
            </div>
            <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Nguồn đầu vào" : "Input source"}>
              {(["scramble", "state"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => switchInputMode(item)} className={mode === item ? "btn btn-primary" : "btn btn-outline-primary"}>{item === "scramble" ? t("input.scramble") : t("input.state")}</button>)}
            </div>
            {loading ? <div className="alert alert-primary py-2 px-3 mb-0 ms-lg-auto d-flex align-items-center gap-2" role="status" aria-live="polite"><span className="spinner-border spinner-border-sm" aria-hidden="true" /><span className="small">{solverStatus}</span></div> : null}
            {solverKind === "cfop" ? <div className="beginner-hint small d-flex flex-wrap align-items-center gap-2 w-100 mb-0 p-3"><span>{language === "vi" ? "Chỉ cần nhập khối và bấm “Tìm cách giải”. Các lựa chọn thêm là không bắt buộc." : "Just enter the cube and choose Find a solution. Extra options are optional."}</span><button type="button" className="btn btn-outline-secondary btn-sm ms-sm-auto" onClick={() => { const defaults = readSolverSettings(); setCrossColor(defaults.crossColor); setOpening(defaults.opening); setOpeningDepth(defaults.openingDepth); setOpeningFindResult(defaults.openingFindResult); setDirectNodeBudget(defaults.directNodeBudget); setLastLayer(defaults.lastLayer); setPreferredSlot(defaults.preferredSlot); setExcludedSlots(defaults.excludedSlots); }}>{language === "vi" ? "Đặt lại lựa chọn" : "Reset choices"}</button></div> : null}
          </header>
          <aside className="col-12 col-lg-4"><section className="card"><div className="card-header"><h2 className="h5 mb-0">{mode === "scramble" ? (language === "vi" ? "Khối đang bị xáo trộn như thế nào?" : "How was the cube mixed?") : (language === "vi" ? "Tô màu khối của bạn" : "Color your cube")}</h2></div><div className="card-body">
                {solverKind === "bld" && <div className="alert alert-info small">BUFFER / UF (C) · UBL (A) — {language === "vi" ? "Chuẩn bị trace memo và execution key." : "Prepare memo trace and execution key."}</div>}
                {false && <div className="accordion mb-3" id="studio-solver-settings"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-solver-settings-body" aria-expanded="false" aria-controls="studio-solver-settings-body">{language === "vi" ? "Tùy chọn thêm" : "More options"}</button></h3><div id="studio-solver-settings-body" className="accordion-collapse collapse"><div className="accordion-body">
                  <label className="form-label">{language === "vi" ? "Màu Cross" : "Cross color"}</label><div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label={language === "vi" ? "Chọn màu Cross" : "Choose Cross color"}>{CROSS_COLORS.map((item) => <button key={item.value} type="button" role="radio" aria-checked={crossColor === item.value} aria-label={language === "vi" ? `Cross ${item.vi}` : `Cross ${item.en}`} title={language === "vi" ? item.vi : item.en} onClick={() => setCrossColor(item.value)} className={crossColor === item.value ? "btn btn-primary btn-sm p-2" : "btn btn-outline-secondary btn-sm p-2"}><span className="d-block rounded-circle border" style={{ width: "0.75rem", height: "0.75rem", backgroundColor: item.hex }} /><span className="visually-hidden">{language === "vi" ? item.vi : item.en}</span></button>)}</div>
                  <label className="form-label mt-3" htmlFor="studio-opening">{language === "vi" ? "Opening" : "Opening"}</label><select id="studio-opening" value={opening} onChange={(event) => chooseOpening(event.target.value as OpeningMode)} className="form-select"><option value="cross">{language === "vi" ? "Cross chuẩn · chỉ Cross" : "Standard Cross · Cross only"}</option><option value="auto">Auto XCross · Cross + 1 F2L</option><option value="xxcross">Auto XXCross · Cross + 2 F2L</option><option value="xxxcross">Auto XXXCross · Cross + 3 F2L</option><option value="xxxxcross">Auto XXXXCross · Full F2L</option></select>
                  {opening !== "cross" && <><div className="form-check form-switch mt-3"><input id="studio-opening-find-result" type="checkbox" role="switch" checked={openingFindResult} onChange={(event) => setOpeningFindResult(event.target.checked)} className="form-check-input" /><label className="form-check-label" htmlFor="studio-opening-find-result">{language === "vi" ? "Chỉ nhận direct Opening đúng tier" : "Accept only a direct opening at the selected tier"}</label><p className="small text-body-secondary mb-0 mt-1">{language === "vi" ? "Không gộp Cross rồi F2L tuần tự để gắn nhãn tier cao. Nếu không có chuỗi direct, solver báo fallback thực tế." : "Never labels sequential Cross then F2L as a high tier. If no direct sequence exists, the solver reports the actual fallback."}</p></div><label className="form-label mt-3 d-flex justify-content-between" htmlFor="studio-node-budget"><span>{language === "vi" ? "Node threshold direct" : "Direct node threshold"}</span><strong>{directNodeBudget.toLocaleString()}</strong></label><input id="studio-node-budget" aria-label={language === "vi" ? "Node threshold direct" : "Direct node threshold"} type="range" min="500" max="50000" step="500" value={directNodeBudget} onChange={(event) => setDirectNodeBudget(Number(event.target.value))} className="form-range" /><p className="small text-body-secondary mb-0">{language === "vi" ? "Ngưỡng cao thử nhiều trạng thái hơn nhưng chậm hơn; áp dụng riêng cho direct XCross đến XXXXCROSS." : "A higher threshold explores more states but takes longer; it only applies to direct XCross through XXXXCross."}</p></>}
                  <label className="form-label mt-3" htmlFor="studio-last-layer">Last Layer</label><select id="studio-last-layer" value={lastLayer} onChange={(event) => setLastLayer(event.target.value as LastLayerMode)} className="form-select"><option value="auto">Auto · ZBLL → 1LLL → OLL/PLL</option><option value="oll_pll">OLL + PLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select>
                </div></div></div></div>}
                {opening !== "cross" && opening !== "xxxxcross" && <div className="accordion mb-3" id="studio-f2l-settings"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-f2l-settings-body" aria-expanded="false" aria-controls="studio-f2l-settings-body">{language === "vi" ? "Cài đặt slot F2L" : "F2L slot settings"}</button></h3><div id="studio-f2l-settings-body" className="accordion-collapse collapse"><div className="accordion-body"><label className="form-label">{language === "vi" ? "Ưu tiên F2L" : "F2L priority"}</label><div className="btn-group w-100" role="group"><button type="button" onClick={() => setPreferredSlot(undefined)} className={!preferredSlot ? "btn btn-primary" : "btn btn-outline-secondary"}>{language === "vi" ? "Tự" : "Any"}</button>{F2L_SLOTS.map((slot) => <button key={slot} type="button" disabled={excludedSlots.includes(slot)} onClick={() => setPreferredSlot(preferredSlot === slot ? undefined : slot)} className={preferredSlot === slot ? "btn btn-primary" : "btn btn-outline-secondary"}>{slot}</button>)}</div><label className="form-label mt-3">{language === "vi" ? "Loại trừ slot" : "Exclude slots"}</label><div className="btn-group w-100" role="group">{F2L_SLOTS.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => { setExcludedSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]); if (preferredSlot === slot) setPreferredSlot(undefined); }} className={excludedSlots.includes(slot) ? "btn btn-danger" : "btn btn-outline-secondary"}>{slot}</button>)}</div></div></div></div></div>}
                {mode === "scramble" ? <textarea aria-label={t("input.label")} value={value} onChange={(event) => { setValue(event.target.value); setSavedScramble(event.target.value); setBldResult(null); }} placeholder={language === "vi" ? "Nhập scramble · R U R' U'" : "Enter scramble · R U R' U'"} spellCheck={false} className="form-control mt-4" rows={5} /> : <><div className="mt-4"><CubeStateEditor state={value} onChange={applyStateEdit} disabled={loading} canUndo={stateHistory.current.past.length > 0} canRedo={stateHistory.current.future.length > 0} onUndo={undoStateEdit} onRedo={redoStateEdit} selectedColor={paintColor} onSelectedColorChange={setPaintColor} controlsOnly /></div><p className="small text-body-secondary mt-2">{language === "vi" ? "Tô trực tiếp trên sơ đồ 2D lớn cạnh Cube 3D." : "Paint directly on the large 2D net beside the 3D cube."}</p><div className={stateValidation?.valid ? "alert alert-success mt-3" : "alert alert-danger mt-3"}>{stateValidation?.valid ? `✓ ${stateValidation.message}` : stateValidation?.message ?? (language === "vi" ? "Đang chờ kiểm tra state." : "Waiting to validate state.")}</div>{recentStates.length > 0 && <div className="mt-3"><p className="small fw-semibold mb-2"><History className="fs-6 me-1" /> {language === "vi" ? "State gần đây" : "Recent states"}</p><div className="list-group">{recentStates.map((item) => <div key={item.id} className="list-group-item d-flex align-items-center gap-2"><button type="button" onClick={() => loadRecentState(item)} className="btn btn-link text-start text-truncate flex-grow-1 p-0">{item.label}</button><button type="button" onClick={() => removeRecentState(item.id)} aria-label={language === "vi" ? `Xóa ${item.label}` : `Remove ${item.label}`} className="btn btn-outline-danger btn-sm"><Trash2 className="fs-6" /></button></div>)}</div></div>}<div className="accordion mt-3" id="studio-state-paste"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-state-paste-body" aria-expanded="false" aria-controls="studio-state-paste-body">{language === "vi" ? "Dán chuỗi 54 sticker" : "Paste 54-sticker state"}</button></h3><div id="studio-state-paste-body" className="accordion-collapse collapse"><div className="accordion-body"><textarea value={value} onChange={(event) => applyStateEdit(event.target.value.replaceAll(/\s/g, "").toUpperCase())} spellCheck={false} className="form-control" rows={3} /></div></div></div></div></>}
                {error && <div className="mt-3"><StatusFeedback tone="danger" title={language === "vi" ? "Không thể chạy solver" : "Solver could not run"}>{error}</StatusFeedback></div>}
                <button disabled={loading || !value.trim() || (mode === "state" && !stateValidation?.valid)} onClick={runSolver} className="btn btn-primary w-100 mt-4">
                  {loading ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" />{solverStatus}</> : <><Sparkles className="fs-6" />{solverKind === "bld" ? (language === "vi" ? "TẠO MEMO 3-STYLE" : "BUILD 3-STYLE MEMO") : t("input.solve")}</>}
                </button>
              </div>
            </section>
            <section className="card mt-3"><div className="card-header p-0"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-camera-body" aria-expanded="false" aria-controls="studio-camera-body">{language === "vi" ? "Quét camera · tùy chọn" : "Camera scan · optional"}</button></div><div id="studio-camera-body" className="collapse"><div className="card-body"><CameraScanner onState={(state) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(state); setSavedState(state); setResult(null); setBldResult(null); setCursor(0); setError(""); }} /></div></div></section>
            <section className="card mt-3" aria-label={language === "vi" ? "Thông tin khối" : "Cube information"}><div className="card-header"><h2 className="h6 mb-0">{language === "vi" ? "Thông tin khối" : "Cube information"}</h2></div><div className="card-body"><p className="small text-body-secondary mb-0">{mode === "scramble" ? (language === "vi" ? "Bạn đã nhập cách khối được xáo trộn. Bấm nút Tìm cách giải khi sẵn sàng." : "You entered how the cube was mixed. Choose Find a solution when ready.") : (language === "vi" ? "Bạn đang tô màu trực tiếp trên hình khối. Hoàn tất cả sáu mặt rồi bấm Tìm cách giải." : "You are coloring the cube directly. Complete all six sides, then choose Find a solution.")}</p></div></section>
          </aside>

          <section className="col-12 col-lg-8"><div className="card"><div className="card-body">
              <div className="row g-3 align-items-start"><div className="col"><p className="small text-body-secondary mb-1">{solverKind === "bld" ? "3-STYLE · MEMO" : `${t("guide.step")} · ${String(cursor).padStart(2, "0")} / ${String(totalMoves).padStart(2, "0")}`}</p><h2 className="h4">{solverKind === "bld" ? (bldResult ? (language === "vi" ? "Đường ghi nhớ đã sẵn sàng" : "Memory path is ready") : (language === "vi" ? "Tạo memo từ trạng thái cube" : "Build a memo from this cube")) : activePhase ? simplePhase(activePhase.name, language) : t("guide.ready")}</h2><p className="text-body-secondary mb-0">{solverKind === "bld" ? (bldResult ? (language === "vi" ? "Cạnh và góc đã được tách để bạn chuyển sang Study luyện theo từng bước." : "Edges and corners are separated; continue in Study for the guided learning path.") : (language === "vi" ? "Studio chỉ tạo và xem memo. Học và luyện theo lộ trình nằm ở Study." : "Studio creates and previews memo; the guided learning path lives in Study.")) : currentStep ? `${t("guide.move")}: ${currentStep.move}` : t("guide.help")}</p></div><div className="col-12 col-sm-auto"><div className="card bg-body-tertiary"><div className="card-body py-2"><small className="text-body-secondary d-block">{solverKind === "bld" ? (language === "vi" ? "Cạnh / góc" : "Edges / corners") : t("guide.move").toUpperCase()}</small><strong className="fs-4">{solverKind === "bld" ? (bldResult ? `${bldResult.analysis.edges.memo.length} / ${bldResult.analysis.corners.memo.length}` : "—") : currentStep?.move ?? "—"}</strong></div></div></div></div>
              <div className="card bg-body-tertiary mt-4"><div className="card-body">
                <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Chế độ xem khối Rubik" : "Rubik cube view"}>
                  <button type="button" role="tab" aria-selected={cubeView === "2d"} onClick={() => setCubeView("2d")} className={cubeView === "2d" ? "btn btn-primary" : "btn btn-outline-primary"}>2D</button>
                  <button type="button" role="tab" aria-selected={cubeView === "3d"} onClick={() => setCubeView("3d")} className={cubeView === "3d" ? "btn btn-primary" : "btn btn-outline-primary"}>3D</button>
                </div>
                {selectedCatalogCase && <LastLayerFormulaStrip catalogCase={selectedCatalogCase} mastered={masteredCaseSet.has(`${selectedCatalogCase.family}:${selectedCatalogCase.id}`)} language={language} onToggleMastered={() => toggleMasteredCase(selectedCatalogCase)} />}
                <div className="d-flex justify-content-center mt-3">{cubeView === "2d" ? <CubeNet state={solverKind === "bld" ? (bldResult?.initial_state ?? currentState) : mode === "state" ? (value.length === 54 ? value : SOLVED_STATE) : currentState} editable={mode === "state" && solverKind !== "bld"} selectedColor={paintColor} onStateChange={applyStateEdit} disabled={loading} emphasis="studio" /> : <Cube3DGuide state={solverKind === "bld" ? (bldResult?.initial_state ?? currentState) : currentState} previousState={previousState} move={solverKind === "bld" ? undefined : currentStep?.move} step={cursor} crossColor={crossColor} alignCross xcrossSlots={activeXCrossSlots} lastLayerCase={activeLastLayerCase} transition={cubeMotion.kind} transitionDirection={cubeMotion.direction} transitionId={cubeMotion.id} phaseLabel={cubeMotion.phaseName ? simplePhase(cubeMotion.phaseName, language) : undefined} turnDurationMs={playing ? Math.max(120, Math.round(280 / playbackSpeed)) : 340} />}</div>
              </div></div>
              {solverKind !== "bld" && <><div className="d-flex flex-wrap align-items-center gap-2 mt-4">
                <button onClick={() => selectCursor(Math.max(0, cursor - 1), "step")} disabled={cursor === 0} aria-label={t("guide.previous")} className="btn btn-outline-secondary"><ArrowLeft className="fs-6" /></button>
                <button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} aria-label={playing ? t("guide.pause") : t("guide.play")} className="btn btn-primary">{playing ? <RotateCcw className="fs-6" /> : <Play className="fs-6" />}</button>
                <button onClick={() => selectCursor(Math.min(totalMoves, cursor + 1), "step")} disabled={!result || cursor === totalMoves} aria-label={t("guide.next")} className="btn btn-outline-secondary"><ArrowRight className="fs-6" /></button>
                <button onClick={() => selectCursor(0, "reset")} disabled={!result} aria-label={t("guide.reset")} className="btn btn-outline-secondary ms-auto"><RotateCcw className="fs-6" /></button>
              </div>
              {openingOutcome && <div className={openingTelemetry?.did_fallback ? "alert alert-warning mt-3 mb-0" : "alert alert-success mt-3 mb-0"}><strong>{language === "vi" ? "Bước đầu đã sẵn sàng:" : "First steps are ready:"}</strong> {openingOutcome.moves} {language === "vi" ? "lượt xoay" : "turns"}{openingTelemetry?.did_fallback ? ` · ${language === "vi" ? "Ứng dụng đã tự chọn cách phù hợp." : "The app chose a suitable method automatically."}` : ""}</div>}
              {lastLayerTelemetry && <div className={lastLayerTelemetry.did_fallback ? "alert alert-warning mt-3 mb-0" : "alert alert-success mt-3 mb-0"}><strong>{language === "vi" ? "Phần cuối:" : "Final part:"}</strong> {lastLayerModeLabel(lastLayerTelemetry.achieved, language)}</div>}
              <div className="row g-3 align-items-center mt-1"><div className="col"><input aria-label={language === "vi" ? "Chọn bước xoay" : "Choose a turn"} type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => selectCursor(Number(event.target.value), "seek")} className="form-range" /><small className="text-body-secondary">{cursor} {language === "vi" ? "lượt xoay" : "turns"}</small></div><div className="col-12 col-sm-auto"><label className="form-label mb-0">{language === "vi" ? "Tốc độ" : "Speed"} {playbackSpeed.toFixed(2)}×<input aria-label={language === "vi" ? "Tốc độ phát" : "Playback speed"} type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} className="form-range" /></label></div></div></>}
            </div></div>
          </section>

          <aside className="col-12">{(result || bldResult) ? <><section className="card"><div className="card-body"><div className="row g-3"><div className="col-12 col-md-4"><Stat label={language === "vi" ? "LƯỢT XOAY" : "TURNS"} value={result ? String(totalMoves) : "—"} icon={<CircleGauge className="fs-4" />} /></div><div className="col-12 col-md-4"><Stat label={language === "vi" ? "CHẶNG" : "STAGES"} value={result ? String(phaseCount) : "—"} icon={<ChevronRight className="fs-4" />} /></div><div className="col-12 col-md-4"><Stat label={language === "vi" ? "TRẠNG THÁI" : "STATUS"} value="✓" icon={<ShieldCheck className="fs-4" />} /></div></div></div></section><section className="card mt-3"><div className="card-body">{solverKind === "bld" && bldResult ? <BldReport result={bldResult} language={language} profile={bldProfile} onProfile={setBldProfile} /> : result ? <CFOPReport result={result} language={language} activePhase={activePhase?.name ?? null} cursor={cursor} onSelectPhase={(phase) => selectCursor(phase.end, "phase")} onSelectMove={(moveIndex) => selectCursor(moveIndex, "seek")} /> : null}</div></section></> : null}</aside>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode; compact?: boolean }) {
  return <div className="card bg-body-tertiary h-100"><div className="card-body d-flex align-items-center gap-3">{icon}<div><small className="text-body-secondary d-block">{label}</small><strong className="fs-4">{value}</strong></div></div></div>;
}

function DirectSearchTelemetry({ language, telemetry }: { language: "vi" | "en"; telemetry: NonNullable<SolverResult["opening"]["direct_search"]> }) {
  const vi = language === "vi";
  return <section className="card mt-3"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h3 className="h6 mb-0">{vi ? "Trạng thái direct search" : "Direct search status"}</h3><small className="text-body-secondary">{vi ? "Mỗi hàng là một target slot được kiểm tra từ cùng state ban đầu." : "Each row is a slot target checked from the same initial state."}</small></div><span className="badge text-bg-secondary">{telemetry.node_budget.toLocaleString()} {vi ? "node / target" : "nodes / target"}</span></div><div className="table-responsive"><table className="table table-sm align-middle mb-0"><thead><tr><th scope="col">{vi ? "Target slot" : "Target slots"}</th><th scope="col" className="text-end">Node</th><th scope="col" className="text-end">{vi ? "Độ sâu" : "Depth"}</th><th scope="col">{vi ? "Trạng thái" : "Status"}</th></tr></thead><tbody>{telemetry.attempts.map((attempt, index) => { const tone = attempt.status === "solved" ? "text-bg-success" : attempt.status === "budget" ? "text-bg-warning" : "text-bg-secondary"; const status = attempt.status === "solved" ? (vi ? "Có direct" : "Direct found") : attempt.status === "budget" ? (vi ? "Chạm ngưỡng" : "Threshold hit") : (vi ? "Không có trong depth" : "No result at depth"); return <tr key={`${attempt.slots.join("-")}-${index}`}><td><code>{attempt.slots.join(" + ")}</code></td><td className="text-end">{attempt.nodes.toLocaleString()} / {attempt.budget.toLocaleString()}</td><td className="text-end">{attempt.depth}</td><td><span className={`badge ${tone}`}>{status}</span></td></tr>; })}</tbody></table></div></section>;
}

/** Xưởng Cơ Khí Tốc Độ — a searchable record drawer for verified one-look cases. */
function LastLayerExplorer({ language, family, group, query, groups, cases, unfilteredCount, loading, selectedCase, masteredCaseSet, masteredCount, unmasteredCount, onlyUnmastered, groupProgress, onFamily, onGroup, onQuery, onSelect, onToggleUnmastered, onRandomPractice }: {
  language: "vi" | "en";
  family: "all" | "zbll" | "1lll";
  group: string;
  query: string;
  groups: string[];
  cases: LastLayerCatalogCase[];
  unfilteredCount: number;
  loading: boolean;
  selectedCase: LastLayerCatalogCase | null;
  masteredCaseSet: Set<string>;
  masteredCount: number;
  unmasteredCount: number;
  onlyUnmastered: boolean;
  groupProgress: { family: "zbll" | "1lll"; group: string; mastered: number; total: number }[];
  onFamily: (family: "all" | "zbll" | "1lll") => void;
  onGroup: (group: string) => void;
  onQuery: (query: string) => void;
  onSelect: (catalogCase: LastLayerCatalogCase) => void;
  onToggleUnmastered: () => void;
  onRandomPractice: () => void;
}) {
  const vi = language === "vi";
  return <section className="card"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h5 mb-0">Last Layer · Catalog</h2><small className="text-body-secondary">{vi ? "Tra cứu và chọn case" : "Browse and select a case"}</small></div><span className="badge text-bg-secondary">{masteredCount}/{unfilteredCount} {vi ? "đã thuộc" : "mastered"}</span></div><div className="card-body"><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label" htmlFor="studio-family">{vi ? "Loại case" : "Case family"}</label><select id="studio-family" className="form-select" value={family} onChange={(event) => onFamily(event.target.value as "all" | "zbll" | "1lll")}><option value="all">ALL · ZBLL + 1LLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select></div><div className="col-12 col-md-6"><label className="form-label" htmlFor="studio-group">{vi ? "Nhóm" : "Group"}</label><select id="studio-group" className="form-select" value={group} onChange={(event) => onGroup(event.target.value)}><option value="all">{vi ? "Tất cả nhóm" : "All groups"}</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="col-12"><label className="form-label" htmlFor="studio-case-search">{vi ? "Tìm case" : "Search cases"}</label><div className="input-group"><span className="input-group-text"><Search className="fs-5" /></span><input id="studio-case-search" value={query} onChange={(event) => onQuery(event.target.value.slice(0, 80))} placeholder={vi ? "Tìm ID, nhóm hoặc notation" : "Search ID, group or notation"} className="form-control" /></div></div></div><div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={onToggleUnmastered} className={onlyUnmastered ? "btn btn-primary" : "btn btn-outline-secondary"}>{onlyUnmastered ? (vi ? "Chỉ case chưa thuộc" : "Unmastered only") : (vi ? "Tất cả case" : "All cases")}</button><button type="button" onClick={onRandomPractice} disabled={unmasteredCount === 0} aria-label={vi ? "Luyện ngẫu nhiên" : "Random practice"} className="btn btn-outline-secondary"><Sparkles className="fs-5" /></button><span className="small text-body-secondary align-self-center">{unmasteredCount} {vi ? "case chưa thuộc" : "unmastered cases"}</span></div><div className="accordion mt-3" id="studio-group-progress"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-group-progress-body" aria-expanded="false" aria-controls="studio-group-progress-body">{vi ? `Tiến độ theo nhóm · ${groupProgress.length}` : `Progress by group · ${groupProgress.length}`}</button></h3><div id="studio-group-progress-body" className="accordion-collapse collapse"><div className="accordion-body">{groupProgress.map((item) => { const percentage = item.total ? Math.round((item.mastered / item.total) * 100) : 0; return <div key={`${item.family}:${item.group}`} className="mb-3"><div className="d-flex justify-content-between small"><span>{item.family.toUpperCase()} · {item.group}</span><span>{item.mastered}/{item.total}</span></div><div className="progress" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar" style={{ width: `${percentage}%` }}>{percentage}%</div></div></div>; })}</div></div></div></div><div className="list-group mt-3">{loading ? <div className="list-group-item text-center text-body-secondary"><span className="spinner-border spinner-border-sm me-2" />{vi ? "Đang nạp Catalog…" : "Loading catalog…"}</div> : cases.length ? cases.slice(0, 48).map((catalogCase) => { const mastered = masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`); const active = selectedCase?.id === catalogCase.id; return <button key={catalogCase.id} type="button" onClick={() => onSelect(catalogCase)} className={active ? "list-group-item list-group-item-action active" : "list-group-item list-group-item-action"}><span className="d-flex justify-content-between align-items-center gap-2"><span><strong>{catalogCase.id}</strong><small className="d-block">{catalogCase.family.toUpperCase()} · {catalogCase.group}</small></span>{mastered && <span className={active ? "badge text-bg-light" : "badge text-bg-success"}>✓</span>}</span></button>; }) : <div className="alert alert-secondary mb-0">{onlyUnmastered ? (vi ? "Các case trong bộ lọc hiện tại đều đã thuộc." : "Every case in the current filter is mastered.") : (vi ? "Không có case khớp bộ lọc hiện tại." : "No cases match the current filters.")}</div>}</div>{cases.length > 48 && <p className="small text-body-secondary mt-2 mb-0">{vi ? `Hiển thị 48 / ${cases.length} case.` : `Showing 48 / ${cases.length} cases.`}</p>}</div></section>;
}

function LastLayerFormulaStrip({ catalogCase, mastered, language, onToggleMastered }: { catalogCase: LastLayerCatalogCase; mastered: boolean; language: "vi" | "en"; onToggleMastered: () => void }) {
  const vi = language === "vi";
  return <section className="card mt-3"><div className="card-body"><div className="d-flex flex-wrap align-items-start justify-content-between gap-2"><div><span className="badge text-bg-secondary">{catalogCase.family.toUpperCase()} · {catalogCase.group}</span><h3 className="h6 mt-2 mb-0">{catalogCase.id}</h3></div><button type="button" onClick={onToggleMastered} aria-label={mastered ? (vi ? "Bỏ đánh dấu đã thuộc" : "Unmark mastered") : (vi ? "Đánh dấu đã thuộc" : "Mark mastered")} className="btn btn-outline-secondary btn-sm"><Check className="fs-5" /></button></div><pre className="bg-body-tertiary border rounded p-3 text-break text-wrap mt-3 mb-2">{catalogCase.algorithm}</pre><p className="small text-body-secondary mb-0">{vi ? "Công thức này khớp với state trên CubeNet bên dưới." : "This formula matches the CubeNet state below."}</p></div></section>;
}

/** Xưởng Cơ Khí Tốc Độ — report is a readable proof of the CFOP pipeline, not a timer metric. */
function CFOPReport({ result, language, activePhase, cursor, onSelectPhase, onSelectMove }: { result: SolverResult; language: "vi" | "en"; activePhase: string | null; cursor: number; onSelectPhase: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const vi = language === "vi";
  return <section><div className="d-flex flex-wrap align-items-start justify-content-between gap-3 border-bottom pb-3"><div><p className="text-body-secondary small mb-1">{vi ? "CÁC BƯỚC GIẢI" : "SOLUTION STEPS"}</p><h2 className="h4 mb-0">{result.trace.length} {vi ? "lượt xoay" : "turns"}</h2><p className="text-body-secondary mb-0">{vi ? "Bấm vào một chặng để xem và phát các lượt xoay." : "Choose a stage to view and play its turns."}</p></div><button type="button" onClick={() => exportCFOPJson(result)} aria-label={vi ? "Lưu các bước giải" : "Save solution steps"} className="btn btn-outline-secondary btn-sm"><FileJson className="fs-5" /></button></div><div className="list-group mt-3">{result.phases.map((phase, index) => <CFOPPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} cursor={cursor} onSelect={onSelectPhase} onSelectMove={onSelectMove} />)}</div></section>;
}

function CFOPPhaseRow({ phase, index, language, selected, cursor, onSelect, onSelectMove }: { phase: SolverResult["phases"][number]; index: number; language: "vi" | "en"; selected: boolean; cursor: number; onSelect: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const vi = language === "vi";
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  const compactName = simplePhase(phase.name, language);
  return <article className={selected ? "list-group-item active" : "list-group-item"}><div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"}>{String(index + 1).padStart(2, "0")}</button><button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-link text-white text-start flex-grow-1 p-0" : "btn btn-link text-body text-start flex-grow-1 p-0"}><strong>{compactName}</strong><small className="d-block">{phase.moves.length} {vi ? "lượt xoay" : "turns"}</small></button><span className={invariantOK ? (selected ? "badge text-bg-light" : "badge text-bg-success") : "badge text-bg-danger"} title={studyNote}>{invariantOK ? "✓" : "!"}</span><a href={lessonUrl} target="_blank" rel="noreferrer" className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"} aria-label={vi ? "Xem thêm" : "Learn more"}><Info className="fs-5" /></a><button type="button" onClick={() => navigator.clipboard?.writeText(notation)} className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"} aria-label={vi ? "Sao chép lượt xoay" : "Copy turns"}><ClipboardCopy className="fs-5" /></button></div><code className="d-block text-break mt-2">{notation}</code>{phase.moves.length > 0 && <div className="btn-group flex-wrap mt-2" role="group">{phase.moves.map((move, moveIndex) => { const movePosition = phase.start + moveIndex + 1; return <button key={`${phase.name}-${movePosition}-${move}`} type="button" onClick={() => onSelectMove(movePosition)} className={cursor === movePosition ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{move}</button>; })}</div>}</article>;
}
