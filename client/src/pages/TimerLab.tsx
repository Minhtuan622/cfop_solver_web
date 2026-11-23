/**
 * Xưởng Cơ Khí Tốc Độ — Timer Lab chia hai apparatus rõ ràng: timer competition và study bay Last Layer.
 * Competition giữ scramble/inspection/history; Study bay dùng score-strip, mint progress và case-first repetition.
 */
import {
  BarChart3,
  BookOpenCheck,
  Calendar3,
  CircleGauge,
  ClipboardCheck,
  Dices,
  Eye,
  EyeOff,
  ImageDown,
  Sparkles,
  Timer,
  ChevronDown,
} from "@/components/ui/Icon";
import { Link, useLocation } from "wouter";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CubeNet } from "@/components/common/CubeNet";
import { PuzzleScramblePreview } from "@/components/common/PuzzleScramblePreview";
import { LastLayerStudyLab } from "@/features/last-layer";
import { dailyDigest } from "@/features/timer/lib/dailyDigest";
import { SolveTimer, type TimerCompletion } from "@/components/common/SolveTimer";
import { useBluetoothTimer } from "@/features/timer/useBluetoothTimer";
import { useSmartCube } from "@/features/timer/useSmartCube";
import { BluetoothTimerBar } from "@/features/timer/components/BluetoothTimerBar";
import { BluetoothTimerHero } from "@/features/timer/components/BluetoothTimerHero";
import { SmartCubeBar } from "@/features/timer/components/SmartCubeBar";
import { SmartCubeHero } from "@/features/timer/components/SmartCubeHero";
import { validateRecordedSolution } from "@/lib/fastCube";
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
import { formatMultiBlindTime, multiBlindResult, multiBlindTimeLimitMs } from "@/lib/multiBlind";
import {
  phaseTpsFromSolution,
  progressSeries,
  solutionEfficiency,
  TIMER_AVERAGE_SIZES,
} from "@/features/timer/lib/timerAnalysis";
import { wcaTimerComparison } from "@/features/wca/lib/wcaTimerComparison";
import { trpc } from "@/lib/trpc";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import {
  addSolveHistory,
  effectiveTime,
  formatSolveTime,
  initialStateFor,
  readSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
  type SolveSource,
} from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { CrossLengthStrip } from "@/features/timer/components/CrossLengthStrip";
import { HIDE_RUNNING_TIME_KEY } from "@/lib/appSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { MetricButton } from "@/features/timer";
import { TimerReplayDialog } from "@/features/timer/components/TimerReplayDialog";
import { TimerSolveEditDialog } from "@/features/timer/components/TimerSolveEditDialog";
import { useTimerSolveEditor } from "@/features/timer/lib/useTimerSolveEditor";
import { IconButton, PageHeader, StatTile } from "@/components/ui/StudioUI";
import { RoundButton } from "@/components/ui/DesignSystem";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

import { buttonClass } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

import type { TimerWcaRecord } from "@/features/timer/lib/timerLabTypes";
import { safeScrambleState } from "@/features/timer/lib/timerScrambleState";
import { exportAo5Image } from "@/features/timer/lib/timerImageExport";
import { EventProgressCard } from "@/features/timer/components/EventProgressCard";
import { EventWcaComparisonCard } from "@/features/timer/components/EventWcaComparisonCard";
import { MetricDetailCard } from "@/features/timer/components/MetricDetailCard";
import { MultiBlindResultCard, MultiBlindScrambleList } from "@/features/timer/components/MultiBlindCards";

