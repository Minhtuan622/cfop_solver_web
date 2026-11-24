import {
  BookOpenCheck,
  ClipboardCheck,
  Dices,
  Timer,
} from "@/components/ui/Icon";
import { Link, useLocation, useSearch } from "wouter";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { parseTimerLink } from "@/lib/timerLink";
import { multiBlindResult } from "@/lib/multiBlind";
import { phaseTpsFromSolution, solutionEfficiency } from "@/features/timer/lib/timerAnalysis";
import { wcaTimerComparison } from "@/features/wca/lib/wcaTimerComparison";
import { trpc } from "@/lib/trpc";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import {
  addSolveHistory,
  formatSolveTime,
  initialStateFor,
  readSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
  type SolveSource,
} from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { CrossLengthStrip } from "@/features/timer/components/CrossLengthStrip";
import { MultiBlindAttemptPanel } from "@/features/timer/components/MultiBlindAttemptPanel";
import { TimerAnalyticsPanel } from "@/features/timer/components/TimerAnalyticsPanel";
import { TimerCubeNetDialog } from "@/features/timer/components/TimerCubeNetDialog";
import { TimerDigestChips } from "@/features/timer/components/TimerDigestChips";
import { TimerMetricDialog } from "@/features/timer/components/TimerMetricDialog";
import { TimerSummaryMetrics } from "@/features/timer/components/TimerSummaryMetrics";
import { useTimerMetrics } from "@/features/timer/lib/useTimerMetrics";
import { useTimerPreferences } from "@/features/timer/lib/useTimerPreferences";
import { TimerReplayDialog } from "@/features/timer/components/TimerReplayDialog";
import { TimerSolveEditDialog } from "@/features/timer/components/TimerSolveEditDialog";
import { useTimerSolveEditor } from "@/features/timer/lib/useTimerSolveEditor";
import { PageHeader } from "@/components/ui/StudioUI";
import { RoundButton } from "@/components/ui/DesignSystem";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

import { Select } from "@/components/ui/Select";

import type { TimerWcaRecord } from "@/features/timer/lib/timerLabTypes";
import { MultiBlindResultCard, MultiBlindScrambleList } from "@/features/timer/components/MultiBlindCards";

