/**
 * Xưởng Cơ Khí Tốc Độ — asymmetrical workbench, mono telemetry and cube-state
 * signals make the CFOP solution readable as an instrument panel; phase changes
 * use a brief relay rather than a distracting full-cube spin.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, CircleGauge, ClipboardCopy,
  Cpu, ExternalLink, FileJson, History, ImageDown, Info, Layers3, Loader2, Play, RotateCcw, Search, ShieldCheck, Sparkles, Trash2,
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
import { readSolverSettings, writeSolverSettings } from "@/lib/appSettings";
import { listLastLayerCasesInBrowser, solveInBrowser, validateStateInBrowser, type CrossColor, type CubeValidation, type F2LSlot, type LastLayerCatalogCase, type LastLayerMode, type OpeningMode, type SolverResult } from "@/lib/solverRuntime";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SCRAMBLE_FACES = ["U", "R", "F", "D", "L", "B"] as const;
const SCRAMBLE_SUFFIXES = ["", "2", "'"] as const;
function randomDefaultScramble(length = 20) { const moves: string[] = []; while (moves.length < length) { const face = SCRAMBLE_FACES[Math.floor(Math.random() * SCRAMBLE_FACES.length)]; const previous = moves.at(-1)?.[0]; const before = moves.at(-2)?.[0]; const sameAxis = (left?: string, right?: string) => !!left && !!right && ((left === "U" || left === "D") === (right === "U" || right === "D")) && ((left === "R" || left === "L") === (right === "R" || right === "L")); if (face === previous || (previous && before && sameAxis(face, previous) && sameAxis(face, before))) continue; moves.push(face + SCRAMBLE_SUFFIXES[Math.floor(Math.random() * SCRAMBLE_SUFFIXES.length)]); } return moves.join(" "); }
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
  zbll: "bg-[#1ba77a] text-[#17221d]",
  "1lll": "bg-[#17221d] text-[#f4f0e8]",
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
const LAST_LAYER_OPTIONS: { value: LastLayerMode; vi: string; en: string; compact: string }[] = [
  { value: "auto", vi: "Auto · ZBLL → 1LLL → OLL/PLL", en: "Auto · ZBLL → 1LLL → OLL/PLL", compact: "AUTO" },
  { value: "oll_pll", vi: "OLL + PLL · 2 phase", en: "OLL + PLL · 2 phases", compact: "OLL/PLL" },
  { value: "zbll", vi: "ZBLL · cần EO", en: "ZBLL · EO required", compact: "ZBLL" },
  { value: "1lll", vi: "1LLL · direct catalog", en: "1LLL · direct catalog", compact: "1LLL" },
];
type RecentCubeState = { id: string; state: string; label: string; savedAt: string; crossColor: CrossColor };
const RECENT_STATE_KEY = "cfop-studio-recent-states-v1";
const MASTERED_LAST_LAYER_KEY = "cfop-studio-mastered-last-layer-v1";
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
  if (name === "zbll") return vi ? "ZBLL: giải toàn bộ Last Layer bằng một thuật toán khi bốn cạnh lớp cuối đã được định hướng. Invariant xác nhận cube solved trực tiếp." : "ZBLL: solve the entire Last Layer in one algorithm when all four last-layer edges are oriented. The invariant directly confirms a solved cube.";
  if (name === "1lll") return vi ? "1LLL: giải trực tiếp toàn bộ Last Layer bằng một thuật toán từ catalog đã kiểm chứng. Invariant xác nhận cube solved trực tiếp." : "1LLL: solve the entire Last Layer directly with one verified catalog algorithm. The invariant directly confirms a solved cube.";
  if (name === "oll") return vi ? "OLL: định hướng tất cả sticker mặt cuối để cùng hướng lên. Invariant xác nhận orientation lớp cuối đã hoàn chỉnh, chưa cần hoán vị." : "OLL: orient every last-layer sticker to face up. The invariant confirms last-layer orientation is complete before permutation.";
  return vi ? "PLL: hoán vị các mảnh lớp cuối mà không phá hướng đã giải. Invariant xác nhận toàn bộ cube đã trở về trạng thái solved." : "PLL: permute last-layer pieces without breaking orientation. The invariant confirms the entire cube has returned to solved state.";
}
function phaseLessonUrl(name: string) { if (name === "zbll") return "https://www.speedsolving.com/wiki/index.php/ZBLL"; if (name === "1lll") return "https://www.speedsolving.com/wiki/index.php/1LLL"; return name.startsWith("f2l") || name.startsWith("xcross") || name.startsWith("xxcross") || name.startsWith("xxxcross") || name.startsWith("xxxxcross") ? PHASE_LESSON_URL.f2l : PHASE_LESSON_URL[name] ?? "https://www.speedsolving.com/wiki/index.php/CFOP_method"; }
function openingModeLabel(mode: string, language: "vi" | "en") {
  const achievedLabels: Record<string, { vi: string; en: string }> = {
    xcross: { vi: "XCross", en: "XCross" },
    xxcross: { vi: "XXCross", en: "XXCross" },
    xxxcross: { vi: "XXXCross", en: "XXXCross" },
    xxxxcross: { vi: "XXXXCross · Full F2L", en: "XXXXCross · Full F2L" },
  };
  return OPENING_OPTIONS.find((option) => option.value === mode)?.[language] ?? achievedLabels[mode]?.[language] ?? mode.toUpperCase();
}
function lastLayerModeLabel(mode: string, language: "vi" | "en") {
  const achieved: Record<string, { vi: string; en: string }> = {
    oll_pll: { vi: "OLL + PLL", en: "OLL + PLL" },
    zbll: { vi: "ZBLL · 1 look EO", en: "ZBLL · 1-look EO" },
    "1lll": { vi: "1LLL · 1 look", en: "1LLL · 1-look" },
  };
  return LAST_LAYER_OPTIONS.find((option) => option.value === mode)?.[language] ?? achieved[mode]?.[language] ?? mode.toUpperCase();
}
function exportCFOPJson(result: SolverResult) { saveBlob("cfop-solution-report.json", "application/json", JSON.stringify({ format: "cfop-solver-studio/report@1", exportedAt: new Date().toISOString(), totalMoves: result.trace.length, algorithm: result.algorithm, opening: result.opening, last_layer: result.last_layer, phases: result.phases, trace: result.trace }, null, 2)); }
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
  const [crossColor, setCrossColor] = useState<CrossColor>(() => readSolverSettings().crossColor);
  const [opening, setOpening] = useState<OpeningMode>(() => readSolverSettings().opening);
  const [lastLayer, setLastLayer] = useState<LastLayerMode>(() => readSolverSettings().lastLayer);
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>(() => readSolverSettings().preferredSlot);
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>(() => readSolverSettings().excludedSlots);
  const [initialScramble] = useState(() => randomDefaultScramble());
  const [value, setValue] = useState(initialScramble);
  const [savedScramble, setSavedScramble] = useState(initialScramble);
  const [savedState, setSavedState] = useState(SOLVED_STATE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cubeMotion, setCubeMotion] = useState<{ id: number; kind: CubeMotionKind; direction: "forward" | "backward"; phaseName?: string }>({ id: 0, kind: "idle", direction: "forward" });
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
  const [masteredCaseKeys, setMasteredCaseKeys] = useState<string[]>(() => { try { const stored = JSON.parse(localStorage.getItem(MASTERED_LAST_LAYER_KEY) ?? "[]"); return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string").slice(-1800) : []; } catch { return []; } });
  const [recentStates, setRecentStates] = useState<RecentCubeState[]>(() => { try { const stored = JSON.parse(localStorage.getItem(RECENT_STATE_KEY) ?? "[]"); return Array.isArray(stored) ? stored.filter((item): item is RecentCubeState => typeof item?.state === "string" && item.state.length === 54).slice(0, 8) : []; } catch { return []; } });
  useEffect(() => { writeSolverSettings({ crossColor, opening, lastLayer, preferredSlot, excludedSlots }); }, [crossColor, opening, lastLayer, preferredSlot, excludedSlots]);
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
  useEffect(() => { localStorage.setItem(MASTERED_LAST_LAYER_KEY, JSON.stringify(masteredCaseKeys)); }, [masteredCaseKeys]);
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
    try {
      const next = await solveInBrowser(mode, value.trim(), crossColor, opening, { preferredSlot, excludedSlots }, lastLayer);
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
  const loadRecentState = (item: RecentCubeState) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(item.state); setSavedState(item.state); setCrossColor(item.crossColor); setSelectedCatalogCase(null); setResult(null); setCursor(0); setError(""); };
  const loadCatalogCase = (catalogCase: LastLayerCatalogCase) => {
    stateHistory.current = { past: [], future: [] };
    setStateHistoryVersion((version) => version + 1);
    setMode("state");
    setValue(catalogCase.state);
    setSavedState(catalogCase.state);
    setCrossColor("D");
    setLastLayer(catalogCase.family);
    setSelectedCatalogCase(catalogCase);
    setResult(null);
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
    if (next === "scramble") setSelectedCatalogCase(null);
    setResult(null);
    setCursor(0);
    setPlaying(false);
    setError("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f0e8] text-[#17221d]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <section className="studio-workbench grid gap-7 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="studio-control-stack space-y-5 xl:sticky xl:top-5 xl:h-fit">
            <div className="studio-support-panel scorecard overflow-hidden rounded-[3px] border-2 border-[#17221d] bg-white shadow-[7px_7px_0_#17221d]">
              <div className="studio-input-header flex h-20 items-center justify-between border-b-2 border-[#17221d]/15 px-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">CUBE INPUT</p><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP cube mark" className="h-12 w-12 rounded-lg border-2 border-[#17221d] bg-[#f4f0e8] p-1 shadow-[3px_3px_0_#1ba77a]" /></div>
              <div className="p-5">
                <div className="mt-4 grid grid-cols-2 rounded-sm border-2 border-[#17221d]/15 p-1">
                  {(["scramble", "state"] as const).map((item) => <button key={item} onClick={() => switchInputMode(item)} className={cn("rounded-md px-2 py-2 font-mono text-[11px] font-bold uppercase transition", mode === item ? "bg-[#17221d] text-[#f4f0e8]" : "text-[#17221d]/55 hover:bg-[#f4f0e8]")}>{item === "scramble" ? t("input.scramble") : t("input.state")}</button>)}
                </div>
                <details className="mt-4 border-y border-[#17221d]/15 py-3">
                  <summary className="cursor-pointer font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#17221d]/60">{language === "vi" ? "CÀI ĐẶT SOLVER" : "SOLVER SETTINGS"}</summary><div className="pt-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">{language === "vi" ? "MÀU CROSS" : "CROSS COLOR"}</p><span className="font-mono text-[10px] font-bold text-[#1b7b5e]">{language === "vi" ? CROSS_COLORS.find((item) => item.value === crossColor)?.vi : CROSS_COLORS.find((item) => item.value === crossColor)?.en}</span></div>
                  <div className="mt-2 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label={language === "vi" ? "Chọn màu Cross" : "Choose Cross color"}>{CROSS_COLORS.map((item) => <button key={item.value} type="button" role="radio" aria-checked={crossColor === item.value} aria-label={language === "vi" ? `Cross ${item.vi}` : `Cross ${item.en}`} onClick={() => setCrossColor(item.value)} className={cn("grid aspect-square place-items-center rounded-sm border-2 transition", crossColor === item.value ? "border-[#17221d] bg-[#17221d] shadow-[2px_2px_0_#1ba77a]" : "border-[#17221d]/20 bg-white hover:border-[#17221d]")}><span className="h-5 w-5 rounded-sm border border-[#17221d]/40" style={{ backgroundColor: item.hex }} /></button>)}</div>
                  <p className="mt-2 font-mono text-[9px] leading-4 text-[#17221d]/50">{language === "vi" ? "Trắng là mặc định. Solver giữ các bước Cross → F2L → OLL → PLL theo màu đã chọn." : "White is the default. The solver keeps Cross → F2L → OLL → PLL for the selected color."}</p>
                </div>
                <div className="border-b border-[#17221d]/15 py-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">{language === "vi" ? "MỞ ĐẦU" : "OPENING"}</p><span className="font-mono text-[9px] font-bold text-[#1b7b5e]">{OPENING_OPTIONS.find((option) => option.value === opening)?.compact}</span></div>
                  <Select value={opening} onValueChange={(selected) => chooseOpening(selected as OpeningMode)}><SelectTrigger aria-label={language === "vi" ? "Chọn cấp opening" : "Choose opening level"} className="mt-2 h-10 w-full rounded-sm border-2 border-[#17221d]/25 bg-white px-3 font-mono text-[11px] font-bold text-[#17221d] shadow-[2px_2px_0_rgba(23,34,29,0.08)]"><SelectValue /></SelectTrigger><SelectContent className="border-2 border-[#17221d] bg-[#f8f5ed] font-mono text-xs"><SelectItem value="cross">{language === "vi" ? "Cross chuẩn · chỉ Cross" : "Standard Cross · Cross only"}</SelectItem><SelectItem value="auto">{language === "vi" ? "Auto XCross · Cross + 1 F2L" : "Auto XCross · Cross + 1 F2L"}</SelectItem><SelectItem value="xxcross">{language === "vi" ? "Auto XXCross · Cross + 2 F2L" : "Auto XXCross · Cross + 2 F2L"}</SelectItem><SelectItem value="xxxcross">{language === "vi" ? "Auto XXXCross · Cross + 3 F2L" : "Auto XXXCross · Cross + 3 F2L"}</SelectItem><SelectItem value="xxxxcross">{language === "vi" ? "Auto XXXXCross · Full F2L" : "Auto XXXXCross · Full F2L"}</SelectItem></SelectContent></Select>
                  <p className="studio-opening-note mt-2 font-mono text-[9px] leading-4 text-[#17221d]/50">{opening === "cross" ? (language === "vi" ? "Chỉ tạo Cross chuẩn; không chạy tìm kiếm F2L opening." : "Builds a standard Cross only; no F2L opening search.") : opening === "xxxxcross" ? (language === "vi" ? "Auto thử Cross + full F2L; không có nghiệm sẽ lùi XXXCross, XXCross, XCross rồi Cross." : "Auto tries Cross + full F2L, then falls back through XXXCross, XXCross, XCross and Cross.") : opening === "xxxcross" ? (language === "vi" ? "Auto thử Cross + ba F2L; không có nghiệm sẽ lùi XXCross, XCross rồi Cross." : "Auto tries Cross + three F2L pairs, then falls back through XXCross, XCross and Cross.") : opening === "xxcross" ? (language === "vi" ? "Auto thử Cross + hai F2L; không có nghiệm sẽ lùi XCross rồi Cross." : "Auto tries Cross + two F2L pairs, then falls back to XCross and Cross.") : language === "vi" ? "Auto thử Cross + một F2L; quá budget sẽ tự dùng Cross chuẩn." : "Auto tries Cross + one F2L pair; it safely falls back to standard Cross when over budget."}</p>
                </div>
                <div className="border-b border-[#17221d]/15 py-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">{language === "vi" ? "LAST LAYER" : "LAST LAYER"}</p><span className="font-mono text-[9px] font-bold text-[#1b7b5e]">{LAST_LAYER_OPTIONS.find((option) => option.value === lastLayer)?.compact}</span></div>
                  <Select value={lastLayer} onValueChange={(selected) => setLastLayer(selected as LastLayerMode)}><SelectTrigger aria-label={language === "vi" ? "Chọn chiến lược Last Layer" : "Choose Last Layer strategy"} className="mt-2 h-10 w-full rounded-sm border-2 border-[#17221d]/25 bg-white px-3 font-mono text-[11px] font-bold text-[#17221d] shadow-[2px_2px_0_rgba(23,34,29,0.08)]"><SelectValue /></SelectTrigger><SelectContent className="border-2 border-[#17221d] bg-[#f8f5ed] font-mono text-xs"><SelectItem value="auto">{language === "vi" ? "Auto · ZBLL → 1LLL → OLL/PLL" : "Auto · ZBLL → 1LLL → OLL/PLL"}</SelectItem><SelectItem value="oll_pll">{language === "vi" ? "OLL + PLL · pipeline đầy đủ" : "OLL + PLL · complete pipeline"}</SelectItem><SelectItem value="zbll">{language === "vi" ? "ZBLL · cần EO lớp cuối" : "ZBLL · last-layer EO required"}</SelectItem><SelectItem value="1lll">{language === "vi" ? "1LLL · direct catalog đã xác minh" : "1LLL · verified direct catalog"}</SelectItem></SelectContent></Select>
                  <p className="studio-opening-note mt-2 font-mono text-[9px] leading-4 text-[#17221d]/50">{lastLayer === "auto" ? (language === "vi" ? "Auto ưu tiên ZBLL khi EO, sau đó 1LLL direct; case ngoài catalog quay về OLL + PLL để luôn giữ invariant." : "Auto prefers ZBLL with EO, then direct 1LLL; uncovered cases return to OLL + PLL to preserve invariants.") : lastLayer === "zbll" ? (language === "vi" ? "ZBLL chỉ chạy direct khi bốn edge lớp cuối đã oriented; nếu không khớp catalog, solver dùng OLL + PLL." : "ZBLL runs direct only with oriented last-layer edges; uncovered cases use OLL + PLL.") : lastLayer === "1lll" ? (language === "vi" ? "1LLL dùng direct catalog offline đã replay; case chưa có coverage tự lùi OLL + PLL." : "1LLL uses the verified offline direct catalog; uncovered cases fall back to OLL + PLL.") : (language === "vi" ? "Luôn chạy OLL rồi PLL, dùng đầy đủ 57 OLL và 21 PLL." : "Always runs OLL then PLL using all 57 OLL and 21 PLL cases.")}</p>
                </div>
                {opening !== "cross" && opening !== "xxxxcross" && <details className="border-b border-[#17221d]/15 py-3"><summary className="cursor-pointer font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#17221d]/60">{language === "vi" ? "CÀI ĐẶT SLOT F2L" : "F2L SLOT SETTINGS"}</summary><div className="pt-3">
                  <div className="flex items-center justify-between gap-2"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#17221d]/60">{language === "vi" ? "ƯU TIÊN F2L" : "F2L PRIORITY"}</p><span className="font-mono text-[9px] text-[#17221d]/45">{preferredSlot ?? (language === "vi" ? "TỰ DO" : "ANY")}</span></div>
                  <div className="mt-2 grid grid-cols-5 gap-1"><button type="button" onClick={() => setPreferredSlot(undefined)} className={cn("rounded-sm border px-1 py-2 font-mono text-[9px] font-bold", !preferredSlot ? "border-[#17221d] bg-[#17221d] text-[#f4f0e8]" : "border-[#17221d]/15 bg-white text-[#17221d]/55")}>{language === "vi" ? "TỰ" : "ANY"}</button>{F2L_SLOTS.map((slot) => <button key={slot} type="button" disabled={excludedSlots.includes(slot)} onClick={() => setPreferredSlot(preferredSlot === slot ? undefined : slot)} className={cn("rounded-sm border px-1 py-2 font-mono text-[9px] font-bold", preferredSlot === slot ? "border-[#1ba77a] bg-[#1ba77a] text-[#17221d]" : excludedSlots.includes(slot) ? "border-[#d95743]/25 bg-[#d95743]/5 text-[#9b3023] line-through" : "border-[#17221d]/15 bg-white text-[#17221d]/60")}>{slot}</button>)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1"><span className="mr-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#17221d]/45">{language === "vi" ? "Loại trừ" : "Exclude"}</span>{F2L_SLOTS.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => { setExcludedSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]); if (preferredSlot === slot) setPreferredSlot(undefined); }} className={cn("rounded-sm border px-1.5 py-1 font-mono text-[9px] font-bold transition", excludedSlots.includes(slot) ? "border-[#d95743] bg-[#d95743] text-white" : "border-[#17221d]/15 bg-[#f4f0e8] text-[#17221d]/55 hover:border-[#17221d]")}>{slot}</button>)}</div>
                </div></details>}</details>
                {mode === "scramble" ? <textarea aria-label={t("input.label")} value={value} onChange={(event) => { setValue(event.target.value); setSavedScramble(event.target.value); }} placeholder={language === "vi" ? "Nhập scramble · R U R' U'" : "Enter scramble · R U R' U'"} spellCheck={false} className="mt-4 min-h-28 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-[#f4f0e8] p-3 font-mono text-sm leading-6 outline-none transition focus:border-[#1ba77a] focus:ring-4 focus:ring-[#1ba77a]/15" /> : <><div className="mt-4"><CubeStateEditor state={value} onChange={applyStateEdit} disabled={loading} canUndo={stateHistory.current.past.length > 0} canRedo={stateHistory.current.future.length > 0} onUndo={undoStateEdit} onRedo={redoStateEdit} selectedColor={paintColor} onSelectedColorChange={setPaintColor} controlsOnly /></div><p className="mt-2 font-mono text-[9px] leading-4 text-[#17221d]/55">{language === "vi" ? "Tô trực tiếp trên sơ đồ 2D lớn cạnh Cube 3D." : "Paint directly on the large 2D net beside the 3D cube."}</p><div className={cn("mt-3 border-2 p-3 font-mono text-[10px] leading-5", stateValidation?.valid ? "border-[#1ba77a]/50 bg-[#1ba77a]/10 text-[#1b7b5e]" : "border-[#d95743]/30 bg-[#d95743]/10 text-[#8b2d21]")}>{stateValidation?.valid ? `✓ ${stateValidation.message}` : stateValidation?.message ?? (language === "vi" ? "Đang chờ kiểm tra state." : "Waiting to validate state.")}</div>{recentStates.length > 0 && <div className="mt-3 border-t border-[#17221d]/12 pt-3"><p className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#17221d]/55"><History className="h-3 w-3" />{language === "vi" ? "STATE GẦN ĐÂY" : "RECENT STATES"}</p><div className="mt-2 space-y-1">{recentStates.map((item) => <div key={item.id} className="flex items-center gap-1 rounded-sm border border-[#17221d]/12 bg-[#f4f0e8] p-1"><button type="button" onClick={() => loadRecentState(item)} className="min-w-0 flex-1 truncate px-2 py-1 text-left font-mono text-[9px] font-bold hover:text-[#1b7b5e]">{item.label}</button><button type="button" onClick={() => removeRecentState(item.id)} aria-label={language === "vi" ? `Xóa ${item.label}` : `Remove ${item.label}`} className="rounded-sm p-1.5 text-[#17221d]/45 hover:bg-[#d95743]/10 hover:text-[#9b3023]"><Trash2 className="h-3 w-3" /></button></div>)}</div></div>}<details className="mt-3"><summary className="cursor-pointer font-mono text-[9px] font-bold tracking-[0.12em] text-[#17221d]/55">{language === "vi" ? "DÁN CHUỖI 54 STICKER" : "PASTE 54-STICKER STATE"}</summary><textarea value={value} onChange={(event) => applyStateEdit(event.target.value.replaceAll(/\s/g, "").toUpperCase())} spellCheck={false} className="mt-2 min-h-20 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-white p-3 font-mono text-xs outline-none transition focus:border-[#1ba77a]" /></details></>}
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
              <div className="studio-apparatus-readout flex flex-wrap items-start justify-between gap-6">
                <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#1ba77a]">{t("guide.step")} · {String(cursor).padStart(2, "0")} / {String(totalMoves).padStart(2, "0")}</p><p key={cubeMotion.kind === "phase" ? cubeMotion.id : activePhase?.name ?? "ready"} className={cn("studio-phase-title mt-2 text-xl font-black tracking-[-0.045em] sm:text-2xl", cubeMotion.kind === "phase" && "studio-phase-title-relay")}>{activePhase ? simplePhase(activePhase.name, language) : t("guide.ready")}</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#17221d]/60">{currentStep ? `${t("guide.move")}: ${currentStep.move}` : t("guide.help")}</p></div>
                <div className="studio-apparatus-readout-card rounded-sm border-2 border-[#17221d]/15 bg-[#f4f0e8] px-4 py-3 font-mono text-xs shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><p className="text-[#17221d]/45">{t("guide.move").toUpperCase()}</p><p className="mt-1 text-2xl font-bold text-[#1ba77a]">{currentStep?.move ?? "—"}</p></div>
              </div>
              <div className="studio-apparatus-viewport mt-8 grid gap-5 rounded-[3px] border-2 border-dashed border-[#17221d]/25 bg-[#efe9dc] p-5 sm:grid-cols-[minmax(0,1fr)_250px] sm:p-7" style={{ backgroundImage: "linear-gradient(rgba(23,34,29,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,34,29,.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}><div className="grid min-w-0 place-items-center gap-4">{selectedCatalogCase && <LastLayerFormulaStrip catalogCase={selectedCatalogCase} mastered={masteredCaseSet.has(`${selectedCatalogCase.family}:${selectedCatalogCase.id}`)} language={language} onToggleMastered={() => toggleMasteredCase(selectedCatalogCase)} />}<CubeNet state={mode === "state" ? (value.length === 54 ? value : SOLVED_STATE) : currentState} editable={mode === "state"} selectedColor={paintColor} onStateChange={applyStateEdit} disabled={loading} /></div><div className="mx-auto w-full max-w-[330px]"><Cube3DGuide state={currentState} previousState={previousState} move={currentStep?.move} step={cursor} crossColor={crossColor} alignCross xcrossSlots={activeXCrossSlots} lastLayerCase={activeLastLayerCase} transition={cubeMotion.kind} transitionDirection={cubeMotion.direction} transitionId={cubeMotion.id} phaseLabel={cubeMotion.phaseName ? simplePhase(cubeMotion.phaseName, language) : undefined} turnDurationMs={playing ? Math.max(120, Math.round(280 / playbackSpeed)) : 340} /></div></div>
              <div className="studio-apparatus-controls mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => selectCursor(Math.max(0, cursor - 1), "step")} disabled={cursor === 0} className="control-button"><ArrowLeft className="h-4 w-4" />{t("guide.previous")}</button>
                <button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} className="flex items-center gap-2 rounded-lg bg-[#17221d] px-5 py-3 text-sm font-bold text-[#f4f0e8] transition hover:bg-[#26372e] active:scale-[0.97] disabled:opacity-40">{playing ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{playing ? t("guide.pause") : t("guide.play")}</button>
                <button onClick={() => selectCursor(Math.min(totalMoves, cursor + 1), "step")} disabled={!result || cursor === totalMoves} className="control-button">{t("guide.next")}<ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => selectCursor(0, "reset")} disabled={!result} className="ml-auto flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#17221d]/55 transition hover:text-[#17221d] disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />{t("guide.reset")}</button>
              </div>
              {openingOutcome && <div className={cn("studio-opening-outcome mt-4 border-2", openingOutcome.kind !== "cross" ? "border-[#1ba77a]/50 bg-[#1ba77a]/10" : "border-[#17221d]/12 bg-[#f4f0e8]")}><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#17221d]/55">{language === "vi" ? "KẾT QUẢ OPENING" : "OPENING OUTCOME"}</p><p className="mt-1 break-words text-sm font-black">{openingOutcome.kind === "xxxxcross" ? `XXXXCross · Full F2L` : openingOutcome.kind === "xxxcross" ? `XXXCross · F2L ${openingOutcome.slots.join(" + ")}` : openingOutcome.kind === "xxcross" ? `XXCross · F2L ${openingOutcome.slots.join(" + ")}` : openingOutcome.kind === "xcross" ? `XCross · F2L ${openingOutcome.slot}` : "Cross chuẩn"}</p></div><span className={cn("break-words font-mono text-[10px] font-bold", openingOutcome.kind !== "cross" ? "text-[#1b7b5e]" : "text-[#17221d]/55")}>{openingOutcome.kind === "xxxxcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + full F2L" : "moves · Cross + full F2L"}` : openingOutcome.kind === "xxxcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + 3 pair" : "moves · Cross + 3 pairs"}` : openingOutcome.kind === "xxcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + 2 pair" : "moves · Cross + pair"}` : openingOutcome.kind === "xcross" ? `${openingOutcome.moves} ${language === "vi" ? "nước · Cross + pair" : "moves · Cross + pair"}` : `${openingOutcome.moves} ${t("guide.moves")}`}</span></div>{openingTelemetry && <div className="studio-fallback-telemetry border-t border-[#17221d]/12 px-4 py-2 font-mono text-[9px]"><span>{language === "vi" ? "YÊU CẦU" : "REQUEST"} <b>{openingModeLabel(openingTelemetry.requested, language)}</b></span><span>→</span><span>{language === "vi" ? "ĐẠT" : "ACHIEVED"} <b>{openingModeLabel(openingTelemetry.achieved, language)}</b></span><span className={openingTelemetry.did_fallback ? "text-[#b64b31]" : "text-[#1b7b5e]"}>{openingTelemetry.did_fallback ? (language === "vi" ? `LÙI ${openingTelemetry.fallback_count} CẤP` : `${openingTelemetry.fallback_count} FALLBACKS`) : (language === "vi" ? "ĐÚNG CẤP" : "TARGET MET")}</span>{openingTelemetry.method === "staged" && <span className="text-[#1b7b5e]">{language === "vi" ? "STAGED · CROSS → F2L" : "STAGED · CROSS → F2L"}</span>}<span className="studio-fallback-path">{language === "vi" ? "THỬ" : "TRIED"}: {openingTelemetry.attempts.map((attempt) => openingModeLabel(attempt, language)).join(" → ")}</span></div>}</div>}
              {lastLayerTelemetry && <div className={cn("studio-opening-outcome mt-3 border-2", lastLayerTelemetry.did_fallback ? "border-[#e7c34f]/60 bg-[#e7c34f]/10" : "border-[#1ba77a]/50 bg-[#1ba77a]/10")}><div className="flex flex-wrap items-center gap-2 px-4 py-2.5 font-mono text-[9px]"><span className="font-bold tracking-[0.14em] text-[#17221d]/55">{language === "vi" ? "LAST LAYER" : "LAST LAYER"}</span><span>{language === "vi" ? "YÊU CẦU" : "REQUEST"} <b>{lastLayerModeLabel(lastLayerTelemetry.requested, language)}</b></span><span>→</span><span>{language === "vi" ? "ĐẠT" : "ACHIEVED"} <b>{lastLayerModeLabel(lastLayerTelemetry.achieved, language)}</b></span><span className={lastLayerTelemetry.did_fallback ? "text-[#9b6b00]" : "text-[#1b7b5e]"}>{lastLayerTelemetry.did_fallback ? (language === "vi" ? `LÙI ${lastLayerTelemetry.fallback_count} CẤP` : `${lastLayerTelemetry.fallback_count} FALLBACKS`) : (language === "vi" ? "DIRECT" : "DIRECT")}</span><span className="studio-fallback-path">{language === "vi" ? "THỬ" : "TRIED"}: {lastLayerTelemetry.attempts.map((attempt) => lastLayerModeLabel(attempt, language)).join(" → ")}</span></div></div>}
              <div className="studio-apparatus-rail mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"><div className="flex items-center gap-4"><input aria-label="Chọn move trong trace" type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => selectCursor(Number(event.target.value), "seek")} className="min-w-0 flex-1 accent-[#1ba77a]" /><span className="min-w-16 text-right font-mono text-xs font-bold">{cursor} moves</span></div><label className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#17221d]/60">Speed {playbackSpeed.toFixed(2)}×<input aria-label="Playback speed" type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} className="w-24 accent-[#1ba77a]" /></label></div>
            </div>
          </section>

          <aside className="studio-telemetry-column space-y-5 xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)] xl:overflow-auto xl:pr-2">
            <div className="studio-telemetry-strip studio-record-strip grid grid-cols-3 gap-2"><Stat label={t("status.moves")} value={result ? String(totalMoves) : "—"} icon={<CircleGauge className="h-4 w-4" />} /><Stat label={t("status.steps")} value={result ? String(phaseCount) : "—"} icon={<ChevronRight className="h-4 w-4" />} /><Stat label={t("status.ok")} value={result ? "✓" : "—"} icon={<ShieldCheck className="h-4 w-4" />} /></div>
            {result ? <CFOPReport result={result} language={language} activePhase={activePhase?.name ?? null} cursor={cursor} onSelectPhase={(phase) => selectCursor(phase.end, "phase")} onSelectMove={(moveIndex) => selectCursor(moveIndex, "seek")} /> : <section className="studio-report-empty border-2 border-[#17221d]/25 bg-[#f8f5ed] p-4"><p className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#1b7b5e]">CFOP · {language === "vi" ? "BÁO CÁO LỜI GIẢI" : "SOLUTION REPORT"}</p><p className="mt-2 font-mono text-[10px] leading-5 text-[#17221d]/60">{language === "vi" ? "Chạy solver để ghi phase, invariant, algorithm và xuất báo cáo tại đây." : "Run the solver to record phases, invariants, algorithms, and exports here."}</p></section>}
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="telemetry-panel rounded-md border-2 border-[#17221d] bg-white p-3 shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><div className="flex items-center justify-between text-[#17221d]/45">{icon}<span className="font-mono text-[8px] font-bold tracking-[0.12em]">{label}</span></div><p className="mt-2 font-mono text-xl font-bold tracking-[-0.08em]">{value}</p></div>;
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
  return <section className="last-layer-explorer telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-white p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ba77a]">LAST LAYER EXPLORER</p><h3 className="mt-1 text-base font-black tracking-[-0.04em]">{vi ? "Tra cứu case direct" : "Browse direct cases"}</h3></div><span className="rounded-sm bg-[#17221d] px-2 py-1 font-mono text-[9px] font-bold text-[#f4f0e8]">{masteredCount}/{unfilteredCount} ✓</span></div>
    <div className="mt-4 grid grid-cols-2 gap-2"><Select value={family} onValueChange={(value) => onFamily(value as "all" | "zbll" | "1lll")}><SelectTrigger aria-label={vi ? "Loại Last Layer" : "Last Layer family"} className="h-9 rounded-sm border border-[#17221d]/25 bg-[#f4f0e8] px-2 font-mono text-[10px] font-bold"><SelectValue /></SelectTrigger><SelectContent className="border-2 border-[#17221d] bg-[#f8f5ed] font-mono text-xs"><SelectItem value="all">ALL · ZBLL + 1LLL</SelectItem><SelectItem value="zbll">ZBLL</SelectItem><SelectItem value="1lll">1LLL</SelectItem></SelectContent></Select><Select value={group} onValueChange={onGroup}><SelectTrigger aria-label={vi ? "Nhóm case" : "Case group"} className="h-9 rounded-sm border border-[#17221d]/25 bg-[#f4f0e8] px-2 font-mono text-[10px] font-bold"><SelectValue /></SelectTrigger><SelectContent className="border-2 border-[#17221d] bg-[#f8f5ed] font-mono text-xs"><SelectItem value="all">{vi ? "NHÓM · TẤT CẢ" : "GROUP · ALL"}</SelectItem>{groups.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
    <label className="mt-2 flex items-center gap-2 rounded-sm border border-[#17221d]/20 bg-[#f4f0e8] px-2"><Search className="h-3.5 w-3.5 text-[#17221d]/45" /><input value={query} onChange={(event) => onQuery(event.target.value.slice(0, 80))} placeholder={vi ? "Tìm ID, nhóm hoặc notation" : "Search ID, group or notation"} className="h-9 min-w-0 flex-1 bg-transparent font-mono text-[10px] outline-none placeholder:text-[#17221d]/40" /></label>
    <div className="last-layer-study-controls mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2"><button type="button" onClick={onToggleUnmastered} className={cn("rounded-sm border px-2 py-2 text-left font-mono text-[9px] font-bold transition", onlyUnmastered ? "border-[#1ba77a] bg-[#1ba77a]/15 text-[#1b7b5e]" : "border-[#17221d]/20 bg-white text-[#17221d]/60 hover:border-[#17221d]")}><span className="block tracking-[0.1em]">{onlyUnmastered ? (vi ? "CHỈ CHƯA THUỘC" : "UNMASTERED ONLY") : (vi ? "TẤT CẢ CASE" : "ALL CASES")}</span><span className="mt-0.5 block text-[#17221d]/45">{unmasteredCount} {vi ? "case chưa thuộc" : "unmastered cases"}</span></button><button type="button" onClick={onRandomPractice} disabled={unmasteredCount === 0} className="inline-flex min-w-20 flex-col items-center justify-center gap-1 rounded-sm border-2 border-[#17221d] bg-[#17221d] px-2 py-1 font-mono text-[9px] font-bold text-[#f4f0e8] transition hover:bg-[#26372e] disabled:opacity-35"><Sparkles className="h-3.5 w-3.5 text-[#1ba77a]" />{vi ? "LUYỆN NGẪU NHIÊN" : "RANDOM PRACTICE"}</button></div>
    <p className="mt-2 font-mono text-[9px] leading-4 text-[#17221d]/55">{vi ? "Luyện ngẫu nhiên luôn chọn một case chưa thuộc trong family, nhóm và tìm kiếm hiện tại." : "Random practice always selects an unmastered case within the current family, group, and search."}</p>
    <details className="last-layer-group-progress mt-3 border-y border-[#17221d]/14 py-2"><summary className="cursor-pointer font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#17221d]/60">{vi ? `TIẾN ĐỘ THEO NHÓM · ${groupProgress.length}` : `PROGRESS BY GROUP · ${groupProgress.length}`}</summary><div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">{groupProgress.map((item) => { const percentage = item.total ? Math.round((item.mastered / item.total) * 100) : 0; return <div key={`${item.family}:${item.group}`} className="group-progress-row"><div className="flex items-center justify-between gap-2 font-mono text-[9px]"><span><b className={item.family === "zbll" ? "text-[#1b7b5e]" : "text-[#17221d]"}>{item.family.toUpperCase()}</b> · {item.group}</span><b>{percentage}%</b></div><div className="mt-1 h-1.5 overflow-hidden bg-[#17221d]/10"><span className="block h-full bg-[#1ba77a] transition-[width] duration-200" style={{ width: `${percentage}%` }} /></div><p className="mt-1 text-right font-mono text-[8px] text-[#17221d]/50">{item.mastered} / {item.total}</p></div>; })}</div></details>
    <div className="last-layer-case-list mt-3 max-h-[440px] overflow-y-auto pr-1">{loading ? <div className="py-6 text-center font-mono text-[10px] text-[#17221d]/45">{vi ? "ĐANG NẠP CATALOG…" : "LOADING CATALOG…"}</div> : cases.length ? cases.slice(0, 48).map((catalogCase) => { const mastered = masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`); return <button key={catalogCase.id} type="button" onClick={() => onSelect(catalogCase)} className={cn("w-full border p-2 text-left transition", selectedCase?.id === catalogCase.id ? "border-[#1ba77a] bg-[#1ba77a]/10 shadow-[inset_3px_0_0_#1ba77a]" : "border-[#17221d]/12 bg-[#f4f0e8] hover:border-[#17221d]/45 hover:bg-white")}><span className="flex items-center justify-between gap-2"><span className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold", catalogCase.family === "zbll" ? "bg-[#1ba77a] text-[#17221d]" : "bg-[#17221d] text-[#f4f0e8]")}>{catalogCase.family.toUpperCase()}</span><span className="font-mono text-[9px] text-[#17221d]/50">{mastered ? "✓ " : ""}{catalogCase.group}</span></span><b className="mt-1 block font-mono text-[10px] text-[#17221d]">{catalogCase.id}</b></button>; }) : <div className="border border-dashed border-[#17221d]/25 p-4 font-mono text-[10px] leading-5 text-[#17221d]/55">{onlyUnmastered ? (vi ? "Các case trong bộ lọc hiện tại đều đã thuộc." : "Every case in the current filter is mastered.") : (vi ? "Không có case khớp bộ lọc hiện tại." : "No cases match the current filters.")}</div>}</div>
    {cases.length > 48 && <p className="mt-2 font-mono text-[9px] text-[#17221d]/45">{vi ? `Hiển thị 48 / ${cases.length} case. Thu hẹp bằng nhóm hoặc tìm kiếm.` : `Showing 48 / ${cases.length} cases. Narrow with group or search.`}</p>}
  </section>;
}

function LastLayerFormulaStrip({ catalogCase, mastered, language, onToggleMastered }: { catalogCase: LastLayerCatalogCase; mastered: boolean; language: "vi" | "en"; onToggleMastered: () => void }) {
  const vi = language === "vi";
  return <section className="last-layer-formula-strip w-full max-w-[530px] border-2 border-[#17221d] bg-[#f8f5ed] p-3 shadow-[4px_4px_0_rgba(23,34,29,0.18)]"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#1ba77a]">{catalogCase.family.toUpperCase()} · {catalogCase.group}</p><h3 className="mt-0.5 font-mono text-sm font-black text-[#17221d]">{catalogCase.id}</h3></div><button type="button" onClick={onToggleMastered} className={cn("inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[9px] font-bold", mastered ? "border-[#1ba77a] bg-[#1ba77a] text-[#17221d]" : "border-[#17221d]/20 bg-white text-[#17221d]/60 hover:border-[#17221d]")}><Check className="h-3.5 w-3.5" />{mastered ? (vi ? "ĐÃ THUỘC" : "MASTERED") : (vi ? "ĐÁNH DẤU ĐÃ THUỘC" : "MARK MASTERED")}</button></div><pre className="mt-3 whitespace-pre-wrap break-words border-y border-[#17221d]/12 py-3 font-mono text-sm font-bold leading-6 text-[#17221d] sm:text-base">{catalogCase.algorithm}</pre><p className="mt-2 font-mono text-[9px] leading-4 text-[#17221d]/55">{vi ? "Công thức này khớp với state trên CubeNet bên dưới." : "This formula matches the CubeNet state below."}</p></section>;
}

/** Xưởng Cơ Khí Tốc Độ — report is a readable proof of the CFOP pipeline, not a timer metric. */
function CFOPReport({ result, language, activePhase, cursor, onSelectPhase, onSelectMove }: { result: SolverResult; language: "vi" | "en"; activePhase: string | null; cursor: number; onSelectPhase: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
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
    <section className="studio-cfop-report scorecard border-2 border-[#17221d] bg-white p-4 shadow-[3px_3px_0_rgba(23,34,29,0.12)] sm:p-5">
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
      <details className="studio-report-options mt-3 border border-[#17221d]/12 bg-[#f4f0e8] p-2"><summary className="cursor-pointer font-mono text-[9px] font-bold tracking-[0.12em] text-[#17221d]/60">{vi ? "TÙY CHỈNH PNG" : "PNG OPTIONS"}</summary><div className="mt-3 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 font-mono text-[9px] font-bold text-[#17221d]/60">{vi ? "TÊN" : "NAME"}<input value={ownerName} onChange={(event) => setOwnerName(event.target.value.slice(0, 42))} placeholder={vi ? "Tùy chọn" : "Optional"} className="w-36 rounded-sm border border-[#17221d]/20 bg-white px-2 py-1 font-sans text-xs outline-none focus:border-[#1ba77a]" /></label><label className="flex items-center gap-2 font-mono text-[9px] font-bold text-[#17221d]/60">{vi ? "NỀN" : "BACKGROUND"}<input aria-label={vi ? "Màu nền PNG" : "PNG background color"} type="color" value={pngBackground} onChange={(event) => setPngBackground(event.target.value)} className="h-7 w-9 cursor-pointer rounded-sm border border-[#17221d]/20 bg-white p-1" /></label></div></details>
      {openingPhase && <div className={cn("mt-3 flex flex-wrap items-center justify-between gap-3 border-l-4 p-3", xxxxcrossSlots || xxxcrossSlots || xxcrossSlots || xcrossSlot ? "border-[#1ba77a] bg-[#1ba77a]/10" : "border-[#17221d]/30 bg-[#f4f0e8]")}><div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#17221d]/55">{vi ? "CHIẾN LƯỢC OPENING" : "OPENING STRATEGY"}</p><p className="mt-1 break-words text-sm font-black">{xxxxcrossSlots ? "XXXXCross · Full F2L" : xxxcrossSlots ? `XXXCross · ${xxxcrossSlots.join(" + ")}` : xxcrossSlots ? `XXCross · ${xxcrossSlots.join(" + ")}` : xcrossSlot ? `XCross · ${xcrossSlot}` : "Cross"}</p></div><p className="max-w-md break-words text-left font-mono text-[10px] leading-4 text-[#17221d]/60 sm:text-right">{xxxxcrossSlots ? (vi ? "Cross và toàn bộ bốn cặp F2L đã hoàn tất cùng pha; chỉ còn OLL và PLL, invariant là full F2L." : "Cross and all four F2L pairs were completed in one phase; only OLL and PLL remain, with full F2L as the invariant.") : xxxcrossSlots ? (vi ? `Cross và ba cặp F2L ${xxxcrossSlots.join(" + ")} đã hoàn tất cùng pha; slot cuối tiếp tục theo invariant.` : `Cross and F2L ${xxxcrossSlots.join(" + ")} were completed in one phase; the final slot preserves that invariant.`) : xxcrossSlots ? (vi ? `Cross và hai cặp F2L ${xxcrossSlots.join(" + ")} đã hoàn tất cùng pha; hai slot còn lại tiếp tục theo invariant.` : `Cross and F2L ${xxcrossSlots.join(" + ")} were completed in one phase; the remaining two slots preserve that invariant.`) : xcrossSlot ? (vi ? `Cross và cặp F2L ${xcrossSlot} đã hoàn tất cùng pha; ba slot còn lại tiếp tục theo invariant.` : `Cross and F2L ${xcrossSlot} were completed in one phase; the remaining three slots preserve that invariant.`) : (vi ? "Không có nghiệm XXXXCross/XXXCross/XXCross/XCross trong budget; solver tiếp tục Cross chuẩn mà không giảm độ tin cậy." : "No XXXXCross/XXXCross/XXCross/XCross fit the budget; the solver continued with standard Cross without reducing reliability.")}</p></div>}
      <details className="studio-report-phases mt-4 border-t border-[#17221d]/12 pt-3"><summary className="cursor-pointer font-mono text-[9px] font-bold tracking-[0.12em] text-[#1b7b5e]">{vi ? `CHI TIẾT ${result.phases.length} PHASE` : `${result.phases.length} PHASE DETAILS`}</summary><div className="mt-3 space-y-2">{result.phases.map((phase, index) => <CFOPPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} cursor={cursor} onSelect={onSelectPhase} onSelectMove={onSelectMove} />)}</div></details>
    </section>
  );
}