const AVERAGES = TIMER_AVERAGE_SIZES;
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
  const digest = useMemo(() => dailyDigest(entries), [entries]);
  const editor = useTimerSolveEditor({
    onSaved: setEntries,
    unfinishedMessage: t("timer.unfinishedSolution"),
    unsupportedMessage: t("timer.unsupportedNotation"),
  });
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
  const [inspectionVoice] = useState(
    () => readStoredValue("cfop-inspection-voice") !== "off"
  );
  const [metronomeEnabled] = useState(
    () => readStoredValue("cfop-metronome") === "on"
  );
  const [metronomeBpm] = useState(() => {
    const stored = Number(readStoredValue("cfop-metronome-bpm"));
    return Number.isFinite(stored) && stored >= 30 && stored <= 240
      ? Math.round(stored)
      : 60;
  });
  // Cài đặt → Timer: chỉ hiện "Đang giải…" trong lúc đồng hồ chạy.
  const [hideRunningTime] = useState(
    () => readStoredValue(HIDE_RUNNING_TIME_KEY) === "on"
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
  const [tagFilter, setTagFilter] = useState("all");
  const [noteQuery, setNoteQuery] = useState("");
  const [replay, setReplay] = useState<SolveHistoryEntry | null>(null);
  const [replayRunId, setReplayRunId] = useState(0);
  const [location] = useLocation();
  const labTab: "timer" | "study" =
    location.split("?")[0] === "/study" ? "study" : "timer";
  const scrambleRequest = useRef(0);

  // Chế độ tập trung: khi đồng hồ chạy, trang chỉ còn con số.
  const [timerRunning, setTimerRunning] = useState(false);
  useEffect(() => {
    if (timerRunning) document.body.dataset.timerFocus = "true";
    else delete document.body.dataset.timerFocus;
    return () => {
      delete document.body.dataset.timerFocus;
    };
  }, [timerRunning]);
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

  // Ô số liệu chưa đủ dữ liệu hiện dấu gạch dài: "--:--" trông như lỗi
  // hiển thị chứ không phải một giá trị.
  const metric = (value: number | null | undefined) =>
    value === undefined ? "—" : value === null ? "DNF" : formatSolveTime(value);
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
  const bluetooth = useBluetoothTimer();
  const bleTimer =
    !isMultiBlind && bluetooth.status === "connected" ? bluetooth.timer : null;
  // Tracks the GAN Timer's own solve recordings so a solve detected by the
  // cube can be attributed to a matching mat measurement — never to a stale
  // reading left over from earlier use.
  const bleSolveRef = useRef<{ at: number; ms: number } | null>(null);
  useEffect(() => {
    const timer = bluetooth.timer;
    if (!timer) return;
    const onStop = (event: Event) => {
      const ms = (event as CustomEvent<{ currentTime?: number }>).detail
        ?.currentTime;
      if (typeof ms === "number" && Number.isFinite(ms) && ms > 0) {
        bleSolveRef.current = { at: Date.now(), ms };
      }
    };
    timer.addEventListener("stop", onStop);
    return () => timer.removeEventListener("stop", onStop);
  }, [bluetooth.timer]);
  const smartCube = useSmartCube({
    enabled: isThreeByThree && !isMultiBlind,
    targetScramble: scramble,
    onSolveComplete: ({ elapsedMs, moves, phaseSplits }) => {
      const stop = bleSolveRef.current;
      const finalMs =
        stop && Date.now() - stop.at < 5_000 ? stop.ms : elapsedMs;
      recordSolve(
        {
          elapsedMs: finalMs,
          inspectionMs: 0,
          automaticPenalty: "none",
          phaseSplits: phaseSplits ?? [],
          moves: moves?.length ?? 0,
        },
        "smartcube"
      );
    },
  });
  const smartCubeActive =
    isThreeByThree && !isMultiBlind && smartCube.status === "connected";
  const recordSolve = (
    completion: TimerCompletion & { moves?: number },
    source: SolveSource = "manual"
  ) => {
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
      moves: completion.moves ?? 0,
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
            {/* Bố cục "tập trung đồng hồ": scramble và đồng hồ ở giữa; khi đồng hồ
                chạy, mọi phần `data-focus-hide` mờ đi (xem index.css). */}
            <div data-focus-hide>
              <PageHeader
                eyebrow={t("timer.eyebrow")}
                title={t("timer.title")}
                actions={
                  <Link
                    href="/study"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 bg-surface-2 text-ink hover:bg-surface-3"
                  >
                    <BookOpenCheck className="mr-2" />
                    {t("timer.openStudy")}
                  </Link>
                }
              />
            </div>
            <div
              data-focus-hide
              className="mt-3 flex flex-wrap items-center gap-2"
              aria-label={t("timer.digestLabel")}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
                <Sparkles
                  className="text-base text-muted"
                  aria-hidden="true"
                />
                {t("timer.digestStreak", { days: digest.streak })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
                <Calendar3
                  className="text-base text-muted"
                  aria-hidden="true"
                />
                {t("timer.digestToday", { count: digest.todayCount })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
                <CircleGauge
                  className="text-base text-muted"
                  aria-hidden="true"
                />
                {t("timer.digestAo5", { value: metric(averages.ao5) })}
              </span>
            </div>

            <section
              aria-label={t("timer.title")}
              className="mt-5 rounded-card bg-surface p-4 sm:p-6 lg:p-8"
            >
              <div
                data-focus-hide
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <label className="w-full sm:w-64">
                  <span className="sr-only">{t("timer.puzzle")}</span>
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
                              .map((item, index) => `${index + 1}. ${item}`)
                              .join("\n")
                          : scramble
                      )
                    }
                    title={t("timer.copy")}
                  />
                </div>
              </div>
              <div
                data-focus-hide
                className="mx-auto mt-6 max-w-4xl text-center"
              >
                {isMultiBlind ? (
                  <MultiBlindScrambleList
                    scrambles={multiBlindScrambles}
                    loading={scrambleLoading}
                  />
                ) : (
                  <p
                    className={
                      scrambleSize === "sm"
                        ? "break-words mb-4 text-lg sm:text-xl font-semibold leading-snug tracking-wide"
                        : scrambleSize === "lg"
                          ? "break-words mb-4 text-2xl sm:text-4xl font-semibold leading-snug tracking-wide"
                          : "break-words mb-4 text-xl sm:text-3xl font-semibold leading-snug tracking-wide"
                    }
                    aria-live="polite"
                  >
                    {scrambleLoading
                      ? t("timer.generating", { event: eventLabel })
                      : scramble}
                  </p>
                )}
                {isThreeByThree &&
                !isMultiBlind &&
                !scrambleLoading &&
                scramble ? (
                  <CrossLengthStrip
                    scramble={scramble}
                    className="justify-center"
                  />
                ) : null}
                {scrambleError ? (
                  <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mb-4">
                    {scrambleError}
                  </div>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-12 gap-6 items-stretch">
                <div className="col-span-12 lg:col-span-8">
                  <div data-focus-hide>
                    {isMultiBlind && (
                      <div className="rounded-card bg-surface bg-surface-2 mb-4">
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <label className="mb-1.5 block text-sm font-medium text-ink mb-0">
                              {t("timer.multiBlindAttempted")}
                              <input
                                aria-label={t("timer.multiBlindAttemptedAria")}
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
                              onClick={() => void generateMultiBlindScrambles()}
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
                      <SmartCubeBar
                        status={smartCube.status}
                        cubeName={smartCube.cubeName}
                        batteryPercent={smartCube.batteryPercent}
                        errorKey={smartCube.errorKey}
                        onConnect={() => void smartCube.connect()}
                        onDisconnect={smartCube.disconnect}
                      />
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
                  </div>
                  {scrambleLoading ? (
                    <div className="rounded-card bg-surface p-5 sm:p-6 text-center">
                      <span className="block h-3 rounded-full bg-surface-3 w-8/12 mx-auto" />
                      <span className="block h-3 rounded-full bg-surface-3 w-5/12 mx-auto mt-4" />
                    </div>
                  ) : isMultiBlind && !multiBlindReady ? (
                    <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mb-0">
                      {t("timer.multiBlindMissing")}
                    </div>
                  ) : smartCubeActive ? (
                    <SmartCubeHero
                      smartCube={smartCube}
                      onDisconnect={smartCube.disconnect}
                      externalTimer={
                        bleTimer
                          ? {
                              deviceName: bluetooth.deviceName ?? "GAN Timer",
                              timer: bleTimer,
                            }
                          : undefined
                      }
                    />
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
                          "bluetooth"
                        )
                      }
                    />
                  ) : (
                    <SolveTimer
                      key={timerVersion}
                      onComplete={recordSolve}
                      onModeChange={mode => setTimerRunning(mode === "running")}
                      soundEnabled={inspectionSound}
                      voiceEnabled={inspectionVoice}
                      metronomeEnabled={metronomeEnabled}
                      metronomeBpm={metronomeBpm}
                      hideRunningTime={hideRunningTime}
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
                          onClick={() => editor.open(latestRecorded)}
                        >
                          {t("timer.addSolution")}
                        </Button>
                      </div>
                    )}
                </div>
                <div data-focus-hide className="col-span-12 lg:col-span-4">
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
            </section>

            <section
              data-focus-hide
              aria-labelledby="timer-summary-heading"
              className="mt-6 rounded-card bg-surface p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="timer-summary-heading"
                  className="flex items-center gap-2 text-base font-semibold tracking-tight"
                >
                  <BarChart3
                    className="text-lg text-muted"
                    aria-hidden="true"
                  />
                  {t("timer.summary")}
                </h2>
                <Link
                  href="/history"
                  className={buttonClass("secondary", "sm")}
                >
                  {t("timer.openHistory")}
                </Link>
              </div>
              <div className="grid grid-cols-12 gap-2 mt-4">
                <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                  <MetricButton
                    label={isMultiBlind ? t("timer.bestScore") : t("timer.pb")}
                    value={metric(pb)}
                    enabled={pb !== undefined}
                    onClick={() => setSelectedMetric("pb")}
                  />
                </div>
                {!isMultiBlind && (
                  <>
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                      <MetricButton
                        label="AO5"
                        value={metric(averages.ao5)}
                        enabled={averages.ao5 !== undefined}
                        onClick={() => setSelectedMetric("ao5")}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                      <MetricButton
                        label="AO12"
                        value={metric(averages.ao12)}
                        enabled={averages.ao12 !== undefined}
                        onClick={() => setSelectedMetric("ao12")}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                      <MetricButton
                        label="AO50"
                        value={metric(averages.ao50)}
                        enabled={averages.ao50 !== undefined}
                        onClick={() => setSelectedMetric("ao50")}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                      <MetricButton
                        label="AO100"
                        value={metric(averages.ao100)}
                        enabled={averages.ao100 !== undefined}
                        onClick={() => setSelectedMetric("ao100")}
                      />
                    </div>
                  </>
                )}
                <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                  <MetricButton
                    label={t("timer.total")}
                    value={String(visibleEntries.length)}
                    enabled={visibleEntries.length > 0}
                    onClick={() => setSelectedMetric("total")}
                  />
                </div>
              </div>
            </section>

            <details
              data-focus-hide
              className="group mt-6 rounded-card bg-surface"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold tracking-tight sm:px-6">
                {t("timer.analyticsTitle")}
                <ChevronDown
                  aria-hidden="true"
                  className="text-base text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="grid grid-cols-12 gap-6 px-5 pb-6 sm:px-6">
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
                  className="col-span-12"
                  aria-labelledby="timer-analytics-heading"
                >
                  {/* Tiêu đề đã nằm ở <summary>; giữ cho trình đọc màn hình. */}
                  <h2 id="timer-analytics-heading" className="sr-only">
                    {t("timer.analyticsTitle")}
                  </h2>
                  <div className="flex flex-col gap-6">
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
              </div>
            </details>

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
                      state={safeScrambleState(
                        expandedMetricCube.input,
                        expandedMetricCube.eventId
                      )}
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
            <TimerSolveEditDialog editor={editor} />

            <TimerReplayDialog
              replay={replay}
              replayText={replayText}
              replayTps={replayTps}
              phaseTps={phaseTps}
              replayRunId={replayRunId}
              onPlay={() => setReplayRunId(value => value + 1)}
              onClose={() => setReplay(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
