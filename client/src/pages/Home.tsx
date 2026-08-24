/**
 * Soft Focus Workspace: a calm, reusable desktop-first Rubik canvas. Surfaces are
 * grouped by spacing, soft elevation and color—not decorative borders—while 3D cube
 * movement remains the sole rich animation.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, CircleGauge, ClipboardCopy,
  Cpu, FileJson, History, ImageDown, Info, Layers3, Loader2, Play, RotateCcw, Search, ShieldCheck, Sparkles, Trash2,
} from "@/components/BootstrapIcon";
import { Timer } from "@/components/BootstrapIcon";
import { Link } from "wouter";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { BldReport } from "@/components/BldReport";
import { CubeStateEditor } from "@/components/CubeStateEditor";
import { CameraScanner } from "@/components/CameraScanner";
import { FieldGroup, PageHeader, StatusFeedback } from "@/components/BootstrapUI";
import { stateFromScramble } from "@/lib/fastCube";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { readSolverSettings } from "@/lib/appSettings";
import { readBldProfile, writeBldProfile } from "@/lib/bldProfile";
import { readMasteredCaseKeys, writeMasteredCaseKeys } from "@/lib/lastLayerStudy";
import { analyzeBldInBrowser, listLastLayerCasesInBrowser, solveInBrowser, validateStateInBrowser, type BldResult, type CrossColor, type CubeValidation, type F2LSlot, type LastLayerCatalogCase, type LastLayerMode, type OpeningMode, type SolverResult } from "@/lib/solverRuntime";

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
  const [solverKind, setSolverKind] = useState<"cfop" | "bld">("cfop");
  const [crossColor, setCrossColor] = useState<CrossColor>(() => readSolverSettings().crossColor);
  const [opening, setOpening] = useState<OpeningMode>(() => readSolverSettings().opening);
  const [openingDepth, setOpeningDepth] = useState(() => readSolverSettings().openingDepth);
  const [lastLayer, setLastLayer] = useState<LastLayerMode>(() => readSolverSettings().lastLayer);
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>(() => readSolverSettings().preferredSlot);
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>(() => readSolverSettings().excludedSlots);
  const [initialScramble] = useState(() => randomDefaultScramble());
  const [value, setValue] = useState(initialScramble);
  const [savedScramble, setSavedScramble] = useState(initialScramble);
  const [savedState, setSavedState] = useState(SOLVED_STATE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [bldResult, setBldResult] = useState<BldResult | null>(null);
  const [bldProfile, setBldProfile] = useState(() => readBldProfile());
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
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
    try {
      if (solverKind === "bld") {
        const next = await analyzeBldInBrowser(mode, value.trim());
        setBldResult(next);
        setResult(null);
        cursorRef.current = 0;
        setCubeMotion({ id: ++motionIdRef.current, kind: "reset", direction: "forward" });
        setCursor(0);
        if (mode === "state") rememberRecentState(value.trim(), crossColor);
        return;
      }
      const next = await solveInBrowser(mode, value.trim(), crossColor, opening, { preferredSlot, excludedSlots }, lastLayer, openingDepth);
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
    <div className="studio-page bs-page overflow-x-hidden">
      <div className="container py-4">
        <section className="row g-4">
          <header className="col-12 d-flex flex-wrap align-items-center gap-3">
            <PageHeader className="w-100 mb-0" title={solverKind === "bld" ? "3-Style / Speffz" : "CFOP Solver"} description={solverKind === "bld" ? (language === "vi" ? "Tạo memo từ scramble hoặc state, sau đó chuyển sang Study để luyện." : "Create a memo from a scramble or state, then continue to Study for practice.") : mode === "state" ? (language === "vi" ? "Kiểm tra state 54 sticker và chạy pipeline CFOP." : "Validate a 54-sticker state and run the CFOP pipeline.") : (language === "vi" ? "Nhập scramble để nhận lời giải CFOP theo từng pha." : "Enter a scramble for a phase-by-phase CFOP solution.")} />
            <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Chế độ solver" : "Solver mode"}>
              {(["cfop", "bld"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={solverKind === item} onClick={() => { setSolverKind(item); setResult(null); setBldResult(null); setCursor(0); setPlaying(false); setError(""); }} className={solverKind === item ? "btn btn-primary" : "btn btn-outline-primary"}>{item === "cfop" ? "CFOP" : "3-Style"}</button>)}
            </div>
            <div className="btn-group" role="tablist" aria-label={language === "vi" ? "Nguồn đầu vào" : "Input source"}>
              {(["scramble", "state"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => switchInputMode(item)} className={mode === item ? "btn btn-primary" : "btn btn-outline-primary"}>{item === "scramble" ? t("input.scramble") : t("input.state")}</button>)}
            </div>
            {loading ? <span className="small text-body-secondary ms-lg-auto" role="status">{t("input.loading")}</span> : null}
            {solverKind === "cfop" ? <div className="alert alert-secondary small d-flex flex-wrap align-items-center gap-2 w-100 mb-0"><span>{language === "vi" ? "Các lựa chọn Solver ở đây chỉ áp dụng cho lần giải đang mở; mặc định lâu dài nằm trong Cài đặt." : "Solver choices here apply only to the current Studio session; persistent defaults live in Settings."}</span><button type="button" className="btn btn-outline-secondary btn-sm ms-sm-auto" onClick={() => { const defaults = readSolverSettings(); setCrossColor(defaults.crossColor); setOpening(defaults.opening); setOpeningDepth(defaults.openingDepth); setLastLayer(defaults.lastLayer); setPreferredSlot(defaults.preferredSlot); setExcludedSlots(defaults.excludedSlots); }}>{language === "vi" ? "Dùng mặc định" : "Use defaults"}</button></div> : null}
          </header>
          <aside className="col-12 col-lg-4"><section className="card"><div className="card-header"><h2 className="h5 mb-0">{mode === "scramble" ? "Move sequence" : "54-sticker state"}</h2></div><div className="card-body">
                {solverKind === "bld" && <div className="alert alert-info small">BUFFER / UF (C) · UBL (A) — {language === "vi" ? "Chuẩn bị trace memo và execution key." : "Prepare memo trace and execution key."}</div>}
                <div className="accordion mb-3" id="studio-solver-settings"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#studio-solver-settings-body" aria-expanded="true" aria-controls="studio-solver-settings-body">{language === "vi" ? "Cài đặt Solver" : "Solver settings"}</button></h3><div id="studio-solver-settings-body" className="accordion-collapse collapse show"><div className="accordion-body">
                  <label className="form-label">{language === "vi" ? "Màu Cross" : "Cross color"}</label><div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label={language === "vi" ? "Chọn màu Cross" : "Choose Cross color"}>{CROSS_COLORS.map((item) => <button key={item.value} type="button" role="radio" aria-checked={crossColor === item.value} aria-label={language === "vi" ? `Cross ${item.vi}` : `Cross ${item.en}`} title={language === "vi" ? item.vi : item.en} onClick={() => setCrossColor(item.value)} className={crossColor === item.value ? "btn btn-primary btn-sm p-2" : "btn btn-outline-secondary btn-sm p-2"}><span className="d-block rounded-circle border" style={{ width: "0.75rem", height: "0.75rem", backgroundColor: item.hex }} /><span className="visually-hidden">{language === "vi" ? item.vi : item.en}</span></button>)}</div>
                  <label className="form-label mt-3" htmlFor="studio-opening">{language === "vi" ? "Opening" : "Opening"}</label><select id="studio-opening" value={opening} onChange={(event) => chooseOpening(event.target.value as OpeningMode)} className="form-select"><option value="cross">{language === "vi" ? "Cross chuẩn · chỉ Cross" : "Standard Cross · Cross only"}</option><option value="auto">Auto XCross · Cross + 1 F2L</option><option value="xxcross">Auto XXCross · Cross + 2 F2L</option><option value="xxxcross">Auto XXXCross · Cross + 3 F2L</option><option value="xxxxcross">Auto XXXXCross · Full F2L</option></select>
                  <label className="form-label mt-3" htmlFor="studio-last-layer">Last Layer</label><select id="studio-last-layer" value={lastLayer} onChange={(event) => setLastLayer(event.target.value as LastLayerMode)} className="form-select"><option value="auto">Auto · ZBLL → 1LLL → OLL/PLL</option><option value="oll_pll">OLL + PLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select>
                </div></div></div></div>
                {opening !== "cross" && opening !== "xxxxcross" && <div className="accordion mb-3" id="studio-f2l-settings"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-f2l-settings-body" aria-expanded="false" aria-controls="studio-f2l-settings-body">{language === "vi" ? "Cài đặt slot F2L" : "F2L slot settings"}</button></h3><div id="studio-f2l-settings-body" className="accordion-collapse collapse"><div className="accordion-body"><label className="form-label">{language === "vi" ? "Ưu tiên F2L" : "F2L priority"}</label><div className="btn-group w-100" role="group"><button type="button" onClick={() => setPreferredSlot(undefined)} className={!preferredSlot ? "btn btn-primary" : "btn btn-outline-secondary"}>{language === "vi" ? "Tự" : "Any"}</button>{F2L_SLOTS.map((slot) => <button key={slot} type="button" disabled={excludedSlots.includes(slot)} onClick={() => setPreferredSlot(preferredSlot === slot ? undefined : slot)} className={preferredSlot === slot ? "btn btn-primary" : "btn btn-outline-secondary"}>{slot}</button>)}</div><label className="form-label mt-3">{language === "vi" ? "Loại trừ slot" : "Exclude slots"}</label><div className="btn-group w-100" role="group">{F2L_SLOTS.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => { setExcludedSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]); if (preferredSlot === slot) setPreferredSlot(undefined); }} className={excludedSlots.includes(slot) ? "btn btn-danger" : "btn btn-outline-secondary"}>{slot}</button>)}</div></div></div></div></div>}
                {mode === "scramble" ? <textarea aria-label={t("input.label")} value={value} onChange={(event) => { setValue(event.target.value); setSavedScramble(event.target.value); setBldResult(null); }} placeholder={language === "vi" ? "Nhập scramble · R U R' U'" : "Enter scramble · R U R' U'"} spellCheck={false} className="form-control mt-4" rows={5} /> : <><div className="mt-4"><CubeStateEditor state={value} onChange={applyStateEdit} disabled={loading} canUndo={stateHistory.current.past.length > 0} canRedo={stateHistory.current.future.length > 0} onUndo={undoStateEdit} onRedo={redoStateEdit} selectedColor={paintColor} onSelectedColorChange={setPaintColor} controlsOnly /></div><p className="small text-body-secondary mt-2">{language === "vi" ? "Tô trực tiếp trên sơ đồ 2D lớn cạnh Cube 3D." : "Paint directly on the large 2D net beside the 3D cube."}</p><div className={stateValidation?.valid ? "alert alert-success mt-3" : "alert alert-danger mt-3"}>{stateValidation?.valid ? `✓ ${stateValidation.message}` : stateValidation?.message ?? (language === "vi" ? "Đang chờ kiểm tra state." : "Waiting to validate state.")}</div>{recentStates.length > 0 && <div className="mt-3"><p className="small fw-semibold mb-2"><History className="fs-6 me-1" /> {language === "vi" ? "State gần đây" : "Recent states"}</p><div className="list-group">{recentStates.map((item) => <div key={item.id} className="list-group-item d-flex align-items-center gap-2"><button type="button" onClick={() => loadRecentState(item)} className="btn btn-link text-start text-truncate flex-grow-1 p-0">{item.label}</button><button type="button" onClick={() => removeRecentState(item.id)} aria-label={language === "vi" ? `Xóa ${item.label}` : `Remove ${item.label}`} className="btn btn-outline-danger btn-sm"><Trash2 className="fs-6" /></button></div>)}</div></div>}<div className="accordion mt-3" id="studio-state-paste"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-state-paste-body" aria-expanded="false" aria-controls="studio-state-paste-body">{language === "vi" ? "Dán chuỗi 54 sticker" : "Paste 54-sticker state"}</button></h3><div id="studio-state-paste-body" className="accordion-collapse collapse"><div className="accordion-body"><textarea value={value} onChange={(event) => applyStateEdit(event.target.value.replaceAll(/\s/g, "").toUpperCase())} spellCheck={false} className="form-control" rows={3} /></div></div></div></div></>}
                {error && <div className="mt-3"><StatusFeedback tone="danger" title={language === "vi" ? "Không thể chạy solver" : "Solver could not run"}>{error}</StatusFeedback></div>}
                <button disabled={loading || !value.trim() || (mode === "state" && !stateValidation?.valid)} onClick={runSolver} className="btn btn-primary w-100 mt-4">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("input.loading")}</> : <><Sparkles className="h-4 w-4" />{solverKind === "bld" ? (language === "vi" ? "TẠO MEMO 3-STYLE" : "BUILD 3-STYLE MEMO") : t("input.solve")}</>}
                </button>
              </div>
            </section>
            <section className="card mt-3"><div className="card-header p-0"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-camera-body" aria-expanded="false" aria-controls="studio-camera-body">{language === "vi" ? "Quét camera · tùy chọn" : "Camera scan · optional"}</button></div><div id="studio-camera-body" className="collapse"><div className="card-body"><CameraScanner onState={(state) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(state); setSavedState(state); setResult(null); setBldResult(null); setCursor(0); setError(""); }} /></div></div></section>
            <section className="card mt-3" aria-label={language === "vi" ? "Run profile" : "Run profile"}><div className="card-header"><h2 className="h6 mb-0">{language === "vi" ? "Cấu hình chạy" : "Run profile"}</h2></div><div className="list-group list-group-flush"><div className="list-group-item d-flex justify-content-between gap-3"><span className="text-body-secondary">{language === "vi" ? "Nguồn" : "Source"}</span><strong>{mode === "scramble" ? "SCRAMBLE" : "STATE"}</strong></div><div className="list-group-item d-flex justify-content-between gap-3"><span className="text-body-secondary">Opening</span><strong>{solverKind === "bld" ? "CYCLE TRACE" : OPENING_OPTIONS.find((item) => item.value === opening)?.compact}</strong></div><div className="list-group-item d-flex justify-content-between gap-3"><span className="text-body-secondary">{language === "vi" ? "Đích" : "Target"}</span><strong>{solverKind === "bld" ? "EDGE / CORNER" : LAST_LAYER_OPTIONS.find((item) => item.value === lastLayer)?.compact}</strong></div></div><div className="card-body"><p className="small text-body-secondary mb-0">{language === "vi" ? "Mở Cài đặt Solver để hiệu chỉnh pipeline." : "Open Solver Settings to calibrate the pipeline."}</p></div></section>
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
                <button onClick={() => selectCursor(Math.max(0, cursor - 1), "step")} disabled={cursor === 0} aria-label={t("guide.previous")} className="btn btn-outline-secondary"><ArrowLeft className="h-4 w-4" /></button>
                <button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} aria-label={playing ? t("guide.pause") : t("guide.play")} className="btn btn-primary">{playing ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}</button>
                <button onClick={() => selectCursor(Math.min(totalMoves, cursor + 1), "step")} disabled={!result || cursor === totalMoves} aria-label={t("guide.next")} className="btn btn-outline-secondary"><ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => selectCursor(0, "reset")} disabled={!result} aria-label={t("guide.reset")} className="btn btn-outline-secondary ms-auto"><RotateCcw className="h-3.5 w-3.5" /></button>
              </div>
              {openingOutcome && <div className="alert alert-success mt-3 mb-0"><strong>{language === "vi" ? "Kết quả Opening:" : "Opening outcome:"}</strong> {openingOutcome.kind} · {openingOutcome.moves} {language === "vi" ? "nước" : "moves"}{openingTelemetry?.did_fallback ? ` · ${language === "vi" ? `Lùi ${openingTelemetry.fallback_count} cấp` : `${openingTelemetry.fallback_count} fallbacks`}` : ""}</div>}
              {lastLayerTelemetry && <div className={lastLayerTelemetry.did_fallback ? "alert alert-warning mt-3 mb-0" : "alert alert-success mt-3 mb-0"}><strong>Last Layer:</strong> {lastLayerModeLabel(lastLayerTelemetry.achieved, language)} {lastLayerTelemetry.case_id ? `· ${lastLayerTelemetry.case_id}` : ""}{lastLayerTelemetry.case_id && (lastLayerTelemetry.achieved === "zbll" || lastLayerTelemetry.achieved === "1lll") ? <Link href={`/study?family=${lastLayerTelemetry.achieved}&case=${encodeURIComponent(lastLayerTelemetry.case_id)}`} className="btn btn-sm btn-outline-secondary ms-2">{language === "vi" ? "Mở trong Study" : "Open in Study"}</Link> : null}</div>}
              <div className="row g-3 align-items-center mt-1"><div className="col"><input aria-label="Chọn move trong trace" type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => selectCursor(Number(event.target.value), "seek")} className="form-range" /><small className="text-body-secondary">{cursor} moves</small></div><div className="col-12 col-sm-auto"><label className="form-label mb-0">Speed {playbackSpeed.toFixed(2)}×<input aria-label="Playback speed" type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))} className="form-range" /></label></div></div></>}
            </div></div>
          </section>

          <aside className="col-12"><section className="card"><div className="card-body"><div className="row g-3"><div className="col-12 col-md-6"><Stat label={solverKind === "bld" ? "EDGE" : t("status.moves")} value={solverKind === "bld" ? String(bldResult?.analysis.edges.memo.length ?? "—") : (result ? String(totalMoves) : "—")} icon={<CircleGauge className="fs-4" />} /></div><div className="col-12 col-md-6"><Stat label={solverKind === "bld" ? "CORNER" : t("status.steps")} value={solverKind === "bld" ? String(bldResult?.analysis.corners.memo.length ?? "—") : (result ? String(phaseCount) : "—")} icon={<ChevronRight className="fs-4" />} /></div><div className="col-12"><Stat label={solverKind === "bld" ? "PARITY" : t("status.ok")} value={solverKind === "bld" ? (bldResult?.analysis.special.parity ? "!" : "✓") : (result ? "✓" : "—")} icon={<ShieldCheck className="fs-4" />} /></div></div><hr /><h2 className="h6">{language === "vi" ? "Bảng kiểm tra" : "Inspector"}</h2><dl className="row mb-0"><dt className="col-sm-3">{language === "vi" ? "Nguồn" : "Source"}</dt><dd className="col-sm-9">{mode === "scramble" ? (language === "vi" ? "Chuỗi xoay" : "Scramble") : "54-sticker state"}</dd><dt className="col-sm-3">Pipeline</dt><dd className="col-sm-9">{solverKind === "bld" ? "Memo · cycles · BLDDB" : `${opening.toUpperCase()} · ${lastLayer.toUpperCase()}`}</dd><dt className="col-sm-3">{solverKind === "bld" ? "Buffers" : "Cross"}</dt><dd className="col-sm-9">{solverKind === "bld" ? "UF / UBL" : (language === "vi" ? CROSS_COLORS.find((item) => item.value === crossColor)?.vi : CROSS_COLORS.find((item) => item.value === crossColor)?.en)}</dd></dl></div></section><section className="card mt-3"><div className="card-body">{solverKind === "bld" && bldResult ? <BldReport result={bldResult} language={language} profile={bldProfile} onProfile={setBldProfile} /> : result ? <CFOPReport result={result} language={language} activePhase={activePhase?.name ?? null} cursor={cursor} onSelectPhase={(phase) => selectCursor(phase.end, "phase")} onSelectMove={(moveIndex) => selectCursor(moveIndex, "seek")} /> : <div className="alert alert-secondary mb-0"><h2 className="h6">{solverKind === "bld" ? "3-Style BLD · Memo" : "CFOP · Báo cáo"}</h2><p className="mb-0">{solverKind === "bld" ? (language === "vi" ? "Nhập scramble hoặc state để tạo memo, cycle và execution key." : "Enter a scramble or state to build memo cycles and execution keys.") : (language === "vi" ? "Nhập scramble hoặc state để ghi phase, invariant và thuật toán." : "Enter a scramble or state to record phases, invariants, and algorithms.")}</p></div>}</div></section></aside>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode; compact?: boolean }) {
  return <div className="card bg-body-tertiary h-100"><div className="card-body d-flex align-items-center gap-3">{icon}<div><small className="text-body-secondary d-block">{label}</small><strong className="fs-4">{value}</strong></div></div></div>;
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
  return <section className="card"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h5 mb-0">Last Layer · Catalog</h2><small className="text-body-secondary">{vi ? "Tra cứu và chọn case" : "Browse and select a case"}</small></div><span className="badge text-bg-secondary">{masteredCount}/{unfilteredCount} {vi ? "đã thuộc" : "mastered"}</span></div><div className="card-body"><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label" htmlFor="studio-family">{vi ? "Loại case" : "Case family"}</label><select id="studio-family" className="form-select" value={family} onChange={(event) => onFamily(event.target.value as "all" | "zbll" | "1lll")}><option value="all">ALL · ZBLL + 1LLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select></div><div className="col-12 col-md-6"><label className="form-label" htmlFor="studio-group">{vi ? "Nhóm" : "Group"}</label><select id="studio-group" className="form-select" value={group} onChange={(event) => onGroup(event.target.value)}><option value="all">{vi ? "Tất cả nhóm" : "All groups"}</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="col-12"><label className="form-label" htmlFor="studio-case-search">{vi ? "Tìm case" : "Search cases"}</label><div className="input-group"><span className="input-group-text"><Search className="fs-5" /></span><input id="studio-case-search" value={query} onChange={(event) => onQuery(event.target.value.slice(0, 80))} placeholder={vi ? "Tìm ID, nhóm hoặc notation" : "Search ID, group or notation"} className="form-control" /></div></div></div><div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={onToggleUnmastered} className={onlyUnmastered ? "btn btn-primary" : "btn btn-outline-secondary"}>{onlyUnmastered ? (vi ? "Chỉ case chưa thuộc" : "Unmastered only") : (vi ? "Tất cả case" : "All cases")}</button><button type="button" onClick={onRandomPractice} disabled={unmasteredCount === 0} className="btn btn-outline-primary"><Sparkles className="fs-5 me-1" />{vi ? "Luyện ngẫu nhiên" : "Random practice"}</button><span className="small text-body-secondary align-self-center">{unmasteredCount} {vi ? "case chưa thuộc" : "unmastered cases"}</span></div><div className="accordion mt-3" id="studio-group-progress"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#studio-group-progress-body" aria-expanded="false" aria-controls="studio-group-progress-body">{vi ? `Tiến độ theo nhóm · ${groupProgress.length}` : `Progress by group · ${groupProgress.length}`}</button></h3><div id="studio-group-progress-body" className="accordion-collapse collapse"><div className="accordion-body">{groupProgress.map((item) => { const percentage = item.total ? Math.round((item.mastered / item.total) * 100) : 0; return <div key={`${item.family}:${item.group}`} className="mb-3"><div className="d-flex justify-content-between small"><span>{item.family.toUpperCase()} · {item.group}</span><span>{item.mastered}/{item.total}</span></div><div className="progress" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar" style={{ width: `${percentage}%` }}>{percentage}%</div></div></div>; })}</div></div></div></div><div className="list-group mt-3">{loading ? <div className="list-group-item text-center text-body-secondary"><span className="spinner-border spinner-border-sm me-2" />{vi ? "Đang nạp Catalog…" : "Loading catalog…"}</div> : cases.length ? cases.slice(0, 48).map((catalogCase) => { const mastered = masteredCaseSet.has(`${catalogCase.family}:${catalogCase.id}`); const active = selectedCase?.id === catalogCase.id; return <button key={catalogCase.id} type="button" onClick={() => onSelect(catalogCase)} className={active ? "list-group-item list-group-item-action active" : "list-group-item list-group-item-action"}><span className="d-flex justify-content-between align-items-center gap-2"><span><strong>{catalogCase.id}</strong><small className="d-block">{catalogCase.family.toUpperCase()} · {catalogCase.group}</small></span>{mastered && <span className={active ? "badge text-bg-light" : "badge text-bg-success"}>✓</span>}</span></button>; }) : <div className="alert alert-secondary mb-0">{onlyUnmastered ? (vi ? "Các case trong bộ lọc hiện tại đều đã thuộc." : "Every case in the current filter is mastered.") : (vi ? "Không có case khớp bộ lọc hiện tại." : "No cases match the current filters.")}</div>}</div>{cases.length > 48 && <p className="small text-body-secondary mt-2 mb-0">{vi ? `Hiển thị 48 / ${cases.length} case.` : `Showing 48 / ${cases.length} cases.`}</p>}</div></section>;
}

function LastLayerFormulaStrip({ catalogCase, mastered, language, onToggleMastered }: { catalogCase: LastLayerCatalogCase; mastered: boolean; language: "vi" | "en"; onToggleMastered: () => void }) {
  const vi = language === "vi";
  return <section className="card mt-3"><div className="card-body"><div className="d-flex flex-wrap align-items-start justify-content-between gap-2"><div><span className="badge text-bg-secondary">{catalogCase.family.toUpperCase()} · {catalogCase.group}</span><h3 className="h6 mt-2 mb-0">{catalogCase.id}</h3></div><button type="button" onClick={onToggleMastered} aria-label={mastered ? (vi ? "Bỏ đánh dấu đã thuộc" : "Unmark mastered") : (vi ? "Đánh dấu đã thuộc" : "Mark mastered")} className="btn btn-outline-secondary btn-sm"><Check className="fs-5" /></button></div><pre className="bg-body-tertiary border rounded p-3 text-break text-wrap mt-3 mb-2">{catalogCase.algorithm}</pre><p className="small text-body-secondary mb-0">{vi ? "Công thức này khớp với state trên CubeNet bên dưới." : "This formula matches the CubeNet state below."}</p></div></section>;
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
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 border-bottom pb-3">
        <div>
          <p className="text-body-secondary small mb-1">CFOP · {vi ? "Báo cáo" : "Report"}</p>
          <h2 className="h4 mb-0">{result.trace.length} {vi ? "nước" : "moves"} <span className="text-body-secondary">/</span> {result.phases.length} {vi ? "phase" : "phases"}</h2>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button type="button" onClick={() => exportCFOPJson(result)} className="btn btn-outline-secondary btn-sm"><FileJson className="fs-5 me-1" />JSON</button>
          <button type="button" onClick={() => exportCFOPImage(result, language, { ownerName, background: pngBackground })} className="btn btn-outline-secondary btn-sm"><ImageDown className="fs-5 me-1" />PNG</button>
          <span className="badge text-bg-success">{totalValid} / {result.phases.length} {vi ? "invariant OK" : "invariants OK"}</span>
        </div>
      </div>
      <div className="accordion mt-3" id="cfop-png-options"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#cfop-png-options-body" aria-expanded="false" aria-controls="cfop-png-options-body">{vi ? "Tùy chỉnh PNG" : "PNG options"}</button></h3><div id="cfop-png-options-body" className="accordion-collapse collapse"><div className="accordion-body"><div className="row g-3"><div className="col-12 col-sm-6"><label className="form-label">{vi ? "Tên" : "Name"}<input value={ownerName} onChange={(event) => setOwnerName(event.target.value.slice(0, 42))} placeholder={vi ? "Tùy chọn" : "Optional"} className="form-control mt-1" /></label></div><div className="col-12 col-sm-6"><label className="form-label">{vi ? "Nền" : "Background"}<input aria-label={vi ? "Màu nền PNG" : "PNG background color"} type="color" value={pngBackground} onChange={(event) => setPngBackground(event.target.value)} className="form-control form-control-color mt-1" /></label></div></div></div></div></div></div>
      {openingPhase && <div className="alert alert-secondary mt-3"><strong>{vi ? "Opening:" : "Opening:"}</strong> {xxxxcrossSlots ? "XXXXCross · Full F2L" : xxxcrossSlots ? `XXXCross · ${xxxcrossSlots.join("+")}` : xxcrossSlots ? `XXCross · ${xxcrossSlots.join("+")}` : xcrossSlot ? `XCross · ${xcrossSlot}` : "Cross"}</div>}
      <div className="accordion mt-3" id="cfop-phase-details"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#cfop-phase-details-body" aria-expanded="true" aria-controls="cfop-phase-details-body">{vi ? `Chi tiết ${result.phases.length} phase` : `${result.phases.length} phase details`}</button></h3><div id="cfop-phase-details-body" className="accordion-collapse collapse show"><div className="accordion-body"><div className="list-group">{result.phases.map((phase, index) => <CFOPPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} cursor={cursor} onSelect={onSelectPhase} onSelectMove={onSelectMove} />)}</div></div></div></div></div>
    </section>
  );
}

function CFOPPhaseRow({ phase, index, language, selected, cursor, onSelect, onSelectMove }: { phase: SolverResult["phases"][number]; index: number; language: "vi" | "en"; selected: boolean; cursor: number; onSelect: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const vi = language === "vi";
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  const compactName = phase.name.startsWith("xxxxcross") ? "XXXXCross" : phase.name.startsWith("xxxcross") ? "XXXCross" : phase.name.startsWith("xxcross") ? "XXCross" : phase.name.startsWith("xcross") ? "XCross" : phase.name.startsWith("f2l_") ? `F2L · ${phase.name.slice(4)}` : phase.name.toUpperCase();
  return <article className={selected ? "list-group-item active" : "list-group-item"}><div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"}>{String(index + 1).padStart(2, "0")}</button><button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-link text-white text-start flex-grow-1 p-0" : "btn btn-link text-body text-start flex-grow-1 p-0"}><strong>{compactName}</strong><small className="d-block">{phase.moves.length} {vi ? "nước" : "moves"}{phase.case_id && phase.case_id !== "solved" ? " · " + phase.case_id : ""}</small></button><span className={invariantOK ? (selected ? "badge text-bg-light" : "badge text-bg-success") : "badge text-bg-danger"} title={studyNote}>{invariantOK ? "✓" : "!"}</span><a href={lessonUrl} target="_blank" rel="noreferrer" className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"} aria-label={vi ? "Mở bài học" : "Open lesson"}><Info className="fs-5" /></a><button type="button" onClick={() => navigator.clipboard?.writeText(notation)} className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"} aria-label={vi ? "Sao chép thuật toán" : "Copy algorithm"}><ClipboardCopy className="fs-5" /></button></div><code className="d-block text-break mt-2">{notation}</code>{phase.moves.length > 0 && <div className="btn-group flex-wrap mt-2" role="group">{phase.moves.map((move, moveIndex) => { const movePosition = phase.start + moveIndex + 1; return <button key={`${phase.name}-${movePosition}-${move}`} type="button" onClick={() => onSelectMove(movePosition)} className={cursor === movePosition ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{move}</button>; })}</div>}</article>;
}