const SolveAnalysisDialog = lazy(async () => ({
  default: (await import("@/features/timer/components/SolveAnalysisDialog"))
    .SolveAnalysisDialog,
}));

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
  const timerLinkSearch = useSearch();
  const [timerLink] = useState(() =>
    window.location.pathname.startsWith("/timer")
      ? parseTimerLink(window.location.search)
      : null
  );
  const [eventId, setEventId] = useState<TimerEventId>(
    () =>
      timerLink?.eventId ??
      normalizeTimerEventId(readStoredValue("cfop-timer-event"))
  );
  const [scramble, setScramble] = useState(
    () => timerLink?.scramble ?? randomThreeByThreeScramble()
  );
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
  const [expandedMetricCube, setExpandedMetricCube] =
    useState<SolveHistoryEntry | null>(null);
  const {
    inspectionSound,
    inspectionVoice,
    metronomeEnabled,
    metronomeBpm,
    hideRunningTime,
    scrambleSize,
  } = useTimerPreferences();
  const [multiBlindAttempted, setMultiBlindAttempted] = useState(2);
  const [multiBlindSolved, setMultiBlindSolved] = useState(0);
  const [multiBlindScrambles, setMultiBlindScrambles] = useState<string[]>([]);
  const [pendingMultiBlind, setPendingMultiBlind] =
    useState<TimerCompletion | null>(null);
  const [tagFilter, setTagFilter] = useState("all");
  const [noteQuery, setNoteQuery] = useState("");
  const [replay, setReplay] = useState<SolveHistoryEntry | null>(null);
  const [analysisEntry, setAnalysisEntry] = useState<SolveHistoryEntry | null>(null);
  const [replayRunId, setReplayRunId] = useState(0);
  const [location] = useLocation();
  const labTab: "timer" | "study" =
    location.split("?")[0] === "/study" ? "study" : "timer";
  const scrambleRequest = useRef(0);

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
  const { progress, pb, averages } = useTimerMetrics(visibleEntries, isMultiBlind);
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

  const metric = (value: number | null | undefined) =>
    value === undefined ? "—" : value === null ? "DNF" : formatSolveTime(value);
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
    onSolveComplete: ({ elapsedMs, moves, moveTimes, phaseSplits }) => {
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
          solution: moves?.join(" ") ?? "",
          moveTimes,
        },
        "smartcube"
      );
    },
  });
  const smartCubeActive =
    isThreeByThree && !isMultiBlind && smartCube.status === "connected";
  const recordSolve = (
    completion: TimerCompletion & {
      moves?: number;
      solution?: string;
      moveTimes?: number[];
    },
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
      ...(completion.solution
        ? { solution: completion.solution, moveTimes: completion.moveTimes }
        : {}),
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
    if (!timerLink) void nextScramble(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const appliedLink = useRef(timerLink ? `${timerLink.eventId}|${timerLink.scramble}` : "");
  useEffect(() => {
    if (labTab !== "timer") return;
    const link = parseTimerLink(timerLinkSearch);
    if (!link) return;
    const key = `${link.eventId}|${link.scramble}`;
    if (appliedLink.current === key) return;
    appliedLink.current = key;
    scrambleRequest.current += 1;
    setEventId(link.eventId);
    setScramble(link.scramble);
    setScrambleLoading(false);
    setScrambleError("");
    setPendingMultiBlind(null);
    setMultiBlindScrambles([]);
    setSelectedMetric(null);
    setLatestRecorded(null);
    setTimerVersion(value => value + 1);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerLinkSearch, labTab]);
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
            <TimerDigestChips digest={digest} ao5Text={metric(averages.ao5)} />

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
                      <MultiBlindAttemptPanel
                        attempted={multiBlindAttempted}
                        onAttemptedChange={value => {
                          setMultiBlindAttempted(value);
                          setMultiBlindScrambles([]);
                          setScramble("");
                        }}
                        loading={scrambleLoading}
                        onGenerate={() => void generateMultiBlindScrambles()}
                      />
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
                  {saved && latestRecorded?.moveTimes ? (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="soft"
                        size="sm"
                        type="button"
                        onClick={() => setAnalysisEntry(latestRecorded)}
                      >
                        {t("analysis.open")}
                      </Button>
                    </div>
                  ) : null}
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

            <TimerSummaryMetrics
              isMultiBlind={isMultiBlind}
              pb={pb}
              averages={averages}
              totalCount={visibleEntries.length}
              formatMetric={metric}
              onSelectMetric={setSelectedMetric}
            />

            <TimerAnalyticsPanel
              isMultiBlind={isMultiBlind}
              eventId={eventId}
              eventLabel={eventLabel}
              eventEntries={eventEntries}
              progress={progress}
              eventWcaRows={eventWcaRows}
              hasWcaId={Boolean(accountQuery.data?.wcaId)}
              wcaLoading={wcaProfileQuery.isLoading}
              wcaUnavailable={wcaProfileQuery.isError}
              hasWcaRecord={Boolean(eventWcaRecord)}
              pb={pb}
              averages={averages}
              totalCount={visibleEntries.length}
              formatMetric={metric}
              latestSolution={latestSolution}
              latestEfficiency={latestEfficiency}
            />

            <TimerMetricDialog
              selectedMetric={selectedMetric}
              selectedMetricDetail={selectedMetricDetail}
              isThreeByThree={isThreeByThree}
              formatMetric={metric}
              onClose={() => setSelectedMetric(null)}
              onExpandCube={setExpandedMetricCube}
              onReplay={openReplay}
              onAnalyze={setAnalysisEntry}
            />
            <TimerCubeNetDialog
              entry={expandedMetricCube}
              onClose={() => setExpandedMetricCube(null)}
            />
            <TimerSolveEditDialog editor={editor} />

            <TimerReplayDialog
              replay={replay}
              replayText={replayText}
              replayTps={replayTps}
              phaseTps={phaseTps}
              replayRunId={replayRunId}
              onPlay={() => setReplayRunId(value => value + 1)}
              onClose={() => setReplay(null)}
              onAnalyze={entry => {
                setReplay(null);
                setAnalysisEntry(entry);
              }}
            />
            {analysisEntry ? (
              <Suspense fallback={null}>
                <SolveAnalysisDialog
                  entry={analysisEntry}
                  onClose={() => setAnalysisEntry(null)}
                />
              </Suspense>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