function CFOPPhaseRow({ phase, index, language, selected, cursor, onSelect, onSelectMove }: { phase: SolverResult["phases"][number]; index: number; language: "vi" | "en"; selected: boolean; cursor: number; onSelect: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
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
    {phase.moves.length > 0 && <div className="mt-3 border-t border-dashed border-[#17221d]/12 pt-3"><p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#17221d]/45">{vi ? "SEQUENCE · CHẠM MOVE ĐỂ XEM" : "SEQUENCE · TAP A MOVE TO REVIEW"}</p><div className="mt-2 flex flex-wrap gap-1">{phase.moves.map((move, moveIndex) => { const movePosition = phase.start + moveIndex + 1; return <button key={`${phase.name}-${movePosition}-${move}`} type="button" onClick={() => onSelectMove(movePosition)} className={cn("rounded-sm px-1.5 py-1 font-mono text-[10px] font-bold transition", cursor === movePosition ? "bg-[#1ba77a] text-[#17221d]" : "border border-[#17221d]/12 bg-white text-[#17221d]/65 hover:border-[#17221d]/40")}>{move}</button>; })}</div></div>}
  </article>;
}

function PhaseStudyTooltip({ studyNote, lessonUrl, vi, trigger }: { studyNote: string; lessonUrl: string; vi: boolean; trigger?: ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>{trigger ?? <span tabIndex={0} className="inline-flex cursor-help text-[#1b7b5e] outline-none focus:ring-2 focus:ring-[#1ba77a]"><Info className="h-3.5 w-3.5" /></span>}</TooltipTrigger><TooltipContent side="top" className="max-w-80 bg-[#17221d] p-3 text-xs leading-5 text-[#f4f0e8]"><p>{studyNote}</p><a href={lessonUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#4fe3af] underline">{vi ? "Mở bài học & công thức" : "Open lesson & algorithms"}<ExternalLink className="h-3 w-3" /></a></TooltipContent></Tooltip>;
}
