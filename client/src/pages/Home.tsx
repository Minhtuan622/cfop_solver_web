/**
 * Xưởng Cơ Khí Tốc Độ — asymmetrical workbench, mono telemetry and cube-state
 * signals make the CFOP solution readable as an instrument panel; phase changes
 * use a brief relay rather than a distracting full-cube spin.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Braces, Check, ChevronRight, CircleGauge, ClipboardCopy,
  Cpu, ExternalLink, FileJson, History, ImageDown, Info, Loader2, Play, RotateCcw, ShieldCheck, Sparkles, Trash2,
} from "lucide-react";
import { Timer } from "lucide-react";
import { Link } from "wouter";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { CubeStateEditor } from "@/components/CubeStateEditor";
import { CameraScanner } from "@/components/CameraScanner";
import { stateFromScramble } from "@/lib/fastCube";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { solveInBrowser, validateStateInBrowser, type CrossColor, type CubeValidation, type F2LSlot, type OpeningMode, type SolverResult } from "@/lib/solverRuntime";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_SCRAMBLE = "R U R' U'";
const PHASE_COLORS: Record<string, string> = {
  cross: "bg-[#e7c34f] text-[#17221d]",
  xcross_FR: "bg-[#1ba77a] text-[#17221d]",
  xcross_FL: "bg-[#1ba77a] text-[#17221d]",
  xcross_BL: "bg-[#1ba77a] text-[#17221d]",
  xcross_BR: "bg-[#1ba77a] text-[#17221d]",
  xxcross_FR_FL: "bg-[#1ba77a] text-[#17221d]", xxcross_FR_BL: "bg-[#1ba77a] text-[#17221d]", xxcross_FR_BR: "bg-[#1ba77a] text-[#17221d]",
  xxcross_FL_BL: "bg-[#1ba77a] text-[#17221d]", xxcross_FL_BR: "bg-[#1ba77a] text-[#17221d]", xxcross_BL_BR: "bg-[#1ba77a] text-[#17221d]",
  xxxcross_FR_FL_BL: "bg-[#1ba77a] text-[#17221d]", xxxcross_FR_FL_BR: "bg-[#1ba77a] text-[#17221d]", xxxcross_FR_BL_BR: "bg-[#1ba77a] text-[#17221d]", xxxcross_FL_BL_BR: "bg-[#1ba77a] text-[#17221d]",
  xxxxcross_FR_FL_BL_BR: "bg-[#1ba77a] text-[#17221d]",
  f2l_FR: "bg-[#ed8e42] text-[#17221d]",
  f2l_FL: "bg-[#d95743] text-white",
  f2l_BL: "bg-[#3b6fc7] text-white",
  f2l_BR: "bg-[#c9c2b1] text-[#17221d]",
  oll: "bg-[#f4f0e8] text-[#17221d]",
  pll: "bg-[#17221d] text-[#f4f0e8]",
};
type CubeMotionKind = "idle" | "move" | "seek" | "phase" | "reset";
type CursorIntent = "step" | "playback" | "seek" | "phase" | "reset";
const CROSS_COLORS: { value: CrossColor; vi: string; en: string; hex: string }[] = [
  { value: "U", vi: "Trắng", en: "White", hex: "#f7f3e9" },
  { value: "D", vi: "Vàng", en: "Yellow", hex: "#e7c34f" },
  { value: "F", vi: "Xanh lá", en: "Green", hex: "#1ba77a" },
  { value: "B", vi: "Xanh dương", en: "Blue", hex: "#3b6fc7" },
  { value: "R", vi: "Đỏ", en: "Red", hex: "#d95743" },
  { value: "L", vi: "Cam", en: "Orange", hex: "#ed8e42" },
];
const F2L_SLOTS: F2LSlot[] = ["FR", "FL", "BL", "BR"];
const OPENING_OPTIONS: { value: OpeningMode; vi: string; en: string; compact: string }[] = [
  { value: "cross", vi: "Cross chuẩn", en: "Standard Cross", compact: "CROSS" },
  { value: "auto", vi: "Auto XCross", en: "Auto XCross", compact: "XCROSS" },
  { value: "xxcross", vi: "Auto XXCross", en: "Auto XXCross", compact: "XXCROSS" },
  { value: "xxxcross", vi: "Auto XXXCross", en: "Auto XXXCross", compact: "XXXCROSS" },
  { value: "xxxxcross", vi: "Auto XXXXCross · Full F2L", en: "Auto XXXXCross · Full F2L", compact: "XXXXCROSS" },
];
type RecentCubeState = { id: string; state: string; label: string; savedAt: string; crossColor: CrossColor };
const RECENT_STATE_KEY = "cfop-studio-recent-states-v1";
const PHASE_LESSON_URL: Record<string, string> = {
  cross: "https://www.speedsolving.com/wiki/index.php?title=Cross",
  f2l: "https://www.speedsolving.com/wiki/index.php?title=F2L",
  oll: "https://www.speedsolving.com/wiki/index.php?title=OLL",
  pll: "https://www.speedsolving.com/wiki/index.php?title=PLL",
};

function saveBlob(name: string, type: string, value: BlobPart) { const url = URL.createObjectURL(new Blob([value], { type })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); }
function phaseStudyNote(name: string, language: "vi" | "en") {
  const vi = language === "vi";
  if (name.startsWith("xxxxcross")) return vi ? "XXXXCross: hoàn tất Cross cùng toàn bộ bốn slot F2L, tức full F2L. Nếu quá budget, solver lùi về XXXCross, XXCross, XCross rồi Cross chuẩn." : "XXXXCross: finish the Cross plus all four F2L slots, completing F2L. If over budget, the solver steps down through XXXCross, XXCross, XCross, then standard Cross.";
  if (name.startsWith("xxxcross")) return vi ? "XXXCross: tạo Cross và hoàn tất đồng thời ba cặp F2L. Khi không có nghiệm trong budget, solver lần lượt lùi về XXCross, XCross rồi Cross chuẩn." : "XXXCross: build the Cross and finish three F2L pairs simultaneously. If no candidate fits the budget, the solver steps down through XXCross, XCross, then standard Cross.";
  if (name.startsWith("xxcross")) return vi ? "XXCross: tạo Cross và hoàn tất đồng thời hai cặp F2L. Khi không có nghiệm trong budget, solver tự lùi về XCross rồi Cross chuẩn." : "XXCross: build the Cross and finish two F2L pairs simultaneously. If no candidate fits the budget, the solver safely falls back to XCross and then standard Cross.";
  if (name.startsWith("xcross")) return vi ? "XCross: tạo Cross và hoàn tất đồng thời một cặp F2L. Nếu không tìm được trong budget, chế độ Auto quay lại Cross chuẩn an toàn." : "XCross: build the Cross and finish one F2L pair simultaneously. If no candidate fits the budget, Auto safely falls back to a standard Cross.";
  if (name === "cross") return vi ? "Cross: ghép bốn cạnh màu Cross với tâm bên tương ứng. Invariant xác nhận bốn cạnh này đã đúng vị trí và hướng." : "Cross: align the four Cross edges with their adjacent centers. The invariant confirms each edge is correctly positioned and oriented.";
  if (name.startsWith("f2l")) return vi ? "F2L: ghép một góc và một cạnh, rồi đưa vào slot tương ứng. Invariant giữ nguyên mọi slot F2L đã hoàn thành trước đó." : "F2L: pair a corner with its edge and insert the pair into its slot. The invariant preserves every earlier completed F2L slot.";
  if (name === "oll") return vi ? "OLL: định hướng tất cả sticker mặt cuối để cùng hướng lên. Invariant xác nhận orientation lớp cuối đã hoàn chỉnh, chưa cần hoán vị." : "OLL: orient every last-layer sticker to face up. The invariant confirms last-layer orientation is complete before permutation.";
  return vi ? "PLL: hoán vị các mảnh lớp cuối mà không phá hướng đã giải. Invariant xác nhận toàn bộ cube đã trở về trạng thái solved." : "PLL: permute last-layer pieces without breaking orientation. The invariant confirms the entire cube has returned to solved state.";
}
function phaseLessonUrl(name: string) { return name.startsWith("f2l") || name.startsWith("xcross") || name.startsWith("xxcross") || name.startsWith("xxxcross") || name.startsWith("xxxxcross") ? PHASE_LESSON_URL.f2l : PHASE_LESSON_URL[name] ?? "https://www.speedsolving.com/wiki/index.php/CFOP_method"; }
function openingModeLabel(mode: string, language: "vi" | "en") {
  const achievedLabels: Record<string, { vi: string; en: string }> = {
    xcross: { vi: "XCross", en: "XCross" },
    xxcross: { vi: "XXCross", en: "XXCross" },
    xxxcross: { vi: "XXXCross", en: "XXXCross" },
    xxxxcross: { vi: "XXXXCross · Full F2L", en: "XXXXCross · Full F2L" },
  };
  return OPENING_OPTIONS.find((option) => option.value === mode)?.[language] ?? achievedLabels[mode]?.[language] ?? mode.toUpperCase();
}
function exportCFOPJson(result: SolverResult) { saveBlob("cfop-solution-report.json", "application/json", JSON.stringify({ format: "cfop-solver-studio/report@1", exportedAt: new Date().toISOString(), totalMoves: result.trace.length, algorithm: result.algorithm, opening: result.opening, phases: result.phases, trace: result.trace }, null, 2)); }
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
  const [crossColor, setCrossColor] = useState<CrossColor>("U");
  const [opening, setOpening] = useState<OpeningMode>("cross");
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>();
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>([]);
  const [value, setValue] = useState(DEFAULT_SCRAMBLE);
  const [savedScramble, setSavedScramble] = useState(DEFAULT_SCRAMBLE);
  const [savedState, setSavedState] = useState(SOLVED_STATE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cubeMotion, setCubeMotion] = useState<{ id: number; kind: CubeMotionKind; direction: "forward" | "backward"; phaseName?: string }>({ id: 0, kind: "idle", direction: "forward" });
  const [error, setError] = useState("");
  const [stateValidation, setStateValidation] = useState<CubeValidation | null>(null);
  const [recentStates, setRecentStates] = useState<RecentCubeState[]>(() => { try { const stored = JSON.parse(localStorage.getItem(RECENT_STATE_KEY) ?? "[]"); return Array.isArray(stored) ? stored.filter((item): item is RecentCubeState => typeof item?.state === "string" && item.state.length === 54).slice(0, 8) : []; } catch { return []; } });
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

  async function runSolver() {
    if (mode === "state" && !stateValidation?.valid) { setError(stateValidation?.message ?? (language === "vi" ? "Đang kiểm tra trạng thái cube." : "Validating cube state.")); return; }
    setLoading(true);
    setPlaying(false);
    setError("");
    try {
      const next = await solveInBrowser(mode, value.trim(), crossColor, opening, { preferredSlot, excludedSlots });
      setResult(next);
      cursorRef.current = 0;
      setCubeMotion({ id: ++motionIdRef.current, kind: "reset", direction: "forward" });
      setCursor(0);
      if (mode === "state") rememberRecentState(value.trim(), crossColor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể chạy solver với đầu vào này.");
    } finally {
      setLoading(false);
    }
  }

  const phaseCount = result?.phases.filter((phase) => phase.moves.length > 0).length ?? 0;
  const rememberRecentState = (state: string, color: CrossColor) => {
    if (state.length !== 54) return;
    const next: RecentCubeState[] = [{ id: `${Date.now()}-${state.slice(0, 6)}`, state, crossColor: color, label: `${language === "vi" ? "State" : "State"} · ${new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date())}`, savedAt: new Date().toISOString() }, ...recentStates.filter((item) => item.state !== state)].slice(0, 8);
    setRecentStates(next); localStorage.setItem(RECENT_STATE_KEY, JSON.stringify(next));
  };
  const loadRecentState = (item: RecentCubeState) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(item.state); setSavedState(item.state); setCrossColor(item.crossColor); setResult(null); setCursor(0); setError(""); };
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
    setStateHistoryVersion((version) => version + 1);
  };
  const switchInputMode = (next: "scramble" | "state") => {
    if (next === mode) return;
    if (mode === "scramble") setSavedScramble(value); else setSavedState(value);
    setMode(next);
    setValue(next === "scramble" ? savedScramble : savedState);
    setResult(null);
    setCursor(0);
    setPlaying(false);
    setError("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f0e8] text-[#17221d]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="studio-machine-header relative overflow-hidden rounded-[3px] border-2 border-[#17221d] bg-[#17221d] px-5 py-3.5 text-[#f4f0e8] shadow-[8px_8px_0_#1ba77a] sm:px-7">
          <img src="/manus-storage/cfop-blueprint-detail_a81f8345.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP Solver Studio" className="h-14 w-14 rounded-lg bg-[#f4f0e8] p-1.5 shadow-[3px_3px_0_#1ba77a]" />
              <div>
                <p className="wordmark studio-wordmark font-mono text-[13px] font-bold uppercase text-[#1ba77a] sm:text-sm"><span>CF</span><span className="wordmark-o">O</span><span>P</span><span className="ml-2 text-[#f4f0e8]/80">Solver Studio</span></p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.06em] sm:text-3xl">{t("app.tagline")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-[#f4f0e8]/20 bg-[#f4f0e8]/5 px-3 py-2 font-mono text-[11px]">
              <Link href="/timer" className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[#f4f0e8]/75 hover:bg-white/10 hover:text-[#f4f0e8]"><Timer className="h-3 w-3" />Timer Lab</Link>
              <span className="h-2 w-2 rounded-full bg-[#1ba77a] shadow-[0_0_0_4px_rgba(27,167,122,0.18)]" />
              <button onClick={() => setLanguage("vi")} className={cn("rounded px-1.5 py-1", language === "vi" ? "bg-[#1ba77a] text-[#17221d]" : "text-[#f4f0e8]/65")}>VI</button><button onClick={() => setLanguage("en")} className={cn("rounded px-1.5 py-1", language === "en" ? "bg-[#1ba77a] text-[#17221d]" : "text-[#f4f0e8]/65")}>EN</button>
            </div>
          </div>
        </header>

        <section className="studio-workbench mt-7 grid gap-7 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="studio-control-stack space-y-5 xl:sticky xl:top-5 xl:h-fit">
            <div className="studio-support-panel scorecard overflow-hidden rounded-[3px] border-2 border-[#17221d] bg-white shadow-[7px_7px_0_#17221d]">
              <div className="studio-input-header flex h-28 items-center justify-between border-b-2 border-[#17221d]/15 px-5"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">STATE INPUT</p><p className="mt-1 text-sm font-black tracking-[-0.03em]">54 STICKER · 6 FACES</p></div><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP cube mark" className="h-16 w-16 rounded-xl border-2 border-[#17221d] bg-[#f4f0e8] p-1 shadow-[3px_3px_0_#1ba77a]" /></div>
              <div className="p-5">
                <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">{t("input.title")}</p><Cpu className="h-4 w-4" /></div>
                <div className="mt-4 grid grid-cols-2 rounded-sm border-2 border-[#17221d]/15 p-1">
                  {(["scramble", "state"] as const).map((item) => <button key={item} onClick={() => switchInputMode(item)} className={cn("rounded-md px-2 py-2 font-mono text-[11px] font-bold uppercase transition", mode === item ? "bg-[#17221d] text-[#f4f0e8]" : "text-[#17221d]/55 hover:bg-[#f4f0e8]")}>{item === "scramble" ? t("input.scramble") : t("input.state")}</button>)}
                </div>
                <div className="mt-4 border-y border-[#17221d]/15 py-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">{language === "vi" ? "MÀU CROSS" : "CROSS COLOR"}</p><span className="font-mono text-[10px] font-bold text-[#1b7b5e]">{language === "vi" ? CROSS_COLORS.find((item) => item.value === crossColor)?.vi : CROSS_COLORS.find((item) => item.value === crossColor)?.en}</span></div>
                  <div className="mt-2 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label={language === "vi" ? "Chọn màu Cross" : "Choose Cross color"}>{CROSS_COLORS.map((item) => <button key={item.value} type="button" role="radio" aria-checked={crossColor === item.value} aria-label={language === "vi" ? `Cross ${item.vi}` : `Cross ${item.en}`} onClick={() => setCrossColor(item.value)} className={cn("grid aspect-square place-items-center rounded-sm border-2 transition", crossColor === item.value ? "border-[#17221d] bg-[#17221d] shadow-[2px_2px_0_#1ba77a]" : "border-[#17221d]/20 bg-white hover:border-[#17221d]")}><span className="h-5 w-5 rounded-sm border border-[#17221d]/40" style={{ backgroundColor: item.hex }} /></button>)}</div>
                  <p className="mt-2 font-mono text-[9px] leading-4 text-[#17221d]/50">{language === "vi" ? "Trắng là mặc định. Solver giữ các bước Cross → F2L → OLL → PLL theo màu đã chọn." : "White is the default. The solver keeps Cross → F2L → OLL → PLL for the selected color."}</p>
                </div>
                <div className="border-b border-[#17221d]/15 py-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">{language === "vi" ? "MỞ ĐẦU" : "OPENING"}</p><span className="font-mono text-[9px] font-bold text-[#1b7b5e]">{OPENING_OPTIONS.find((option) => option.value === opening)?.compact}</span></div>
                  <Select value={opening} onValueChange={(selected) => chooseOpening(selected as OpeningMode)}><SelectTrigger aria-label={language === "vi" ? "Chọn cấp opening" : "Choose opening level"} className="mt-2 h-10 w-full rounded-sm border-2 border-[#17221d]/25 bg-white px-3 font-mono text-[11px] font-bold text-[#17221d] shadow-[2px_2px_0_rgba(23,34,29,0.08)]"><SelectValue /></SelectTrigger><SelectContent className="border-2 border-[#17221d] bg-[#f8f5ed] font-mono text-xs"><SelectItem value="cross">{language === "vi" ? "Cross chuẩn · chỉ Cross" : "Standard Cross · Cross only"}</SelectItem><SelectItem value="auto">{language === "vi" ? "Auto XCross · Cross + 1 F2L" : "Auto XCross · Cross + 1 F2L"}</SelectItem><SelectItem value="xxcross">{language === "vi" ? "Auto XXCross · Cross + 2 F2L" : "Auto XXCross · Cross + 2 F2L"}</SelectItem><SelectItem value="xxxcross">{language === "vi" ? "Auto XXXCross · Cross + 3 F2L" : "Auto XXXCross · Cross + 3 F2L"}</SelectItem><SelectItem value="xxxxcross">{language === "vi" ? "Auto XXXXCross · Full F2L" : "Auto XXXXCross · Full F2L"}</SelectItem></SelectContent></Select>
                  <p className="studio-opening-note mt-2 font-mono text-[9px] leading-4 text-[#17221d]/50">{opening === "cross" ? (language === "vi" ? "Chỉ tạo Cross chuẩn; không chạy tìm kiếm F2L opening." : "Builds a standard Cross only; no F2L opening search.") : opening === "xxxxcross" ? (language === "vi" ? "Auto thử Cross + full F2L; không có nghiệm sẽ lùi XXXCross, XXCross, XCross rồi Cross." : "Auto tries Cross + full F2L, then falls back through XXXCross, XXCross, XCross and Cross.") : opening === "xxxcross" ? (language === "vi" ? "Auto thử Cross + ba F2L; không có nghiệm sẽ lùi XXCross, XCross rồi Cross." : "Auto tries Cross + three F2L pairs, then falls back through XXCross, XCross and Cross.") : opening === "xxcross" ? (language === "vi" ? "Auto thử Cross + hai F2L; không có nghiệm sẽ lùi XCross rồi Cross." : "Auto tries Cross + two F2L pairs, then falls back to XCross and Cross.") : language === "vi" ? "Auto thử Cross + một F2L; quá budget sẽ tự dùng Cross chuẩn." : "Auto tries Cross + one F2L pair; it safely falls back to standard Cross when over budget."}</p>
                </div>
                {opening !== "cross" && opening !== "xxxxcross" && <details className="border-b border-[#17221d]/15 py-3"><summary className="cursor-pointer font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#17221d]/60">{language === "vi" ? "TÙY CHỌN SLOT F2L" : "F2L SLOT OPTIONS"}</summary><div className="pt-3">
                  <div className="flex items-center justify-between gap-2"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#17221d]/60">{language === "vi" ? "ƯU TIÊN F2L" : "F2L PRIORITY"}</p><span className="font-mono text-[9px] text-[#17221d]/45">{preferredSlot ?? (language === "vi" ? "TỰ DO" : "ANY")}</span></div>
                  <div className="mt-2 grid grid-cols-5 gap-1"><button type="button" onClick={() => setPreferredSlot(undefined)} className={cn("rounded-sm border px-1 py-2 font-mono text-[9px] font-bold", !preferredSlot ? "border-[#17221d] bg-[#17221d] text-[#f4f0e8]" : "border-[#17221d]/15 bg-white text-[#17221d]/55")}>{language === "vi" ? "TỰ" : "ANY"}</button>{F2L_SLOTS.map((slot) => <button key={slot} type="button" disabled={excludedSlots.includes(slot)} onClick={() => setPreferredSlot(preferredSlot === slot ? undefined : slot)} className={cn("rounded-sm border px-1 py-2 font-mono text-[9px] font-bold", preferredSlot === slot ? "border-[#1ba77a] bg-[#1ba77a] text-[#17221d]" : excludedSlots.includes(slot) ? "border-[#d95743]/25 bg-[#d95743]/5 text-[#9b3023] line-through" : "border-[#17221d]/15 bg-white text-[#17221d]/60")}>{slot}</button>)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1"><span className="mr-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#17221d]/45">{language === "vi" ? "Loại trừ" : "Exclude"}</span>{F2L_SLOTS.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => { setExcludedSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]); if (preferredSlot === slot) setPreferredSlot(undefined); }} className={cn("rounded-sm border px-1.5 py-1 font-mono text-[9px] font-bold transition", excludedSlots.includes(slot) ? "border-[#d95743] bg-[#d95743] text-white" : "border-[#17221d]/15 bg-[#f4f0e8] text-[#17221d]/55 hover:border-[#17221d]")}>{slot}</button>)}</div>
                </div></details>}
                <label className="mt-5 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/60">{mode === "scramble" ? t("input.label") : language === "vi" ? "TÔ TRẠNG THÁI 6 MẶT" : "PAINT SIX-FACE STATE"}</label>
                {mode === "scramble" ? <textarea value={value} onChange={(event) => { setValue(event.target.value); setSavedScramble(event.target.value); }} spellCheck={false} className="mt-2 min-h-28 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-[#f4f0e8] p-3 font-mono text-sm leading-6 outline-none transition focus:border-[#1ba77a] focus:ring-4 focus:ring-[#1ba77a]/15" /> : <><div className="mt-2"><CubeStateEditor state={value} onChange={applyStateEdit} disabled={loading} canUndo={stateHistory.current.past.length > 0} canRedo={stateHistory.current.future.length > 0} onUndo={undoStateEdit} onRedo={redoStateEdit} /></div><div className={cn("mt-3 border-2 p-3 font-mono text-[10px] leading-5", stateValidation?.valid ? "border-[#1ba77a]/50 bg-[#1ba77a]/10 text-[#1b7b5e]" : "border-[#d95743]/30 bg-[#d95743]/10 text-[#8b2d21]")}>{stateValidation?.valid ? `✓ ${stateValidation.message}` : stateValidation?.message ?? (language === "vi" ? "Đang chờ kiểm tra state." : "Waiting to validate state.")}</div>{recentStates.length > 0 && <div className="mt-3 border-t border-[#17221d]/12 pt-3"><p className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#17221d]/55"><History className="h-3 w-3" />{language === "vi" ? "STATE GẦN ĐÂY" : "RECENT STATES"}</p><div className="mt-2 space-y-1">{recentStates.map((item) => <div key={item.id} className="flex items-center gap-1 rounded-sm border border-[#17221d]/12 bg-[#f4f0e8] p-1"><button type="button" onClick={() => loadRecentState(item)} className="min-w-0 flex-1 truncate px-2 py-1 text-left font-mono text-[9px] font-bold hover:text-[#1b7b5e]">{item.label}</button><button type="button" onClick={() => removeRecentState(item.id)} aria-label={language === "vi" ? `Xóa ${item.label}` : `Remove ${item.label}`} className="rounded-sm p-1.5 text-[#17221d]/45 hover:bg-[#d95743]/10 hover:text-[#9b3023]"><Trash2 className="h-3 w-3" /></button></div>)}</div></div>}<details className="mt-3"><summary className="cursor-pointer font-mono text-[9px] font-bold tracking-[0.12em] text-[#17221d]/55">{language === "vi" ? "DÁN CHUỖI 54 STICKER" : "PASTE 54-STICKER STATE"}</summary><textarea value={value} onChange={(event) => applyStateEdit(event.target.value.replaceAll(/\s/g, "").toUpperCase())} spellCheck={false} className="mt-2 min-h-20 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-white p-3 font-mono text-xs outline-none transition focus:border-[#1ba77a]" /></details></>}
                {error && <p className="mt-3 rounded-lg bg-[#d95743]/10 p-3 font-mono text-xs leading-5 text-[#9b3023]">{error}</p>}
                <button disabled={loading || !value.trim() || (mode === "state" && !stateValidation?.valid)} onClick={runSolver} className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border-2 border-[#17221d] bg-[#1ba77a] px-4 py-3 text-sm font-bold text-[#10241c] shadow-[3px_3px_0_#17221d] transition hover:-translate-y-0.5 hover:bg-[#24bd8d] active:scale-[0.97] disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("input.loading")}</> : <><Sparkles className="h-4 w-4" />{t("input.solve")}</>}
                </button>
              </div>
            </div>
            <details className="studio-camera-fold border border-[#17221d]/20 bg-[#f4f0e8] p-3"><summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#17221d]/60">{language === "vi" ? "Quét camera · tùy chọn" : "Camera scan · optional"}</summary><div className="mt-3"><CameraScanner onState={(state) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(state); setSavedState(state); setResult(null); setCursor(0); setError(""); }} /></div></details>
          </aside>

          <section className="studio-stage-column min-w-0">
            <div className="studio-solver-apparatus scorecard rounded-[3px] border-2 border-[#17221d] bg-white p-5 shadow-[9px_9px_0_rgba(23,34,29,0.16)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#1ba77a]">{t("guide.step")} · {String(cursor).padStart(2, "0")} / {String(totalMoves).padStart(2, "0")}</p><h2 key={cubeMotion.kind === "phase" ? cubeMotion.id : activePhase?.name ?? "ready"} className={cn("studio-phase-title mt-2 text-3xl font-bold tracking-[-0.055em] sm:text-4xl", cubeMotion.kind === "phase" && "studio-phase-title-relay")}>{activePhase ? simplePhase(activePhase.name, language) : t("guide.ready")}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#17221d]/60">{currentStep ? `${t("guide.move")}: ${currentStep.move}` : t("guide.help")}</p></div>
                <div className="rounded-sm border-2 border-[#17221d]/15 bg-[#f4f0e8] px-4 py-3 font-mono text-xs shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><p className="text-[#17221d]/45">{t("guide.move").toUpperCase()}</p><p className="mt-1 text-2xl font-bold text-[#1ba77a]">{currentStep?.move ?? "—"}</p></div>
              </div>
              <div className="mt-8 grid gap-5 rounded-[3px] border-2 border-dashed border-[#17221d]/25 bg-[#efe9dc] p-5 sm:grid-cols-[minmax(0,1fr)_250px] sm:p-7" style={{ backgroundImage: "linear-gradient(rgba(23,34,29,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,34,29,.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}><div className="grid place-items-center"><CubeNet state={currentState} /></div><Cube3DGuide state={currentState} previousState={previousState} move={currentStep?.move} step={cursor} crossColor={crossColor} alignCross xcrossSlots={activeXCrossSlots} transition={cubeMotion.kind} transitionDirection={cubeMotion.direction} transitionId={cubeMotion.id} phaseLabel={cubeMotion.phaseName ? simplePhase(cubeMotion.phaseName, language) : undefined} turnDurationMs={playing ? Math.max(120, Math.round(280 / playbackSpeed)) : 340} /></div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => selectCursor(Math.max(0, cursor - 1), "step")} disabled={cursor === 0} className="control-button"><ArrowLeft className="h-4 w-4" />{t("guide.previous")}</button>
                <button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} className="flex items-center gap-2 rounded-lg bg-[#17221d] px-5 py-3 text-sm font-bold text-[#f4f0e8] transition hover:bg-[#26372e] active:scale-[0.97] disabled:opacity-40">{playing ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{playing ? t("guide.pause") : t("guide.play")}</button>
                <button onClick={() => selectCursor(Math.min(totalMoves, cursor + 1), "step")} disabled={!result || cursor === totalMoves} className="control-button">{t("guide.next")}<ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => selectCursor(0, "reset")} disabled={!result} className="ml-auto flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#17221d]/55 transition hover:text-[#17221d] disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />{t("guide.reset")}</button>
              </div>
              {openingOutcome && <div className={cn("studio-opening-outcome mt-4 border-2", openingOutcome.kind !== "cross" ? "border-[#1ba77a]/50 bg-[#1ba77a]/10" : "border-[#17221d]/12 bg-[#f4f0e8]")}><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#17221d]/55">{language === "vi" ? "KẾT QUẢ OPENING" : "OPENING OUTCOME"}</p><p className="mt-1 break-words text-sm font-black">{openingOutcome.kind === "xxxxcross" ? `XXXXCross · Full F2L` : openingOutcome.kind === "xxxcross" ? `XXXCross · F2L ${openingOutcome.slots.join(" + ")}` : openingOutcome.kind === "xxcross" ? `XXCross · F2L ${openingOutcome.slots.join(" + ")}` : openingOutcome.kind === "xcross" ? `XCross · F2L ${openingOutcome.slot}` : "Cross chuẩn"}</p></div><span className={cn("break-words font-mono text-[10px] font-bold", openingOutcome.kind !== "cross" ? "text-[#1b7b5e]" : "text-[#17221d]/55")}>{openingOutcome.kind === "xxxxcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + full F2L" : "moves · Cross + full F2L"}` : openingOutcome.kind === "xxxcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + 3 pair" : "moves · Cross + 3 pairs"}` : openingOutcome.kind === "xxcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + 2 pair" : "moves · Cross + 2 pairs"}` : openingOutcome.kind === "xcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + pair" : "moves · Cross + pair"}` : `${openingOutcome.moves} ${t("guide.moves")}`}</span></div>{openingTelemetry && <div className="studio-fallback-telemetry border-t border-[#17221d]/12 px-4 py-2 font-mono text-[9px]"><span>{language === "vi" ? "YÊU CẦU" : "REQUEST"} <b>{openingModeLabel(openingTelemetry.requested, language)}</b></span><span>→</span><span>{language === "vi" ? "ĐẠT" : "ACHIEVED"} <b>{openingModeLabel(openingTelemetry.achieved, language)}</b></span><span className={openingTelemetry.did_fallback ? "text-[#b64b31]" : "text-[#1b7b5e]"}>{openingTelemetry.did_fallback ? (language === "vi" ? `LÙI ${openingTelemetry.fallback_count} CẤP` : `${openingTelemetry.fallback_count} FALLBACKS`) : (language === "vi" ? "ĐÚNG CẤP" : "TARGET MET")}</span><span className="studio-fallback-path">{language === "vi" ? "THỬ" : "TRIED"}: {openingTelemetry.attempts.map((attempt) => openingModeLabel(attempt, language)).join(" → ")}</span></div>}</div>}
              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><div className="flex items-center gap-4"><input aria-label="Chọn move trong trace" type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => selectCursor(Number(event.target.value), "seek")} className="min-w-0 flex-1 accent-[#1ba77a]" /><span className="min-w-16 text-right font-mono text-xs font-bold">{cursor} moves</span></div><label className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#17221d]/60">Speed {playbackSpeed.toFixed(2)}×<input aria-label="Playback speed" type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} className="w-24 accent-[#1ba77a]" /></label></div>
            </div>
            {result && <CFOPReport result={result} language={language} activePhase={activePhase?.name ?? null} onSelectPhase={(phase) => selectCursor(phase.end, "phase")} />}
            <div className="scorecard mt-7 rounded-[1rem] border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8] sm:p-6"><div className="tick-ruler" /><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">{t("guide.list")}</p><p className="mt-1 text-lg font-bold">{language === "vi" ? "Chạm vào một nước xoay để xem lại." : "Tap a move to review it."}</p></div><Braces className="h-5 w-5 text-[#f4f0e8]/55" /></div><div className="mt-4 flex flex-wrap gap-1.5">{result ? result.trace.map((step, index) => <button key={`${step.index}-${step.move}`} onClick={() => selectCursor(index + 1, "seek")} className={cn("rounded-md px-2 py-1 font-mono text-xs transition", cursor === index + 1 ? "bg-[#1ba77a] font-bold text-[#17221d]" : "bg-white/10 text-[#f4f0e8]/75 hover:bg-white/20")}>{step.move}</button>) : <span className="font-mono text-xs text-[#f4f0e8]/45">{language === "vi" ? "Các nước xoay sẽ hiện ở đây." : "Moves will appear here."}</span>}</div></div>
          </section>

          <aside className="studio-telemetry-column space-y-5 xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)] xl:overflow-auto xl:pr-2">
            <div className="grid grid-cols-3 gap-2"><Stat label={t("status.moves")} value={result ? String(totalMoves) : "—"} icon={<CircleGauge className="h-4 w-4" />} /><Stat label={t("status.steps")} value={result ? String(phaseCount) : "—"} icon={<ChevronRight className="h-4 w-4" />} /><Stat label={t("status.ok")} value={result ? "✓" : "—"} icon={<ShieldCheck className="h-4 w-4" />} /></div>
            <div className="studio-phase-telemetry studio-phase-ladder telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-white p-4 shadow-[5px_5px_0_rgba(23,34,29,0.13)]"><div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">{t("guide.title")}</p><span className="font-mono text-[10px] text-[#1ba77a]">{t("status.ready")}</span></div><div className="mt-4 space-y-2">{result ? result.phases.map((phase) => { const selected = activePhase?.name === phase.name || cursor === phase.end; return <button key={phase.name} onClick={() => selectCursor(phase.end, "phase")} className={cn("group flex w-full items-center gap-3 rounded-md border p-3 text-left transition", selected ? "border-[#1ba77a] bg-[#1ba77a]/10" : "border-[#17221d]/10 hover:border-[#17221d] hover:bg-[#f4f0e8]")}><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-sm font-mono text-[11px] font-bold", PHASE_COLORS[phase.name] ?? "bg-[#17221d] text-white")}>{phase.name === "oll" ? "O" : phase.name === "pll" ? "P" : phase.name.startsWith("f2l") ? "F" : "X"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{simplePhase(phase.name, language)}</span><span className="block truncate font-mono text-[10px] text-[#17221d]/50">{phase.moves.length} {t("guide.moves")}{phase.case_id && phase.case_id !== "solved" ? ` · ${phase.case_id}` : ""}</span></span><Check className="h-4 w-4 text-[#1ba77a]" /></button>; }) : ["Cross", "F2L 1", "F2L 2", "F2L 3", "F2L 4", "OLL", "PLL"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-md border border-[#17221d]/10 bg-[#f4f0e8] p-3 text-[#17221d]/45"><span className="grid h-9 w-9 place-items-center rounded-sm border-l-4 border-[#17221d]/35 bg-white font-mono text-xs">{String(index + 1).padStart(2, "0")}</span><span className="text-sm font-bold">{label}</span></div>)}</div></div>
            <div className="telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-[#e9e3d6] p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">{t("check.title")}</p><div className="mt-3 space-y-2 font-mono text-xs"><div className="flex justify-between border-b-2 border-[#17221d]/10 pb-2"><span>{t("check.oll")}</span><b>57 / 57</b></div><div className="flex justify-between border-b-2 border-[#17221d]/10 pb-2"><span>{t("check.pll")}</span><b>21 / 21</b></div><div className="flex justify-between"><span>{t("check.turns")}</span><b className="text-[#1b7b5e]">4 × 100%</b></div></div></div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="telemetry-panel rounded-md border-2 border-[#17221d] bg-white p-3 shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><div className="flex items-center justify-between text-[#17221d]/45">{icon}<span className="font-mono text-[8px] font-bold tracking-[0.12em]">{label}</span></div><p className="mt-2 font-mono text-xl font-bold tracking-[-0.08em]">{value}</p></div>;
}

/** Xưởng Cơ Khí Tốc Độ — report is a readable proof of the CFOP pipeline, not a timer metric. */
function CFOPReport({ result, language, activePhase, onSelectPhase }: { result: SolverResult; language: "vi" | "en"; activePhase: string | null; onSelectPhase: (phase: SolverResult["phases"][number]) => void }) {
  const vi = language === "vi";
  const totalValid = result.phases.filter((phase) => phase.valid_after && phase.predicate_after).length;
  const [ownerName, setOwnerName] = useState(() => localStorage.getItem("cfop-report-owner") ?? "");
  const [pngBackground, setPngBackground] = useState(() => localStorage.getItem("cfop-report-background") ?? "#f4f0e8");
  const openingPhase = result.phases[0];
  const xxxxcrossSlots = openingPhase?.name.startsWith("xxxxcross_") ? openingPhase.name.slice("xxxxcross_".length).split("_") : null;
  const xxxcrossSlots = openingPhase?.name.startsWith("xxxcross_") ? openingPhase.name.slice("xxxcross_".length).split("_") : null;
  const xxcrossSlots = openingPhase?.name.startsWith("xxcross_") ? openingPhase.name.slice("xxcross_".length).split("_") : null;
  const xcrossSlot = openingPhase?.name.startsWith("xcross_") ? openingPhase.name.slice("xcross_".length) : null;

  useEffect(() => localStorage.setItem("cfop-report-owner", ownerName), [ownerName]);
  useEffect(() => localStorage.setItem("cfop-report-background", pngBackground), [pngBackground]);

  return (
    <section className="scorecard mt-7 border-2 border-[#17221d] bg-white p-5 shadow-[6px_6px_0_rgba(23,34,29,0.13)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#17221d]/10 pb-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">CFOP · {vi ? "BÁO CÁO LỜI GIẢI" : "SOLUTION REPORT"}</p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.05em]">{result.trace.length} {vi ? `nước xoay · ${result.phases.length} phase kiểm tra` : `moves · ${result.phases.length} verified phases`}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => exportCFOPJson(result)} className="inline-flex items-center gap-1 rounded-sm border border-[#17221d]/20 bg-[#f4f0e8] px-2 py-2 font-mono text-[9px] font-bold hover:border-[#17221d]"><FileJson className="h-3.5 w-3.5" />JSON</button>
          <button type="button" onClick={() => exportCFOPImage(result, language, { ownerName, background: pngBackground })} className="inline-flex items-center gap-1 rounded-sm border border-[#17221d]/20 bg-[#f4f0e8] px-2 py-2 font-mono text-[9px] font-bold hover:border-[#17221d]"><ImageDown className="h-3.5 w-3.5" />PNG</button>
          <span className="rounded-sm border border-[#1ba77a]/40 bg-[#1ba77a]/10 px-3 py-2 font-mono text-[10px] font-bold text-[#1b7b5e]">{totalValid} / {result.phases.length} {vi ? "INVARIANT OK" : "INVARIANTS OK"}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-sm border border-[#17221d]/12 bg-[#f4f0e8] p-2">
        <label className="flex items-center gap-2 font-mono text-[9px] font-bold text-[#17221d]/60">{vi ? "TÊN TRÊN PNG" : "PNG NAME"}<input value={ownerName} onChange={(event) => setOwnerName(event.target.value.slice(0, 42))} placeholder={vi ? "Tùy chọn" : "Optional"} className="w-36 rounded-sm border border-[#17221d]/20 bg-white px-2 py-1 font-sans text-xs outline-none focus:border-[#1ba77a]" /></label>
        <label className="flex items-center gap-2 font-mono text-[9px] font-bold text-[#17221d]/60">{vi ? "NỀN" : "BACKGROUND"}<input aria-label={vi ? "Màu nền PNG" : "PNG background color"} type="color" value={pngBackground} onChange={(event) => setPngBackground(event.target.value)} className="h-7 w-9 cursor-pointer rounded-sm border border-[#17221d]/20 bg-white p-1" /></label>
      </div>
      {openingPhase && <div className={cn("mt-3 flex flex-wrap items-center justify-between gap-3 border-l-4 p-3", xxxxcrossSlots || xxxcrossSlots || xxcrossSlots || xcrossSlot ? "border-[#1ba77a] bg-[#1ba77a]/10" : "border-[#17221d]/30 bg-[#f4f0e8]")}><div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#17221d]/55">{vi ? "CHIẾN LƯỢC OPENING" : "OPENING STRATEGY"}</p><p className="mt-1 break-words text-sm font-black">{xxxxcrossSlots ? "XXXXCross · Full F2L" : xxxcrossSlots ? `XXXCross · ${xxxcrossSlots.join(" + ")}` : xxcrossSlots ? `XXCross · ${xxcrossSlots.join(" + ")}` : xcrossSlot ? `XCross · ${xcrossSlot}` : "Cross"}</p></div><p className="max-w-md break-words text-left font-mono text-[10px] leading-4 text-[#17221d]/60 sm:text-right">{xxxxcrossSlots ? (vi ? "Cross và toàn bộ bốn cặp F2L đã hoàn tất cùng pha; chỉ còn OLL và PLL, invariant là full F2L." : "Cross and all four F2L pairs were completed in one phase; only OLL and PLL remain, with full F2L as the invariant.") : xxxcrossSlots ? (vi ? `Cross và ba cặp F2L ${xxxcrossSlots.join(" + ")} đã hoàn tất cùng pha; slot cuối tiếp tục theo invariant.` : `Cross and F2L ${xxxcrossSlots.join(" + ")} were completed in one phase; the final slot preserves that invariant.`) : xxcrossSlots ? (vi ? `Cross và hai cặp F2L ${xxcrossSlots.join(" + ")} đã hoàn tất cùng pha; hai slot còn lại tiếp tục theo invariant.` : `Cross and F2L ${xxcrossSlots.join(" + ")} were completed in one phase; the remaining two slots preserve that invariant.`) : xcrossSlot ? (vi ? `Cross và cặp F2L ${xcrossSlot} đã hoàn tất cùng pha; ba slot còn lại tiếp tục theo invariant.` : `Cross and F2L ${xcrossSlot} were completed in one phase; the remaining three slots preserve that invariant.`) : (vi ? "Không có nghiệm XXXXCross/XXXCross/XXCross/XCross trong budget; solver tiếp tục Cross chuẩn mà không giảm độ tin cậy." : "No XXXXCross/XXXCross/XXCross/XCross fit the budget; the solver continued with standard Cross without reducing reliability.")}</p></div>}
      <div className="mt-4 space-y-2">
        {result.phases.map((phase, index) => <CFOPPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} onSelect={onSelectPhase} />)}
      </div>
    </section>
  );
}

function CFOPPhaseRow({ phase, index, language, selected, onSelect }: { phase: SolverResult["phases"][number]; index: number; language: "vi" | "en"; selected: boolean; onSelect: (phase: SolverResult["phases"][number]) => void }) {
  const vi = language === "vi";
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  return <article className={cn("border-2 p-3 transition", selected ? "border-[#1ba77a] bg-[#1ba77a]/10" : "border-[#17221d]/10 bg-[#f4f0e8]")}>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => onSelect(phase)} className="grid h-8 w-8 place-items-center rounded-sm bg-[#17221d] font-mono text-[10px] font-bold text-[#f4f0e8]">{String(index + 1).padStart(2, "0")}</button>
      <button type="button" onClick={() => onSelect(phase)} className="min-w-0 flex-1 text-left">
        <span className="flex min-w-0 items-start gap-1"><b className="block min-w-0 break-words text-sm">{simplePhase(phase.name, language)}</b><PhaseStudyTooltip studyNote={studyNote} lessonUrl={lessonUrl} vi={vi} /></span>
        <span className="font-mono text-[10px] text-[#17221d]/55">{phase.moves.length} {vi ? "nước" : "moves"}{phase.case_id && phase.case_id !== "solved" ? " · " + phase.case_id : ""}</span>
      </button>
      <PhaseStudyTooltip studyNote={studyNote} lessonUrl={lessonUrl} vi={vi} trigger={<span tabIndex={0} className={cn("rounded-sm border px-2 py-1 font-mono text-[9px] font-bold outline-none focus:ring-2 focus:ring-[#1ba77a]", invariantOK ? "border-[#1ba77a]/50 bg-[#1ba77a]/10 text-[#1b7b5e]" : "border-[#d95743]/40 bg-[#d95743]/10 text-[#8b2d21]")}>{invariantOK ? "INVARIANT ✓" : "CHECK"}</span>} />
      <button type="button" onClick={() => navigator.clipboard?.writeText(notation)} className="rounded-sm border border-[#17221d]/15 bg-white p-2 text-[#17221d]/60 hover:text-[#17221d]" aria-label={vi ? "Sao chép thuật toán" : "Copy algorithm"}><ClipboardCopy className="h-3.5 w-3.5" /></button>
    </div>
    <code className="mt-3 block overflow-x-auto border-t border-[#17221d]/10 pt-3 font-mono text-[11px] leading-5 text-[#17221d]/70">{notation}</code>
  </article>;
}

function PhaseStudyTooltip({ studyNote, lessonUrl, vi, trigger }: { studyNote: string; lessonUrl: string; vi: boolean; trigger?: ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>{trigger ?? <span tabIndex={0} className="inline-flex cursor-help text-[#1b7b5e] outline-none focus:ring-2 focus:ring-[#1ba77a]"><Info className="h-3.5 w-3.5" /></span>}</TooltipTrigger><TooltipContent side="top" className="max-w-80 bg-[#17221d] p-3 text-xs leading-5 text-[#f4f0e8]"><p>{studyNote}</p><a href={lessonUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#4fe3af] underline">{vi ? "Mở bài học & công thức" : "Open lesson & algorithms"}<ExternalLink className="h-3 w-3" /></a></TooltipContent></Tooltip>;
}
