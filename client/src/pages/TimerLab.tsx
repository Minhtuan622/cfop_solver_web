/**
 * Xưởng Cơ Khí Tốc Độ — Timer Lab chia hai apparatus rõ ràng: timer competition và study bay Last Layer.
 * Competition giữ scramble/inspection/history; Study bay dùng score-strip, mint progress và case-first repetition.
 */
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Dices,
  Eye,
  EyeOff,
  ImageDown,
  Play,
  Timer,
} from "@/components/ui/Icon";
import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CubeNet } from "@/components/common/CubeNet";
import {
  CUBE_COLORS,
  CUBE_FALLBACK_COLOR,
} from "@/features/puzzle-3d/lib/cubeColors";
import {
  exportPalette,
  type ExportPalette,
} from "@/features/timer/lib/exportPalette";
import { PuzzleScramblePreview } from "@/components/common/PuzzleScramblePreview";
import { LastLayerStudyLab } from "@/features/last-layer";
import { MoveComposer } from "@/components/common/MoveComposer";
import {
  SolveTimer,
  type TimerCompletion,
} from "@/components/common/SolveTimer";
import { useBluetoothTimer } from "@/features/timer/useBluetoothTimer";
import { BluetoothTimerBar } from "@/features/timer/components/BluetoothTimerBar";
import { BluetoothTimerHero } from "@/features/timer/components/BluetoothTimerHero";
import {
  SOLVED_FAST_STATE,
  stateFromScramble,
  validateRecordedSolution,
} from "@/lib/fastCube";
import {
  detectPersonalRecords,
  metricEvidence,
  type PersonalRecord,
  type TimerMetricKey,
} from "@/lib/timerRecords";
import {
  TIMER_EVENTS,
  filterTimerEventEntries,
  generateTimerScramble,
  isThreeByThreeEvent,
  normalizeTimerEventId,
  timerEventLabel,
  timerPreviewPuzzleId,
  type TimerEventId,
} from "@/lib/timerEvents";
import {
  formatMultiBlindTime,
  multiBlindResult,
  multiBlindTimeLimitMs,
} from "@/lib/multiBlind";
import {
  phaseTpsFromSolution,
  progressSeries,
  solutionEfficiency,
  splitSummary,
  TIMER_AVERAGE_SIZES,
} from "@/lib/timerAnalysis";
import {
  wcaTimerComparison,
  type WcaTimerComparisonRow,
} from "@/lib/wcaTimerComparison";
import { trpc } from "@/lib/trpc";
import {
  readStoredJson,
  readStoredValue,
  writeStoredValue,
} from "@/lib/browserStorage";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import {
  addSolveHistory,
  deleteSolveHistory,
  effectiveTime,
  formatSolveResult,
  formatSolveTime,
  initialStateFor,
  readSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
  type SplitPhase,
  type SolveSource,
  updateSolveHistory,
} from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WordParams } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { MetricButton } from "@/features/timer";
import { IconButton, PageHeader, StatTile } from "@/components/ui/StudioUI";
import { PanelHeader, RoundButton } from "@/components/ui/DesignSystem";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

import { buttonClass } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";

const AVERAGES = TIMER_AVERAGE_SIZES;
const SPEED_PHASES: SplitPhase[] = ["Cross", "F2L", "OLL", "PLL"];
type TimerWcaRecord = {
  eventId: string;
  singleCentiseconds: number | null;
  averageCentiseconds: number | null;
};
/** Resolves a `namespace.key` entry of the shared bilingual dictionary. */
type Translate = (key: string, params?: WordParams) => string;

function canvasLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
function drawMetricCube(
  context: CanvasRenderingContext2D,
  state: string,
  x: number,
  y: number,
  tile: number,
  palette: ExportPalette
) {
  const safe = state.length === 54 ? state : SOLVED_FAST_STATE;
  const faces = ["U", "R", "F", "D", "L", "B"] as const;
  const positions = {
    U: [1, 0],
    L: [0, 1],
    F: [1, 1],
    R: [2, 1],
    B: [3, 1],
    D: [1, 2],
  } as const;
  const offsets = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 } as const;
  context.fillStyle = palette.ink;
  context.fillRect(x - 8, y - 8, tile * 12 + 16, tile * 9 + 16);
  for (const face of faces) {
    const [column, row] = positions[face];
    for (let index = 0; index < 9; index += 1) {
      const sticker = safe[offsets[face] + index] ?? "U";
      const sx = x + (column * 3 + (index % 3)) * tile;
      const sy = y + (row * 3 + Math.floor(index / 3)) * tile;
      context.fillStyle = CUBE_COLORS[sticker] ?? CUBE_FALLBACK_COLOR;
      context.fillRect(sx, sy, tile - 1, tile - 1);
    }
  }
}
/** Dựng ảnh Ao5 để chia sẻ: mỗi lượt một hàng, kèm scramble và CubeNet. */
function exportAo5Image(
  entries: SolveHistoryEntry[],
  exclusions: Record<string, "best" | "worst">,
  value: number | null | undefined,
  t: Translate,
  language: "vi" | "en"
) {
  const width = 3200;
  const headerHeight = 320;
  const rowHeight = 330;
  const footerHeight = 150;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = headerHeight + entries.length * rowHeight + footerHeight;
  const context = canvas.getContext("2d");
  if (!context) return;
  const palette = exportPalette();
  const margin = 100;
  const cubeX = 690;
  const scrambleX = 1120;
  const scrambleWidth = width - scrambleX - margin;
  const dateLocale = language === "vi" ? "vi-VN" : "en-US";
  context.fillStyle = palette.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  context.fillStyle = palette.ink;
  context.fillRect(0, 0, width, 22);
  context.fillRect(margin, 62, width - margin * 2, 184);
  context.fillStyle = palette.accent;
  context.font = "700 32px monospace";
  context.fillText("CFOP SOLVER STUDIO · TIMER RECORD", 148, 118);
  context.fillStyle = palette.paper;
  context.font = "800 84px monospace";
  context.fillText(
    `AO5 · ${value == null ? "DNF" : formatSolveTime(value)}`,
    148,
    204
  );
  context.fillStyle = palette.onAccent;
  context.font = "600 24px monospace";
  context.fillText(t("timer.exportSheetNote"), 150, 236);
  entries.forEach((entry, index) => {
    const top = headerHeight + index * rowHeight;
    const exclusion = exclusions[entry.id];
    context.fillStyle = index % 2 ? palette.rowAlt : palette.row;
    context.fillRect(margin, top + 12, width - margin * 2, rowHeight - 24);
    context.strokeStyle =
      exclusion === "best"
        ? palette.accent
        : exclusion === "worst"
          ? palette.worst
          : palette.rule;
    context.lineWidth = exclusion ? 7 : 3;
    context.strokeRect(margin, top + 12, width - margin * 2, rowHeight - 24);
    context.fillStyle =
      exclusion === "best"
        ? palette.accentInk
        : exclusion === "worst"
          ? palette.worstInk
          : palette.ink;
    context.font = "900 34px monospace";
    context.fillText(String(index + 1).padStart(2, "0"), 150, top + 82);
    context.font = "900 58px monospace";
    context.fillText(formatSolveResult(entry), 150, top + 153);
    context.font = "700 19px monospace";
    context.fillStyle = palette.muted;
    context.fillText(
      new Date(entry.createdAt).toLocaleDateString(dateLocale),
      152,
      top + 196
    );
    context.fillStyle =
      exclusion === "best"
        ? palette.accentInk
        : exclusion === "worst"
          ? palette.worstInk
          : palette.muted;
    context.font = "700 18px monospace";
    context.fillText(
      exclusion
        ? exclusion === "best"
          ? t("timer.exportBest")
          : t("timer.exportWorst")
        : t("timer.exportCounted"),
      150,
      top + 244
    );
    drawMetricCube(
      context,
      safeScrambleState(entry.input),
      cubeX,
      top + 26,
      28,
      palette
    );
    context.fillStyle = palette.label;
    context.font = "800 20px monospace";
    context.fillText("SCRAMBLE", scrambleX, top + 64);
    context.fillStyle = palette.ink;
    context.font = "900 36px monospace";
    const scramble = canvasLines(context, entry.input, scrambleWidth).slice(
      0,
      2
    );
    scramble.forEach((line, lineIndex) =>
      context.fillText(line, scrambleX, top + 126 + lineIndex * 50)
    );
    context.fillStyle = palette.muted;
    context.font = "700 19px monospace";
    context.fillText(
      entry.phaseSplits.length
        ? splitSummary(entry)
        : t("timer.exportNoSplits"),
      scrambleX,
      top + 245
    );
    if (entry.note) {
      context.font = "600 18px monospace";
      context.fillText(
        `${t("timer.exportNote")}: ${entry.note.slice(0, 132)}`,
        scrambleX,
        top + 280
      );
    }
  });
  context.fillStyle = palette.muted;
  context.font = "600 21px monospace";
  context.fillText(t("timer.exportFooter"), margin, canvas.height - 54);
  const link = document.createElement("a");
  link.download = `cfop-ao5-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
function safeScrambleState(scramble: string) {
  try {
    return stateFromScramble(scramble);
  } catch {
    return SOLVED_FAST_STATE;
  }
}
export default function TimerLab() {
  const { language, t } = useLanguage();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });
  const wcaProfileQuery = trpc.cfopAccount.wca.profile.useQuery(undefined, {
    enabled: Boolean(accountQuery.data?.wcaId),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const [eventId, setEventId] = useState<TimerEventId>(() =>
    normalizeTimerEventId(readStoredValue("cfop-timer-event"))
  );
  const [scramble, setScramble] = useState(randomThreeByThreeScramble);
  const [scrambleLoading, setScrambleLoading] = useState(false);
  const [scrambleError, setScrambleError] = useState("");
  const [entries, setEntries] = useState<SolveHistoryEntry[]>(() =>
    readSolveHistory()
  );
  const [timerVersion, setTimerVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const [latestRecorded, setLatestRecorded] =
    useState<SolveHistoryEntry | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<TimerMetricKey | null>(
    null
  );
  const [copiedScrambleId, setCopiedScrambleId] = useState<string | null>(null);
  const [showMetricCubeNets, setShowMetricCubeNets] = useState(
    () => readStoredValue("cfop-metric-cubenets") !== "off"
  );
  const [expandedMetricCube, setExpandedMetricCube] =
    useState<SolveHistoryEntry | null>(null);
  const [inspectionSound] = useState(
    () => readStoredValue("cfop-inspection-sound") !== "off"
  );
  const [spaceSplits] = useState(
    () => readStoredValue("cfop-space-splits") !== "off"
  );
  const [scrambleSize] = useState<"sm" | "md" | "lg">(() => {
    const stored = readStoredValue("cfop-scramble-size");
    return stored === "sm" || stored === "lg" ? stored : "md";
  });
  const [multiBlindAttempted, setMultiBlindAttempted] = useState(2);
  const [multiBlindSolved, setMultiBlindSolved] = useState(0);
  const [multiBlindScrambles, setMultiBlindScrambles] = useState<string[]>([]);
  const [pendingMultiBlind, setPendingMultiBlind] =
    useState<TimerCompletion | null>(null);
  const [editing, setEditing] = useState<SolveHistoryEntry | null>(null);
  const [editSeconds, setEditSeconds] = useState("");
  const [editPenalty, setEditPenalty] = useState<SolvePenalty>("none");
  const [editSolution, setEditSolution] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editTags, setEditTags] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SolveHistoryEntry | null>(
    null
  );
  const [tagFilter, setTagFilter] = useState("all");
  const [noteQuery, setNoteQuery] = useState("");
  const [replay, setReplay] = useState<SolveHistoryEntry | null>(null);
  const [replayRunId, setReplayRunId] = useState(0);
  const [location] = useLocation();
  const labTab: "timer" | "study" =
    location.split("?")[0] === "/study" ? "study" : "timer";
  const [solutionError, setSolutionError] = useState("");
  const scrambleRequest = useRef(0);

  const isThreeByThree = isThreeByThreeEvent(eventId);
  const isMultiBlind = eventId === "333mbf";
  const multiBlindReady =
    multiBlindScrambles.length === multiBlindAttempted &&
    multiBlindScrambles.length > 0;
  const eventLabel = timerEventLabel(eventId, language);
  const eventEntries = useMemo(
    () => filterTimerEventEntries(entries, eventId),
    [entries, eventId]
  );
  const visibleEntries = useMemo(() => {
    const needle = noteQuery.trim().toLocaleLowerCase();
    return eventEntries.filter(
      entry =>
        (tagFilter === "all" || entry.tags.includes(tagFilter)) &&
        (!needle ||
          entry.note.toLocaleLowerCase().includes(needle) ||
          entry.tags.some(tag => tag.toLocaleLowerCase().includes(needle)))
    );
  }, [eventEntries, noteQuery, tagFilter]);
  const progress = useMemo(
    () => progressSeries(visibleEntries),
    [visibleEntries]
  );
  const pb = useMemo(() => {
    if (isMultiBlind) return metricEvidence(visibleEntries, "pb").value;
    const values = visibleEntries
      .map(effectiveTime)
      .filter((value): value is number => value !== null);
    return values.length ? Math.min(...values) : undefined;
  }, [isMultiBlind, visibleEntries]);
  const averages = useMemo(
    () =>
      isMultiBlind
        ? (Object.fromEntries(
            AVERAGES.map(size => [`ao${size}`, undefined])
          ) as Record<
            `ao${(typeof AVERAGES)[number]}`,
            number | null | undefined
          >)
        : (Object.fromEntries(
            AVERAGES.map(size => [`ao${size}`, progress.at(-1)?.[`ao${size}`]])
          ) as Record<
            `ao${(typeof AVERAGES)[number]}`,
            number | null | undefined
          >),
    [isMultiBlind, progress]
  );
  const selectedMetricDetail = useMemo(
    () =>
      selectedMetric ? metricEvidence(visibleEntries, selectedMetric) : null,
    [selectedMetric, visibleEntries]
  );
  const latestSolution = useMemo(
    () => visibleEntries.find(entry => entry.solution.trim()),
    [visibleEntries]
  );
  const latestEfficiency = useMemo(
    () => (latestSolution ? solutionEfficiency(latestSolution) : null),
    [latestSolution]
  );
  const replayText = replay?.solution ?? "";
  const replayTps =
    replay && replay.elapsedMs > 0
      ? replay.moves / (replay.elapsedMs / 1000)
      : 0;
  const phaseTps = useMemo(
    () => (replay ? phaseTpsFromSolution(replay.solution) : []),
    [replay]
  );
  const timerWcaProfile = wcaProfileQuery.data as
    { personalRecords?: TimerWcaRecord[] } | undefined;
  const eventWcaRecord = useMemo(
    () =>
      timerWcaProfile?.personalRecords?.find(
        record => record.eventId === eventId
      ) ?? null,
    [eventId, timerWcaProfile]
  );
  const eventWcaRows = useMemo(
    () =>
      wcaTimerComparison(
        eventEntries,
        eventWcaRecord ?? {
          singleCentiseconds: null,
          averageCentiseconds: null,
        },
        eventId
      ),
    [eventEntries, eventId, eventWcaRecord]
  );

  // Timer quick controls are session-only overrides; long-lived defaults are owned by Settings.
  useEffect(() => {
    writeStoredValue("cfop-metric-cubenets", showMetricCubeNets ? "on" : "off");
  }, [showMetricCubeNets]);
  useEffect(() => {
    document.documentElement.dataset.speedSplit = spaceSplits ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.speedSplit;
    };
  }, [spaceSplits]);

  // Ô số liệu chưa đủ dữ liệu hiện dấu gạch dài: "--:--" trông như lỗi
  // hiển thị chứ không phải một giá trị.
  const metric = (value: number | null | undefined) =>
    value === undefined
      ? "—"
      : value === null
        ? "DNF"
        : formatSolveTime(value);
  const metricLabel = (key: TimerMetricKey) =>
    key === "pb"
      ? t("timer.pb")
      : key === "total"
        ? t("timer.total")
        : key.toUpperCase();
  const copyMetricScramble = (entry: SolveHistoryEntry) => {
    const complete = () => {
      setCopiedScrambleId(entry.id);
      window.setTimeout(
        () =>
          setCopiedScrambleId(current =>
            current === entry.id ? null : current
          ),
        1800
      );
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard
        .writeText(entry.input)
        .then(complete)
        .catch(() => undefined);
      return;
    }
    const fallback = document.createElement("textarea");
    fallback.value = entry.input;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    complete();
  };
  const recordLabel = (record: PersonalRecord) =>
    record.key === "single" ? "PB SINGLE" : record.key.toUpperCase();
  const announceRecords = (records: PersonalRecord[]) => {
    if (!records.length) return;
    toast.success(t("timer.recordTitle"), {
      description: records
        .map(
          record =>
            `${isMultiBlind ? t("timer.newScore") : recordLabel(record)} ${isMultiBlind ? `${record.value}\u0111` : formatSolveTime(record.value)}`
        )
        .join(" \u00b7 "),
      duration: 5600,
    });
  };
  const generateMultiBlindScrambles = async (
    count = multiBlindAttempted,
    clearSaved = true
  ) => {
    const request = ++scrambleRequest.current;
    setScrambleError("");
    setScramble("");
    setMultiBlindScrambles([]);
    setScrambleLoading(true);
    if (clearSaved) setTimerVersion(value => value + 1);
    try {
      const scrambles = await Promise.all(
        Array.from({ length: count }, () => generateTimerScramble("333"))
      );
      if (request === scrambleRequest.current) {
        setMultiBlindScrambles(scrambles);
        setScramble(scrambles[0] ?? "");
      }
    } catch {
      if (request === scrambleRequest.current)
        setScrambleError(t("timer.multiBlindScrambleFailed"));
    } finally {
      if (request === scrambleRequest.current) setScrambleLoading(false);
    }
    if (clearSaved) setSaved(false);
  };
  const nextScramble = async (clearSaved = true, selectedEvent = eventId) => {
    if (selectedEvent === "333mbf") {
      await generateMultiBlindScrambles(multiBlindAttempted, clearSaved);
      return;
    }
    const request = ++scrambleRequest.current;
    setScrambleError("");
    if (clearSaved) setTimerVersion(value => value + 1);
    if (request === scrambleRequest.current && clearSaved) {
      setScramble("");
      setScrambleLoading(true);
    }
    try {
      const next = await generateTimerScramble(selectedEvent);
      if (request === scrambleRequest.current) setScramble(next);
    } catch {
      if (request === scrambleRequest.current)
        setScrambleError(t("timer.scrambleFailed"));
    } finally {
      if (request === scrambleRequest.current && clearSaved)
        setScrambleLoading(false);
    }
    if (clearSaved) setSaved(false);
  };
  const selectTimerEvent = (nextEventId: TimerEventId) => {
    setEventId(nextEventId);
    writeStoredValue("cfop-timer-event", nextEventId);
    setPendingMultiBlind(null);
    setMultiBlindScrambles([]);
    setSelectedMetric(null);
    setLatestRecorded(null);
    setTagFilter("all");
    setNoteQuery("");
    void nextScramble(true, nextEventId);
  };
  const practiceSplitPhases: readonly SplitPhase[] = isThreeByThree
    ? SPEED_PHASES
    : [];
  const bluetooth = useBluetoothTimer();
  const bleTimer = !isMultiBlind && bluetooth.status === "connected" ? bluetooth.timer : null;
  const recordSolve = (completion: TimerCompletion, source: SolveSource = "manual") => {
    if (isMultiBlind) {
      setPendingMultiBlind(completion);
      setMultiBlindSolved(0);
      setSaved(false);
      return;
    }
    const item = addSolveHistory({
      elapsedMs: completion.elapsedMs,
      inspectionMs: completion.inspectionMs,
      penalty: completion.automaticPenalty,
      phaseSplits: completion.phaseSplits,
      input: scramble,
      inputKind: "scramble",
      moves: 0,
      tags: [],
      eventId,
      source,
    });
    announceRecords(detectPersonalRecords(eventEntries, item));
    setEntries(previous => [item, ...previous].slice(0, 500));
    setLatestRecorded(item);
    setSaved(true);
    void nextScramble(false);
  };
  const saveMultiBlind = () => {
    if (!pendingMultiBlind || !multiBlindReady) return;
    const multiBlind = {
      attempted: multiBlindAttempted,
      solved: Math.min(multiBlindAttempted, Math.max(0, multiBlindSolved)),
    };
    const result = multiBlindResult(multiBlind, pendingMultiBlind.elapsedMs);
    const penalty: SolvePenalty =
      pendingMultiBlind.automaticPenalty === "DNF" || !result.valid
        ? "DNF"
        : pendingMultiBlind.automaticPenalty;
    const item = addSolveHistory({
      elapsedMs: pendingMultiBlind.elapsedMs,
      inspectionMs: pendingMultiBlind.inspectionMs,
      penalty,
      phaseSplits: [],
      input: multiBlindScrambles[0] ?? scramble,
      inputKind: "scramble",
      moves: 0,
      tags: [],
      eventId,
      multiBlind,
      multiBlindScrambles,
    });
    announceRecords(detectPersonalRecords(eventEntries, item));
    setEntries(previous => [item, ...previous].slice(0, 500));
    setLatestRecorded(item);
    setPendingMultiBlind(null);
    setSaved(true);
    void nextScramble(false);
  };
  useEffect(() => {
    void nextScramble(false);
  }, []);
  const openEdit = (entry: SolveHistoryEntry) => {
    setEditing(entry);
    setEditSeconds((entry.elapsedMs / 1000).toFixed(2));
    setEditPenalty(entry.penalty);
    setEditSolution(entry.solution);
    setEditNote(entry.note);
    setEditTags(entry.tags.join(", "));
    setSolutionError("");
  };
  const saveEdit = () => {
    if (!editing) return;
    const seconds = Number(editSeconds);
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const validation = validateRecordedSolution(
      initialStateFor(editing),
      editSolution
    );
    if (!validation.valid && validation.error !== "empty") {
      setSolutionError(
        validation.error === "unfinished"
          ? t("timer.unfinishedSolution")
          : t("timer.unsupportedNotation")
      );
      return;
    }
    setEntries(
      updateSolveHistory(editing.id, {
        elapsedMs: Math.round(seconds * 1000),
        penalty: editPenalty,
        solution: validation.normalized,
        moves: validation.moves.length,
        note: editNote.trim(),
        tags: editTags
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean),
      })
    );
    setSolutionError("");
    setEditing(null);
  };
  const openReplay = (entry: SolveHistoryEntry) => {
    const validation = validateRecordedSolution(
      initialStateFor(entry),
      entry.solution
    );
    if (!validation.valid || !validation.moves.length) return;
    setReplay({ ...entry, solution: validation.normalized });
    setReplayRunId(0);
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-12">
        {labTab === "study" ? (
          <LastLayerStudyLab language={language} />
        ) : (
          <>
            <PageHeader
              eyebrow={t("timer.eyebrow")}
              title={t("timer.title")}
              description={t("timer.subtitle")}
              actions={
                <Link
                  href="/study"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface-2 text-ink hover:bg-surface-3"
                >
                  <BookOpenCheck className="mr-2" />
                  {t("timer.openStudy")}
                </Link>
              }
            />
            <section className="grid grid-cols-12 gap-6">
              <section className="col-span-12 xl:col-span-8">
                <div className="rounded-card bg-surface">
                  <div className="p-5 sm:p-6 p-6">
                    <div className="grid grid-cols-12 gap-2 items-end mb-2">
                      <label className="col-span-12 sm:col-span-6">
                        <span className="mb-1.5 block text-sm font-medium text-ink text-muted mb-1">
                          {t("timer.puzzle")}
                        </span>
                        <Select
                          className="rounded-full px-3.5 py-2.5"
                          value={eventId}
                          onChange={event =>
                            selectTimerEvent(event.target.value as TimerEventId)
                          }
                        >
                          {TIMER_EVENTS.map(event => (
                            <option key={event.id} value={event.id}>
                              {timerEventLabel(event.id, language)}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <div className="col-span-12 sm:col-span-6">
                        <div className="flex items-center gap-2">
                          <RoundButton
                            label={t("timer.newCase")}
                            icon={<Dices />}
                            disabled={scrambleLoading}
                            onClick={() => void nextScramble()}
                            title={t("timer.newCase")}
                          />
                          <RoundButton
                            label={t("timer.copy")}
                            icon={<ClipboardCheck />}
                            disabled={
                              (!isMultiBlind && !scramble) ||
                              (isMultiBlind && !multiBlindScrambles.length) ||
                              scrambleLoading
                            }
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                isMultiBlind
                                  ? multiBlindScrambles
                                      .map(
                                        (item, index) => `${index + 1}. ${item}`
                                      )
                                      .join("\n")
                                  : scramble
                              )
                            }
                            title={t("timer.copy")}
                          />
                        </div>
                      </div>
                    </div>
                    {isMultiBlind ? (
                      <MultiBlindScrambleList
                        scrambles={multiBlindScrambles}
                        loading={scrambleLoading}
                      />
                    ) : (
                      <p
                        className={
                          scrambleSize === "sm"
                            ? "break-words mb-4 text-sm"
                            : scrambleSize === "lg"
                              ? "break-words mb-4 text-2xl sm:text-3xl"
                              : "break-words mb-4 text-lg sm:text-xl"
                        }
                        aria-live="polite"
                      >
                        {scrambleLoading
                          ? t("timer.generating", { event: eventLabel })
                          : scramble}
                      </p>
                    )}
                    {scrambleError ? (
                      <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mb-4">
                        {scrambleError}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-12 gap-2 mt-1 items-stretch">
                      <div className="col-span-12 lg:col-span-7">
                        {isMultiBlind && (
                          <div className="rounded-card bg-surface bg-surface-2 mb-4">
                            <div className="p-5 sm:p-6">
                              <div className="flex flex-wrap justify-between items-center gap-2">
                                <label className="mb-1.5 block text-sm font-medium text-ink mb-0">
                                  {t("timer.multiBlindAttempted")}
                                  <input
                                    aria-label={t(
                                      "timer.multiBlindAttemptedAria"
                                    )}
                                    type="number"
                                    min="2"
                                    max="99"
                                    value={multiBlindAttempted}
                                    onChange={event => {
                                      setMultiBlindAttempted(
                                        Math.max(
                                          2,
                                          Math.min(
                                            99,
                                            Number(event.target.value) || 2
                                          )
                                        )
                                      );
                                      setMultiBlindScrambles([]);
                                      setScramble("");
                                    }}
                                    className="w-full rounded-field bg-surface px-3.5 py-2.5 text-sm text-ink transition placeholder:text-placeholder focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 rounded-lg px-3 py-1.5 text-xs mt-1 w-auto"
                                  />
                                </label>
                                <span className="text-sm text-muted">
                                  {t("timer.multiBlindLimit")}:{" "}
                                  {formatMultiBlindTime(
                                    multiBlindTimeLimitMs(multiBlindAttempted)
                                  )}
                                </span>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  type="button"

                                  disabled={scrambleLoading}
                                  onClick={() =>
                                    void generateMultiBlindScrambles()
                                  }
                                  aria-label={t("timer.multiBlindGenerateAria")}
                                >
                                  {t("timer.multiBlindGenerate", {
                                    count: multiBlindAttempted,
                                  })}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        {!isMultiBlind && (
                          <BluetoothTimerBar
                            status={bluetooth.status}
                            deviceName={bluetooth.deviceName}
                            errorKey={bluetooth.errorKey}
                            lostConnection={bluetooth.lostConnection}
                            onConnect={() => void bluetooth.connect()}
                            onDisconnect={bluetooth.disconnect}
                          />
                        )}
                        {scrambleLoading ? (
                          <div className="rounded-card bg-surface p-5 sm:p-6 animate-pulse text-center">
                            <span className="block h-3 rounded-full bg-surface-3 w-8/12 mx-auto" />
                            <span className="block h-3 rounded-full bg-surface-3 w-5/12 mx-auto mt-4" />
                          </div>
                        ) : isMultiBlind && !multiBlindReady ? (
                          <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mb-0">
                            {t("timer.multiBlindMissing")}
                          </div>
                        ) : bleTimer ? (
                          <BluetoothTimerHero
                            timer={bleTimer}
                            deviceName={bluetooth.deviceName ?? "GAN Timer"}
                            onDisconnect={bluetooth.disconnect}
                            onSolveComplete={elapsedMs =>
                              recordSolve(
                                {
                                  elapsedMs,
                                  inspectionMs: 0,
                                  automaticPenalty: "none",
                                  phaseSplits: [],
                                },
                                "bluetooth",
                              )
                            }
                          />
                        ) : (
                          <SolveTimer
                            key={timerVersion}
                            onComplete={recordSolve}
                            soundEnabled={inspectionSound}
                            splitEnabled={
                              !isMultiBlind && isThreeByThree && spaceSplits
                            }
                            splitPhases={
                              isMultiBlind ? [] : practiceSplitPhases
                            }
                          />
                        )}
                        {pendingMultiBlind && (
                          <MultiBlindResultCard
                            completion={pendingMultiBlind}
                            attempted={multiBlindAttempted}
                            solved={multiBlindSolved}
                            onSolvedChange={setMultiBlindSolved}
                            onSave={saveMultiBlind}
                          />
                        )}
                        {isThreeByThree && !isMultiBlind && spaceSplits && (
                          <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mt-4 mb-0">
                            {t("timer.splitHint")}
                          </div>
                        )}
                        {saved && (
                          <div className="rounded-panel px-4 py-3 text-sm bg-success-soft text-ink mt-4 mb-0">
                            {t("timer.saved")}
                          </div>
                        )}
                        {isThreeByThree &&
                          !isMultiBlind &&
                          saved &&
                          latestRecorded &&
                          !latestRecorded.solution.trim() && (
                            <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span>{t("timer.addSolutionHint")}</span>
                              <Button
                                variant="outline"
                                size="xs"
                                className="shrink-0"
                                type="button"
                                onClick={() => openEdit(latestRecorded)}
                              >
                                {t("timer.addSolution")}
                              </Button>
                            </div>
                          )}
                      </div>
                      <div className="col-span-12 lg:col-span-5">
                        {!isMultiBlind &&
                          timerPreviewPuzzleId(eventId) &&
                          scramble &&
                          !scrambleLoading ? (
                          <div
                            className={
                              scrambleSize === "sm"
                                ? "h-full min-h-[12rem]"
                                : scrambleSize === "lg"
                                  ? "h-full min-h-[24rem]"
                                  : "h-full min-h-[18rem]"
                            }
                          >
                            <PuzzleScramblePreview
                              eventId={eventId}
                              scramble={scramble}
                              language={language}
                            />
                          </div>
                        ) : (
                          <div className="rounded-card bg-surface p-5 sm:p-6 h-full flex justify-center text-center">
                            <Timer className="text-4xl text-muted mb-4" />
                            <p className="font-semibold mb-1">{eventLabel}</p>
                            <p className="text-sm text-muted mb-0">
                              {isMultiBlind
                                ? t("timer.multiBlindHint")
                                : t("timer.eventHint")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <aside
                className="col-span-12 xl:col-span-4"
                aria-label={t("timer.stats")}
              >
                <div className="rounded-card bg-surface h-full">
                  <div className="p-5 sm:p-6">
                    <PanelHeader
                      icon={<BarChart3 className="text-lg" />}
                      title={t("timer.summary")}
                      actions={
                        <span className="text-sm text-muted">
                          {visibleEntries.length} {t("timer.total")}
                        </span>
                      }
                    />
                    <div className="grid grid-cols-12 gap-2 mt-2">
                      <div className="col-span-12 sm:col-span-6">
                        <MetricButton
                          label={
                            isMultiBlind ? t("timer.bestScore") : t("timer.pb")
                          }
                          value={metric(pb)}
                          enabled={pb !== undefined}
                          onClick={() => setSelectedMetric("pb")}
                        />
                      </div>
                      {!isMultiBlind && (
                        <>
                          <div className="col-span-12 sm:col-span-6">
                            <MetricButton
                              label="AO5"
                              value={metric(averages.ao5)}
                              enabled={averages.ao5 !== undefined}
                              onClick={() => setSelectedMetric("ao5")}
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-6">
                            <MetricButton
                              label="AO12"
                              value={metric(averages.ao12)}
                              enabled={averages.ao12 !== undefined}
                              onClick={() => setSelectedMetric("ao12")}
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-6">
                            <MetricButton
                              label="AO50"
                              value={metric(averages.ao50)}
                              enabled={averages.ao50 !== undefined}
                              onClick={() => setSelectedMetric("ao50")}
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-6">
                            <MetricButton
                              label="AO100"
                              value={metric(averages.ao100)}
                              enabled={averages.ao100 !== undefined}
                              onClick={() => setSelectedMetric("ao100")}
                            />
                          </div>
                        </>
                      )}
                      <div className="col-span-12 sm:col-span-6">
                        <MetricButton
                          label={t("timer.total")}
                          value={String(visibleEntries.length)}
                          enabled={visibleEntries.length > 0}
                          onClick={() => setSelectedMetric("total")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {!isMultiBlind && (
                <section className="col-span-12">
                  <EventProgressCard
                    eventLabel={eventLabel}
                    entries={eventEntries}
                    progress={progress}
                  />
                </section>
              )}
              {!isMultiBlind && (
                <section className="col-span-12">
                  <EventWcaComparisonCard
                    eventId={eventId}
                    eventLabel={eventLabel}
                    rows={eventWcaRows}
                    hasWcaId={Boolean(accountQuery.data?.wcaId)}
                    loading={wcaProfileQuery.isLoading}
                    unavailable={wcaProfileQuery.isError}
                    hasRecord={Boolean(eventWcaRecord)}
                  />
                </section>
              )}

              <section
                className="col-span-12 mt-6"
                aria-labelledby="timer-analytics-heading"
              >
                <h2
                  id="timer-analytics-heading"
                  className="text-base font-semibold tracking-tight mb-0"
                >
                  {t("timer.analyticsTitle")}
                </h2>
                <div className="mt-6 flex flex-col gap-6">
                  <section className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-4 rounded-card bg-surface p-5 sm:p-6">
                      <h3 className="text-sm font-semibold tracking-tight">
                        {t("timer.stats")}
                      </h3>
                      <div className="grid grid-cols-12 gap-2 mt-6">
                        {(
                          [
                            [t("timer.pb"), metric(pb)],
                            ["AO5", metric(averages.ao5)],
                            ["AO12", metric(averages.ao12)],
                            ["AO50", metric(averages.ao50)],
                            ["AO100", metric(averages.ao100)],
                            [t("timer.total"), String(visibleEntries.length)],
                          ] as const
                        ).map(([label, value]) => (
                          // Hai ô mỗi hàng: ô hẹp (1/3 card) không đủ chỗ cho
                          // thời gian dài như "83:20.00", chữ sẽ tràn ra ngoài.
                          <div key={label} className="col-span-6">
                            <StatTile label={label} value={value} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 xl:col-span-8 rounded-card bg-surface p-5 sm:p-6">
                      <h3 className="text-sm font-semibold tracking-tight">
                        {t("timer.progress")}
                      </h3>
                      {visibleEntries.length ? (
                        <div className="h-72 mt-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progress}>
                              <XAxis
                                dataKey="solve"
                                type="number"
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tickFormatter={value =>
                                  `${(Number(value) / 1000).toFixed(0)}s`
                                }
                                axisLine={false}
                                tickLine={false}
                                width={56}
                              />
                              <Tooltip
                                formatter={value => [
                                  value == null
                                    ? "DNF"
                                    : `${(Number(value) / 1000).toFixed(2)}s`,
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="ao5"
                                stroke="var(--chart-1)"
                                strokeWidth={3}
                                dot={false}
                                connectNulls
                                name="Ao5"
                              />
                              <Line
                                type="monotone"
                                dataKey="ao12"
                                stroke="var(--chart-2)"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                                name="Ao12"
                              />
                              <Line
                                type="monotone"
                                dataKey="ao50"
                                stroke="var(--chart-3)"
                                strokeWidth={2}
                                strokeDasharray="5 3"
                                dot={false}
                                connectNulls
                                name="Ao50"
                              />
                              <Line
                                type="monotone"
                                dataKey="ao100"
                                stroke="var(--chart-4)"
                                strokeWidth={2}
                                strokeDasharray="2 4"
                                dot={false}
                                connectNulls
                                name="Ao100"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-6">
                          {t("timer.chartEmpty")}
                        </div>
                      )}
                    </div>
                  </section>



                  <section className="rounded-card bg-surface mt-6">
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap justify-between gap-2">
                        <h3 className="text-sm font-semibold tracking-tight mb-0">
                          {t("timer.efficiency")}
                        </h3>
                        {latestSolution && (
                          <span className="text-sm text-muted">
                            {new Date(
                              latestSolution.createdAt
                            ).toLocaleDateString(
                              language === "vi" ? "vi-VN" : "en-US"
                            )}
                          </span>
                        )}
                      </div>
                      {latestEfficiency ? (
                        <div className="grid grid-cols-12 gap-4 mt-1">
                          <div className="col-span-12 md:col-span-6">
                            <StatTile
                              label={t("timer.moves")}
                              value={String(latestEfficiency.moves)}
                              tone="dark"
                            />
                          </div>
                          <div className="col-span-12 md:col-span-6">
                            <StatTile
                              label={t("timer.tps")}
                              value={latestEfficiency.tps.toFixed(2)}
                              tone="dark"
                            />
                          </div>
                          <div className="col-span-12">
                            <StatTile
                              label="RATING"
                              value={latestEfficiency.label}
                              tone="dark"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
                          {t("timer.noSolutionToAnalyze")}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </section>
              <section className="col-span-12">
                <div className="rounded-card bg-surface">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 gap-2">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight mb-0">
                        {t("timer.recentTitle", { event: eventLabel })}
                      </h2>
                      <small className="text-muted">
                        {t("timer.recentHint")}
                      </small>
                    </div>
                    <Link
                      href="/history"
                      className={`${buttonClass("secondary", "sm")}`}
                    >
                      {t("timer.openHistory")}
                    </Link>
                  </div>
                  <div className="p-5 sm:p-6">
                    {eventEntries.length ? (
                      <div className="bg-transparent">
                        {eventEntries.slice(0, 5).map(item => (
                          <RecentTimerSolve key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mb-0">
                        {t("timer.noEventSolves", { event: eventLabel })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </section>

            <Dialog
              open={Boolean(selectedMetric)}
              onOpenChange={open => !open && setSelectedMetric(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <div>
                    <DialogTitle>
                      {t("timer.metricDetail")} ·{" "}
                      {selectedMetric ? metricLabel(selectedMetric) : "—"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedMetricDetail?.value === undefined
                        ? t("timer.metricNotEnough")
                        : selectedMetric === "total"
                          ? `${selectedMetricDetail.entries.length} ${t("timer.total").toLowerCase()}`
                          : metric(selectedMetricDetail?.value)}
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div
                      className="inline-flex flex-wrap items-center gap-1 text-xs"
                      role="group"
                    >
                      {isThreeByThree && (
                        <IconButton
                          label={
                            showMetricCubeNets
                              ? t("timer.hideCubeNet")
                              : t("timer.showCubeNet")
                          }
                          icon={
                            showMetricCubeNets ? (
                              <EyeOff className="text-base" />
                            ) : (
                              <Eye className="text-base" />
                            )
                          }
                          onClick={() => setShowMetricCubeNets(value => !value)}
                          className={`${buttonClass("secondary", "md")}`}
                        />
                      )}
                      {isThreeByThree &&
                        selectedMetric === "ao5" &&
                        selectedMetricDetail && (
                          <IconButton
                            label={t("timer.exportAo5")}
                            icon={<ImageDown className="text-base" />}
                            onClick={() =>
                              exportAo5Image(
                                selectedMetricDetail.entries,
                                selectedMetricDetail.exclusions,
                                selectedMetricDetail.value,
                                t,
                                language
                              )
                            }
                            className={`${buttonClass("primary", "md")}`}
                          />
                        )}
                    </div>
                    <span className="text-sm text-muted">
                      {selectedMetricDetail?.entries.length ?? 0}{" "}
                      {t("timer.solveCount", {
                        count: selectedMetricDetail?.entries.length ?? 0,
                      })}
                    </span>
                  </div>
                  {selectedMetric?.startsWith("ao") && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success">
                        {t("timer.bestDiscarded")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-danger text-on-danger">
                        {t("timer.worstDiscarded")}
                      </span>
                    </div>
                  )}
                  {selectedMetricDetail?.entries.length ? (
                    <div className="overflow-hidden rounded-panel bg-surface mt-4">
                      {selectedMetricDetail.entries.map(entry => (
                        <MetricDetailCard
                          key={entry.id}
                          entry={entry}
                          exclusion={selectedMetricDetail.exclusions[entry.id]}
                          showCubeNet={showMetricCubeNets}
                          copied={copiedScrambleId === entry.id}
                          onCopy={copyMetricScramble}
                          onExpand={setExpandedMetricCube}
                          onReplay={openReplay}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
                      {t("timer.noScrambleYet")}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setSelectedMetric(null)}
                  >
                    {t("timer.close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={Boolean(expandedMetricCube)}
              onOpenChange={open => !open && setExpandedMetricCube(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <div>
                    <DialogTitle>CubeNet · Scramble</DialogTitle>
                    <DialogDescription>
                      <span className="font-mono break-words">
                        {expandedMetricCube?.input}
                      </span>
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex justify-center">
                  {expandedMetricCube && (
                    <CubeNet
                      state={safeScrambleState(expandedMetricCube.input)}
                    />
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setExpandedMetricCube(null)}
                  >
                    {t("timer.close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={Boolean(editing)}
              onOpenChange={open => !open && setEditing(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <div>
                    <DialogTitle>{t("timer.edit")}</DialogTitle>
                    <DialogDescription>
                      <span className="font-mono break-words">
                        {editing?.input}
                      </span>
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-12 gap-4">
                    <label className="col-span-12 md:col-span-6">
                      <span className="mb-1.5 block text-sm font-medium text-ink">
                        {t("timer.base")}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editSeconds}
                        onChange={event => setEditSeconds(event.target.value)}
                      />
                    </label>
                    <label className="col-span-12 md:col-span-6">
                      <span className="mb-1.5 block text-sm font-medium text-ink">
                        {t("timer.penalty")}
                      </span>
                      <Select
                        value={editPenalty}
                        onChange={event =>
                          setEditPenalty(event.target.value as SolvePenalty)
                        }
                      >
                        <option value="none">{t("timer.noPenalty")}</option>
                        <option value="+2">{t("timer.plusTwo")}</option>
                        <option value="DNF">{t("timer.dnf")}</option>
                      </Select>
                    </label>
                    <div className="col-span-12">
                      <MoveComposer
                        value={editSolution}
                        onChange={value => {
                          setEditSolution(value);
                          if (solutionError) setSolutionError("");
                        }}
                        label={t("timer.solution")}
                        pasteLabel={t("timer.solutionHint")}
                      />
                    </div>
                    {solutionError && (
                      <div className="col-span-12">
                        <div
                          role="alert"
                          className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mb-0"
                        >
                          {solutionError}
                        </div>
                      </div>
                    )}
                    <label className="col-span-12">
                      <span className="mb-1.5 block text-sm font-medium text-ink">
                        {t("timer.note")}
                      </span>
                      <Textarea
                        value={editNote}
                        onChange={event => setEditNote(event.target.value)}
                        rows={3}
                      />
                    </label>
                    <label className="col-span-12">
                      <span className="mb-1.5 block text-sm font-medium text-ink">
                        {t("timer.tags")}
                      </span>
                      <Input
                        value={editTags}
                        onChange={event => setEditTags(event.target.value)}
                      />
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    {t("timer.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="button"
                    onClick={saveEdit}
                  >
                    {t("timer.save")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={Boolean(replay)}
              onOpenChange={open => {
                if (!open) {
                  setReplay(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <div>
                    <DialogTitle>{t("timer.playbackTitle")}</DialogTitle>
                    <DialogDescription>
                      <span className="font-mono break-words">
                        {replayText}
                      </span>
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  {replayText.trim() ? (
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 lg:col-span-7">
                        {replay?.inputKind === "scramble" ? (
                          <div className="min-h-[16rem] h-full rounded-card overflow-hidden">
                            <PuzzleScramblePreview
                              eventId={normalizeTimerEventId(replay?.eventId)}
                              scramble={replay?.input ?? ""}
                              language={language}
                              animationAlg={replayText}
                              animationRunId={replayRunId}
                            />
                          </div>
                        ) : (
                          <div className="rounded-card bg-surface h-full flex flex-col items-center justify-center text-center p-5 sm:p-6">
                            <Timer className="text-4xl text-muted mb-4" />
                            <p className="text-sm text-muted mb-0">
                              {t("timer.replayStateSolve")}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="col-span-12 lg:col-span-5">
                        <div className="rounded-card bg-surface h-full">
                          <div className="p-5 sm:p-6">
                            <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
                              {t("timer.moves")}
                            </p>
                            <p className="text-3xl font-bold tracking-tight sm:text-4xl font-mono">
                              {replay?.moves ?? 0}
                            </p>
                            <p className="text-sm text-muted">
                              {t("timer.tps")} {replayTps.toFixed(2)}
                            </p>
                            {replay?.phaseSplits.length ? (
                              <div className="mt-4">
                                <p className="text-sm font-semibold mb-1">
                                  {t("timer.splitTimes")}
                                </p>
                                <div className="grid grid-cols-12 gap-1">
                                  {replay.phaseSplits.map(split => (
                                    <div
                                      key={split.phase}
                                      className="col-span-6"
                                    >
                                      <span className="text-sm text-muted">
                                        {split.phase}{" "}
                                      </span>
                                      <strong className="text-sm">
                                        {(split.elapsedMs / 1000).toFixed(2)}s
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {phaseTps.length ? (
                              <div className="mt-4">
                                <p className="text-sm font-semibold mb-1">
                                  {t("timer.tpsByPhase")}
                                </p>
                                <div className="h-64">
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <BarChart data={phaseTps}>
                                      <XAxis
                                        dataKey="phase"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9 }}
                                      />
                                      <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9 }}
                                        width={24}
                                      />
                                      <Tooltip
                                        formatter={value => [
                                          `${Number(value).toFixed(2)} TPS`,
                                          t("timer.tps"),
                                        ]}
                                      />
                                      <Bar
                                        dataKey="tps"
                                        fill="var(--chart-1)"
                                        radius={[2, 2, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink py-2 mt-4 mb-0">
                                {t("timer.tpsEmpty")}
                              </div>
                            )}
                            <Button
                              variant="primary"
                              size="md"
                              className="w-full mt-4 gap-1"
                              type="button"
                              onClick={() => setReplayRunId(value => value + 1)}
                            >
                              <Play className="text-base mr-1" />
                              {t("timer.playSolution")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mb-0">
                      {t("timer.noSolution")}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setReplay(null)}
                  >
                    {t("timer.close")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={Boolean(deleteTarget)}
              onOpenChange={open => !open && setDeleteTarget(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <div>
                    <DialogTitle>{t("timer.deleteTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("timer.deleteDetail")}
                    </DialogDescription>
                  </div>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"

                    onClick={() => setDeleteTarget(null)}
                  >
                    {t("timer.cancel")}
                  </Button>
                  <Button
                    variant="dangerSolid"
                    size="md"
                    type="button"

                    onClick={() => {
                      if (deleteTarget)
                        setEntries(deleteSolveHistory(deleteTarget.id));
                      setDeleteTarget(null);
                    }}
                  >
                    {t("timer.remove")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

function EventProgressCard({
  eventLabel,
  entries,
  progress,
}: {
  eventLabel: string;
  entries: SolveHistoryEntry[];
  progress: ReturnType<typeof progressSeries>;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card bg-surface h-full">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight mb-1">
              {t("timer.eventProgress", { event: eventLabel })}
            </h2>
            <p className="text-sm text-muted mb-0">
              {t("timer.eventProgressHint")}
            </p>
          </div>
          <span className="text-sm text-muted">
            {t("timer.solveCount", { count: entries.length })}
          </span>
        </div>
        {entries.length ? (
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progress}>
                <XAxis dataKey="solve" axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={value =>
                    `${(Number(value) / 1000).toFixed(0)}s`
                  }
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={value => [
                    value == null ? "DNF" : formatSolveTime(Number(value)),
                    "",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="single"
                  stroke="var(--chart-6)"
                  strokeWidth={1.5}
                  dot={{ r: 2 }}
                  connectNulls
                  name="Single"
                />
                <Line
                  type="monotone"
                  dataKey="ao5"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={false}
                  connectNulls
                  name="Ao5"
                />
                <Line
                  type="monotone"
                  dataKey="ao12"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  name="Ao12"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mt-4 mb-0">
            {t("timer.firstSolveHint", { event: eventLabel })}
          </div>
        )}
      </div>
    </div>
  );
}

function wcaDeltaMessage(deltaMs: number | null, t: Translate) {
  if (deltaMs === null) return t("timer.wcaDeltaMissing");
  if (deltaMs === 0) return t("timer.wcaDeltaEqual");
  const difference = formatSolveTime(Math.abs(deltaMs));
  return deltaMs < 0
    ? t("timer.wcaTimerFaster", { value: difference })
    : t("timer.wcaOfficialFaster", { value: difference });
}

function EventWcaComparisonCard({
  eventId,
  eventLabel,
  rows,
  hasWcaId,
  loading,
  unavailable,
  hasRecord,
}: {
  eventId: TimerEventId;
  eventLabel: string;
  rows: WcaTimerComparisonRow[];
  hasWcaId: boolean;
  loading: boolean;
  unavailable: boolean;
  hasRecord: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card bg-surface">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight mb-1">
              {t("timer.wcaTitle", { event: eventLabel })}
            </h2>
            <p className="text-sm text-muted mb-0">{t("timer.wcaHint")}</p>
          </div>
          {hasWcaId ? (
            <Link
              href="/profile"
              className={`${buttonClass("secondary", "sm")}`}
            >
              {t("timer.wcaProfile")}
            </Link>
          ) : (
            <Link
              href="/profile"
              className={`${buttonClass("secondary", "sm")}`}
            >
              {t("timer.wcaLink")}
            </Link>
          )}
        </div>
        {!hasWcaId ? (
          <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
            {t("timer.wcaLinkHint")}
          </div>
        ) : loading ? (
          <div className="animate-pulse mt-4">
            <span className="block h-3 rounded-full bg-surface-3 w-8/12" />
            <span className="block h-3 rounded-full bg-surface-3 w-5/12 mt-2" />
          </div>
        ) : unavailable ? (
          <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mt-4 mb-0">
            {t("timer.wcaUnavailable")}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto mt-4">
              <table className="w-full text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:py-1.5 [&_td]:py-1.5 align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">{t("timer.wcaMetricColumn")}</th>
                    <th scope="col">Timer</th>
                    <th scope="col">WCA</th>
                    <th scope="col">{t("timer.wcaDeltaColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td>
                        {row.timerMs === null
                          ? "—"
                          : formatSolveTime(row.timerMs)}
                      </td>
                      <td>
                        {row.wcaMs === null ? "—" : formatSolveTime(row.wcaMs)}
                      </td>
                      <td
                        className={
                          row.deltaMs === null
                            ? "text-muted"
                            : row.deltaMs < 0
                              ? "text-success"
                              : row.deltaMs > 0
                                ? "text-primary"
                                : "text-muted"
                        }
                      >
                        {wcaDeltaMessage(row.deltaMs, t)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!hasRecord ? (
              <p className="text-sm text-muted mt-2 mb-0">
                {t("timer.wcaNoRecord", { event: eventLabel })}
              </p>
            ) : (
              <p className="text-sm text-muted mt-2 mb-0">
                {t("timer.wcaAo5Note")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecentTimerSolve({ item }: { item: SolveHistoryEntry }) {
  const { language } = useLanguage();
  return (
    <article className="block px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-4">
      <div>
        <strong className={item.penalty === "DNF" ? "text-danger" : ""}>
          {formatSolveResult(item)}
        </strong>
        <small className="block text-muted">
          {new Date(item.createdAt).toLocaleString(
            language === "vi" ? "vi-VN" : "en-US"
          )}
          {item.tags.length ? ` · ${item.tags.join(", ")}` : ""}
        </small>
      </div>
      <span className="font-mono text-sm break-words grow">{item.input}</span>
    </article>
  );
}
function MetricDetailCard({
  entry,
  exclusion,
  showCubeNet,
  copied,
  onCopy,
  onExpand,
  onReplay,
}: {
  entry: SolveHistoryEntry;
  exclusion?: "best" | "worst";
  showCubeNet: boolean;
  copied: boolean;
  onCopy: (entry: SolveHistoryEntry) => void;
  onExpand: (entry: SolveHistoryEntry) => void;
  onReplay: (entry: SolveHistoryEntry) => void;
}) {
  const { language, t } = useLanguage();
  const isThreeByThree = isThreeByThreeEvent(
    normalizeTimerEventId(entry.eventId)
  );
  const state = useMemo(() => safeScrambleState(entry.input), [entry.input]);
  const solution = useMemo(
    () =>
      isThreeByThree
        ? validateRecordedSolution(initialStateFor(entry), entry.solution)
        : null,
    [entry, isThreeByThree]
  );
  const canReplay = Boolean(solution?.valid && solution.moves.length > 0);
  return (
    <article className="block px-4 py-3 text-sm">
      <div className="grid grid-cols-12 gap-4 items-center">
        {isThreeByThree && showCubeNet && (
          <div className="col-span-12">
            <Button
              variant="secondary"
              size="xs"
              type="button"
              onClick={() => onExpand(entry)}
              aria-label={t("timer.enlargeCubeNet")}
            >
              <CubeNet state={state} compact />
            </Button>
          </div>
        )}
        <div className="col-span-12">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <strong className="text-lg">{formatSolveResult(entry)}</strong>
              <small className="block text-muted">
                {new Date(entry.createdAt).toLocaleString(
                  language === "vi" ? "vi-VN" : "en-US"
                )}
              </small>
            </div>
            <div className="flex flex-wrap gap-1">
              {entry.penalty !== "none" && (
                <span
                  className={
                    entry.penalty === "DNF"
                      ? "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-danger text-on-danger"
                      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-warning text-on-warning"
                  }
                >
                  {entry.penalty}
                </span>
              )}
              {entry.source === "bluetooth" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide text-ink">
                  BLE
                </span>
              )}
              {exclusion && (
                <span
                  className={
                    exclusion === "best"
                      ? "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success"
                      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-danger text-on-danger"
                  }
                >
                  {exclusion === "best"
                    ? t("timer.bestDiscarded")
                    : t("timer.worstDiscarded")}
                </span>
              )}
            </div>
          </div>
          <p className="font-mono break-words mt-2 mb-2">{entry.input}</p>
          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              label={
                copied ? t("timer.scrambleCopied") : t("timer.copyScramble")
              }
              icon={<ClipboardCheck className="text-lg" />}
              onClick={() => onCopy(entry)}
              className={`${buttonClass("secondary", "sm")}`}
            />
            {canReplay ? (
              <IconButton
                label={t("timer.playSolution")}
                icon={<Play className="text-lg" />}
                onClick={() => onReplay(entry)}
                className={`${buttonClass("secondary", "sm")}`}
              />
            ) : (
              <span className="text-sm text-muted">
                {isThreeByThree
                  ? t("timer.noSavedSolution")
                  : t("timer.replayOnlyThree")}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
function MultiBlindScrambleList({
  scrambles,
  loading,
}: {
  scrambles: string[];
  loading: boolean;
}) {
  const { t } = useLanguage();
  if (loading)
    return (
      <div className="animate-pulse mb-4">
        <span className="block h-3 rounded-full bg-surface-3 w-10/12" />
        <span className="block h-3 rounded-full bg-surface-3 w-8/12 mt-2" />
      </div>
    );
  if (!scrambles.length)
    return (
      <p className="text-sm text-muted mb-4">
        {t("timer.multiBlindPickCount")}
      </p>
    );
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold mb-2">
        {t("timer.multiBlindBundle", { count: scrambles.length })}
      </p>
      <ol className="overflow-hidden rounded-panel bg-surface list-decimal pl-6">
        {scrambles.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="block px-4 py-3 text-sm font-mono break-words"
          >
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
function MultiBlindResultCard({
  completion,
  attempted,
  solved,
  onSolvedChange,
  onSave,
}: {
  completion: TimerCompletion;
  attempted: number;
  solved: number;
  onSolvedChange: (value: number) => void;
  onSave: () => void;
}) {
  const { t } = useLanguage();
  const result = multiBlindResult({ attempted, solved }, completion.elapsedMs);
  return (
    <div className="rounded-card bg-surface mt-4">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-tight mb-1">
              {t("timer.multiBlindConfirm")}
            </p>
            <p className="text-sm text-muted mb-0">
              {t("timer.multiBlindScoreRule", {
                time: formatMultiBlindTime(completion.elapsedMs),
              })}
            </p>
          </div>
          <label className="mb-1.5 block text-sm font-medium text-ink mb-0">
            {t("timer.multiBlindSolved")}
            <input
              aria-label={t("timer.multiBlindSolvedAria")}
              type="number"
              min="0"
              max={attempted}
              value={solved}
              onChange={event =>
                onSolvedChange(
                  Math.min(
                    attempted,
                    Math.max(0, Number(event.target.value) || 0)
                  )
                )
              }
              className="w-full rounded-field bg-surface px-3.5 py-2.5 text-sm text-ink transition placeholder:text-placeholder focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 mt-1 w-auto"
            />
          </label>
        </div>
        <div
          className={
            result.valid
              ? "rounded-panel px-4 py-3 text-sm bg-success-soft text-ink mt-4 mb-4"
              : "rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mt-4 mb-4"
          }
        >
          {t("timer.multiBlindSummary", {
            solved: result.solved,
            attempted: result.attempted,
            score: result.score,
            unsolved: result.unsolved,
            limit: formatMultiBlindTime(result.timeLimitMs),
          })}
          {!result.valid ? t("timer.multiBlindDnf") : ""}
        </div>
        <Button variant="primary" size="md" type="button" onClick={onSave}>
          {t("timer.multiBlindSave")}
        </Button>
      </div>
    </div>
  );
}
