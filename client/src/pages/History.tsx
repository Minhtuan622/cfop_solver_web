import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock3,
  Download,
  FileDown,
  FileUp,
  Pencil,
  Play,
  Search,
  Tag,
  Trash2,
} from "@/components/ui/Icon";
import { Link } from "wouter";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  deleteSolveHistory,
  deleteSolveHistoryMany,
  effectiveTime,
  exportSolveHistory,
  formatSolveResult,
  formatSolveTime,
  importSolveHistory,
  initialStateFor,
  readSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
  updateSolveHistory,
} from "@/lib/solveHistory";
import { validateRecordedSolution } from "@/lib/fastCube";
import { MoveComposer } from "@/components/common/MoveComposer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { EmptyState, IconButton, StatTile } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TIMER_EVENTS,
  normalizeTimerEventId,
  timerEventLabel,
  type TimerEventId,
} from "@/lib/timerEvents";
import { csvCell, downloadFile as saveFile } from "@/lib/browserDownload";
import { useMemo, useRef, useState, type ChangeEvent } from "react";

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export default function History() {
  const { language, t } = useLanguage();
  const [entries, setEntries] = useState<SolveHistoryEntry[]>(() =>
    readSolveHistory()
  );
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [eventFilter, setEventFilter] = useState<"all" | TimerEventId>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<SolveHistoryEntry | null>(null);
  const [editSeconds, setEditSeconds] = useState("");
  const [editPenalty, setEditPenalty] = useState<SolvePenalty>("none");
  const [editSolution, setEditSolution] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editTags, setEditTags] = useState("");
  const [solutionError, setSolutionError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SolveHistoryEntry | null>(
    null
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const tags = useMemo(
    () =>
      Array.from(new Set(entries.flatMap(item => item.tags))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [entries]
  );
  const filtered = useMemo(
    () =>
      entries.filter(item => {
        const haystack =
          `${item.input} ${item.multiBlindScrambles?.join(" ") ?? ""} ${item.note} ${item.tags.join(" ")}`.toLocaleLowerCase();
        return (
          (eventFilter === "all" ||
            normalizeTimerEventId(item.eventId) === eventFilter) &&
          (tag === "all" || item.tags.includes(tag)) &&
          (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()))
        );
      }),
    [entries, eventFilter, query, tag]
  );
  const valid = useMemo(
    () =>
      filtered.flatMap(item => {
        const time = effectiveTime(item);
        return time === null ? [] : [time];
      }),
    [filtered]
  );
  const best = valid.length ? Math.min(...valid) : 0;
  const dnfCount = filtered.filter(item => item.penalty === "DNF").length;
  const plusTwoCount = filtered.filter(item => item.penalty === "+2").length;
  const chart = useMemo(
    () =>
      filtered
        .slice(0, 30)
        .reverse()
        .map((item, index) => ({
          solve: index + 1,
          seconds: Number(
            ((effectiveTime(item) ?? item.elapsedMs) / 1000).toFixed(2)
          ),
        })),
    [filtered]
  );
  const allSelected =
    filtered.length > 0 && filtered.every(item => selectedIds.has(item.id));
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
    const supportsReplay = normalizeTimerEventId(editing.eventId) === "333";
    const validation = supportsReplay
      ? validateRecordedSolution(initialStateFor(editing), editSolution)
      : {
          valid: true,
          normalized: editing.solution,
          moves: editing.moves ? [editing.solution] : ([] as string[]),
        };
    if (!validation.valid && validation.error !== "empty") {
      setSolutionError(t("history.invalidSolution"));
      return;
    }
    setEntries(
      updateSolveHistory(editing.id, {
        elapsedMs: Math.round(seconds * 1000),
        penalty: editPenalty,
        solution: validation.normalized,
        moves: supportsReplay ? validation.moves.length : editing.moves,
        note: editNote.trim(),
        tags: editTags
          .split(",")
          .map(value => value.trim())
          .filter(Boolean),
      })
    );
    setEditing(null);
  };
  const updatePenalty = (entry: SolveHistoryEntry, penalty: SolvePenalty) =>
    setEntries(
      updateSolveHistory(entry.id, {
        penalty: entry.penalty === penalty ? "none" : penalty,
      })
    );
  const toggleSelected = (id: string) =>
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleVisible = () =>
    setSelectedIds(current => {
      const next = new Set(current);
      if (allSelected) filtered.forEach(entry => next.delete(entry.id));
      else filtered.forEach(entry => next.add(entry.id));
      return next;
    });
  const exportCsv = () =>
    saveFile(
      "cfop-solve-history.csv",
      "text/csv;charset=utf-8",
      [
        [
          "timestamp",
          "event",
          "base_time_ms",
          "inspection_ms",
          "penalty",
          "result",
          "scramble",
          "mbl_scrambles",
          "solution",
          "note",
          "tags",
        ],
        ...entries.map(item => [
          new Date(item.createdAt).toISOString(),
          normalizeTimerEventId(item.eventId),
          item.elapsedMs,
          item.inspectionMs,
          item.penalty,
          formatSolveResult(item),
          item.input,
          item.multiBlindScrambles?.join("\n") ?? "",
          item.solution,
          item.note,
          item.tags.join("|"),
        ]),
      ]
        .map(row => row.map(csvCell).join(","))
        .join("\n")
    );
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setEntries(importSolveHistory(JSON.parse(await file.text())));
      setSelectedIds(new Set());
      setImportError("");
    } catch {
      setImportError(t("history.importFailed"));
    } finally {
      event.target.value = "";
    }
  };

  const supportsReplay = editing
    ? normalizeTimerEventId(editing.eventId) === "333"
    : false;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <section className="rounded-card border border-line/80 bg-surface shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 gap-2">
          <div>
            <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
              CFOP Solver Studio · {t("history.eyebrow")}
            </p>
            <h1 className="text-xl font-semibold tracking-tight mb-0">
              {t("history.title")}
            </h1>
          </div>
          <Link
            href="/timer"
            aria-label={t("history.backToTimer")}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
          >
            <ArrowLeft className="text-base" />
          </Link>
        </div>
        <div className="p-5 sm:p-6">
          {entries.length ? (
            <>
              <section
                className="grid grid-cols-12 gap-2 lg:gap-4"
                aria-label={t("history.metricsLabel")}
              >
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <StatTile
                    label={t("history.bestSingle")}
                    value={formatSolveTime(best)}
                    icon={<Clock3 className="text-lg" />}
                  />
                </div>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <StatTile
                    label={t("history.filteredAverage")}
                    value={formatSolveTime(average(valid))}
                    icon={<BarChart3 className="text-lg" />}
                  />
                </div>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <StatTile
                    label={t("history.validSolves")}
                    value={`${valid.length}/${filtered.length}`}
                    icon={<Clock3 className="text-lg" />}
                  />
                </div>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <StatTile
                    label={t("history.penalties")}
                    value={`+2 ${plusTwoCount} · DNF ${dnfCount}`}
                    icon={<Tag className="text-lg" />}
                  />
                </div>
              </section>
              <section className="rounded-card border border-line/80 bg-surface shadow-soft mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                  <h2 className="text-base font-semibold tracking-tight mb-0">
                    {t("history.trendTitle")}
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="aspect-video">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart}>
                        <XAxis
                          dataKey="solve"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={value => `${value}s`}
                          axisLine={false}
                          tickLine={false}
                          width={42}
                        />
                        <Tooltip
                          formatter={value => [
                            `${value}s`,
                            t("history.timeLabel"),
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="seconds"
                          stroke="var(--chart-1)"
                          strokeWidth={3}
                          dot={{ fill: "var(--chart-1)", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
              <section className="rounded-card border border-line/80 bg-surface shadow-soft mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 gap-2">
                  <h2 className="text-base font-semibold tracking-tight mb-0">
                    {t("history.manageTitle")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileRef}
                      onChange={onImport}
                      accept="application/json,.json"
                      type="file"
                      className="hidden"
                    />
                    <IconButton
                      label={t("history.importJson")}
                      icon={<FileUp className="text-base" />}
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                    />
                    <IconButton
                      label={t("history.exportJson")}
                      icon={<FileDown className="text-base" />}
                      onClick={() =>
                        saveFile(
                          "cfop-solve-history.json",
                          "application/json",
                          JSON.stringify(exportSolveHistory(), null, 2)
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                    />
                    <IconButton
                      label={t("history.exportCsv")}
                      icon={<Download className="text-base" />}
                      onClick={exportCsv}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  {importError ? (
                    <div className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink">
                      {importError}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-6">
                      <label className="sr-only" htmlFor="history-search">
                        {t("history.searchLabel")}
                      </label>
                      <div className="flex w-full items-stretch">
                        <span className="inline-flex items-center border border-line bg-surface-2 px-3 text-sm text-muted first:rounded-l-field last:rounded-r-field">
                          <Search className="text-base" />
                        </span>
                        <input
                          id="history-search"
                          className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                          value={query}
                          onChange={event => setQuery(event.target.value)}
                          placeholder={t("history.searchLabel")}
                        />
                      </div>
                    </div>
                    <div className="col-span-12">
                      <label className="sr-only" htmlFor="history-event-filter">
                        {t("history.eventFilterLabel")}
                      </label>
                      <select
                        id="history-event-filter"
                        className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                        value={eventFilter}
                        onChange={event =>
                          setEventFilter(
                            event.target.value as "all" | TimerEventId
                          )
                        }
                      >
                        <option value="all">{t("history.allEvents")}</option>
                        {TIMER_EVENTS.map(event => (
                          <option key={event.id} value={event.id}>
                            {timerEventLabel(event.id, language)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-12">
                      <label className="sr-only" htmlFor="history-tag-filter">
                        {t("history.tagFilterLabel")}
                      </label>
                      <select
                        id="history-tag-filter"
                        className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                        value={tag}
                        onChange={event => setTag(event.target.value)}
                      >
                        <option value="all">{t("history.allTags")}</option>
                        {tags.map(item => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {filtered.length ? (
                    <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink flex flex-wrap justify-between items-center gap-2 mt-4 mb-0">
                      <label className="flex items-center gap-2 mb-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-line accent-primary"
                          checked={allSelected}
                          onChange={toggleVisible}
                        />{" "}
                        <span className="text-sm text-ink">
                          {t("history.selectFiltered")}
                        </span>
                      </label>
                      <IconButton
                        label={t("history.deleteSelected")}
                        icon={<Trash2 className="text-base" />}
                        disabled={!selectedIds.size}
                        onClick={() => setBulkDeleteOpen(true)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="divide-y divide-line bg-transparent border-0">
                  {filtered.length ? (
                    filtered
                      .slice(0, 100)
                      .map(item => (
                        <SolveRow
                          key={item.id}
                          item={item}
                          language={language}
                          selected={selectedIds.has(item.id)}
                          onSelect={() => toggleSelected(item.id)}
                          onPenalty={updatePenalty}
                          onEdit={() => openEdit(item)}
                          onDelete={() => setDeleteTarget(item)}
                        />
                      ))
                  ) : (
                    <div className="block px-4 py-3 text-sm">
                      <EmptyState title={t("history.emptyFiltered")} />
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <EmptyState
              icon={<BarChart3 />}
              title={t("history.emptyTitle")}
              description={t("history.emptyDetail")}
              action={
                <Link
                  href="/timer"
                  aria-label={t("history.openTimer")}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-3 py-1.5 text-xs"
                >
                  <Play className="text-base" />
                </Link>
              }
            />
          )}
        </div>
      </section>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>{t("history.editTitle")}</DialogTitle>
              <DialogDescription>
                <span className="font-mono break-words">{editing?.input}</span>
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-6">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {t("history.baseTime")}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editSeconds}
                  onChange={event => setEditSeconds(event.target.value)}
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
              <label className="col-span-12 md:col-span-6">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {t("history.penalty")}
                </span>
                <select
                  value={editPenalty}
                  onChange={event =>
                    setEditPenalty(event.target.value as SolvePenalty)
                  }
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="none">{t("history.noPenalty")}</option>
                  <option value="+2">+2</option>
                  <option value="DNF">DNF</option>
                </select>
              </label>
              {supportsReplay ? (
                <div className="col-span-12">
                  <MoveComposer
                    value={editSolution}
                    onChange={setEditSolution}
                    label={t("history.recordedSolution")}
                    pasteLabel={t("history.replayHint")}
                  />
                </div>
              ) : null}
              {solutionError ? (
                <div className="col-span-12">
                  <div className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink mb-0">
                    {solutionError}
                  </div>
                </div>
              ) : null}
              <label className="col-span-12">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {t("history.note")}
                </span>
                <textarea
                  value={editNote}
                  onChange={event => setEditNote(event.target.value)}
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                  rows={3}
                />
              </label>
              <label className="col-span-12">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {t("history.tags")}
                </span>
                <input
                  value={editTags}
                  onChange={event => setEditTags(event.target.value)}
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
            >
              {t("history.cancel")}
            </button>
            <IconButton
              label={t("history.saveSolve")}
              icon={<Check className="text-base" />}
              onClick={saveEdit}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
            />
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
              <DialogTitle>{t("history.deleteTitle")}</DialogTitle>
              <DialogDescription>{t("history.deleteDetail")}</DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              onClick={() => setDeleteTarget(null)}
            >
              {t("history.cancel")}
            </button>
            <IconButton
              label={t("history.deleteSolve")}
              icon={<Trash2 className="text-base" />}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              onClick={() => {
                if (deleteTarget)
                  setEntries(deleteSolveHistory(deleteTarget.id));
                setDeleteTarget(null);
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>{t("history.bulkDeleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("history.bulkDeleteDetail")}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              onClick={() => setBulkDeleteOpen(false)}
            >
              {t("history.cancel")}
            </button>
            <IconButton
              label={t("history.deleteSelected")}
              icon={<Trash2 className="text-base" />}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              onClick={() => {
                setEntries(deleteSolveHistoryMany(selectedIds));
                setSelectedIds(new Set());
                setBulkDeleteOpen(false);
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SolveRow({
  item,
  language,
  selected,
  onSelect,
  onPenalty,
  onEdit,
  onDelete,
}: {
  item: SolveHistoryEntry;
  language: "vi" | "en";
  selected: boolean;
  onSelect: () => void;
  onPenalty: (item: SolveHistoryEntry, penalty: SolvePenalty) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const bundle = item.multiBlindScrambles;
  const eventLabel = timerEventLabel(
    normalizeTimerEventId(item.eventId),
    language
  );
  return (
    <article className="block px-4 py-3 text-sm py-4">
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line accent-primary"
            checked={selected}
            onChange={onSelect}
            aria-label={t("history.selectSolve")}
          />
        </div>
        <div className="col-span-12">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-primary text-white mb-2">
            {eventLabel}
          </span>
          {bundle?.length ? (
            <details>
              <summary className="font-mono break-words">
                {t("history.multiBlindBundle", { count: bundle.length })}
              </summary>
              <ol className="font-mono text-sm mb-2 mt-2 pl-6">
                {bundle.map((scramble, index) => (
                  <li key={`${index}-${scramble}`} className="break-words">
                    {scramble}
                  </li>
                ))}
              </ol>
            </details>
          ) : (
            <p className="font-mono break-words mb-1">
              {item.inputKind === "scramble"
                ? item.input
                : t("history.sixFaceState")}
            </p>
          )}
          <p className="text-sm text-muted mb-0">
            {new Date(item.createdAt).toLocaleString(
              language === "vi" ? "vi-VN" : "en-US"
            )}{" "}
            · {t("history.moveCount", { count: item.moves })}
            {item.note ? ` · ${item.note}` : ""}
          </p>
          {item.tags.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="col-span-12 flex flex-wrap items-center gap-1">
          <div className="inline-flex flex-wrap items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onPenalty(item, "+2")}
              className={
                item.penalty === "+2"
                  ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-warning text-ink shadow-sm hover:brightness-95"
                  : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              }
            >
              +2
            </button>
            <button
              type="button"
              onClick={() => onPenalty(item, "DNF")}
              className={
                item.penalty === "DNF"
                  ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-danger text-white shadow-sm hover:brightness-95"
                  : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              }
            >
              DNF
            </button>
          </div>
          <IconButton
            label={t("history.editSolve")}
            icon={<Pencil className="text-base" />}
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
          />
          <IconButton
            label={t("history.deleteRow")}
            icon={<Trash2 className="text-base" />}
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-danger/35 bg-transparent text-danger hover:bg-danger-soft px-3 py-1.5 text-xs"
          />
        </div>
        <div className="col-span-12 text-right">
          <strong className={item.penalty === "DNF" ? "text-danger" : ""}>
            {formatSolveResult(item)}
          </strong>
          {item.inspectionMs ? (
            <small className="block text-muted">
              Inspection {(item.inspectionMs / 1000).toFixed(1)}s
            </small>
          ) : null}
        </div>
      </div>
    </article>
  );
}
