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
import Papa from "papaparse";
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
  exportCstimerSolveHistory,
  formatSolveResult,
  formatSolveTime,
  importSolveHistory,
  importCstimerSolveHistory,
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
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { rollingAverage } from "@/lib/timerRecords";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TIMER_EVENTS,
  normalizeTimerEventId,
  timerEventLabel,
  type TimerEventId,
} from "@/lib/timerEvents";
import { downloadFile as saveFile } from "@/lib/browserDownload";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";
import { PageHeader } from "@/components/ui/StudioUI";
import { buttonClass } from "@/components/ui/Button";

/** Số lượt trên biểu đồ xu hướng và mỗi lần "Xem thêm". */
const CHART_SOLVES = 30;
const PAGE_SIZE = 50;
const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition data-[highlighted]:bg-surface";

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
  const [cstimerMessage, setCstimerMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cstimerFileRef = useRef<HTMLInputElement>(null);
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
  // 30 lượt gần nhất theo thứ tự thời gian, kèm ao5 (luật WCA) kết thúc tại
  // mỗi lượt. Lấy thêm 4 lượt trước đó để điểm đầu cũng có ao5. Lượt DNF
  // không có điểm (đứt đường) thay vì vẽ bằng thời gian thô.
  const chart = useMemo(() => {
    const chronological = filtered.slice(0, CHART_SOLVES + 4).reverse();
    const toSeconds = (ms: number | null) =>
      ms === null ? null : Number((ms / 1000).toFixed(2));
    return chronological
      .map((item, index) => ({
        seconds: toSeconds(effectiveTime(item)),
        ao5:
          index >= 4
            ? toSeconds(rollingAverage(chronological.slice(index - 4, index + 1)))
            : null,
      }))
      .slice(-CHART_SOLVES)
      .map((point, index) => ({ solve: index + 1, ...point }));
  }, [filtered]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleEntries = filtered.slice(0, visibleCount);
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
  const exportCsv = () => {
    const rows: (string | number | null | undefined)[][] = [
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
    ];
    saveFile(
      "cfop-solve-history.csv",
      "text/csv;charset=utf-8",
      Papa.unparse(rows, { quotes: true, newline: "\n" }),
    );
  };
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setEntries(importSolveHistory(JSON.parse(await file.text())));
      setSelectedIds(new Set());
      setImportError("");
      setCstimerMessage("");
    } catch {
      setImportError(t("history.importFailed"));
    } finally {
      event.target.value = "";
    }
  };
  const onImportCstimer = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const summary = importCstimerSolveHistory(payload);
      setEntries(readSolveHistory());
      setSelectedIds(new Set());
      setImportError("");
      setCstimerMessage(
        t("history.cstimerImported", {
          count: summary.imported,
          sessions: summary.sessions,
          dupes: summary.duplicates,
          skipped: summary.skippedSessions,
          invalid: summary.invalidSolves,
          truncated: summary.truncated,
        }),
      );
    } catch {
      setImportError(t("history.cstimerFailed"));
      setCstimerMessage("");
    } finally {
      event.target.value = "";
    }
  };
  const onExportCstimer = () => {
    saveFile(
      "cfop-solve-history-cstimer.json",
      "application/json",
      JSON.stringify(exportCstimerSolveHistory(), null, 2),
    );
  };

  const supportsReplay = editing
    ? normalizeTimerEventId(editing.eventId) === "333"
    : false;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <PageHeader
        title={t("history.title")}
        description={t("history.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Nhập/xuất ít dùng: gom vào một menu có chữ rõ ràng. */}
            <Dropdown
              id="history-transfer-menu"
              label={t("history.transferMenu")}
              variant="soft"
              button={
                <>
                  <FileDown className="text-base" aria-hidden="true" />
                  <span>{t("history.transferMenu")}</span>
                </>
              }
            >
              <DropdownItem
                className={MENU_ITEM_CLASS}
                onSelect={() => fileRef.current?.click()}
              >
                <FileUp className="text-base" aria-hidden="true" />
                {t("history.importJson")}
              </DropdownItem>
              <DropdownItem
                className={MENU_ITEM_CLASS}
                onSelect={() => cstimerFileRef.current?.click()}
              >
                <FileUp className="text-base" aria-hidden="true" />
                {t("history.importCstimer")}
              </DropdownItem>
              <DropdownItem
                className={MENU_ITEM_CLASS}
                onSelect={() =>
                  saveFile(
                    "cfop-solve-history.json",
                    "application/json",
                    JSON.stringify(exportSolveHistory(), null, 2)
                  )
                }
              >
                <FileDown className="text-base" aria-hidden="true" />
                {t("history.exportJson")}
              </DropdownItem>
              <DropdownItem
                className={MENU_ITEM_CLASS}
                onSelect={onExportCstimer}
              >
                <FileDown className="text-base" aria-hidden="true" />
                {t("history.exportCstimer")}
              </DropdownItem>
              <DropdownItem className={MENU_ITEM_CLASS} onSelect={exportCsv}>
                <Download className="text-base" aria-hidden="true" />
                {t("history.exportCsv")}
              </DropdownItem>
            </Dropdown>
            <Link
              href="/timer"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <ArrowLeft className="text-base" aria-hidden="true" />
              {t("history.backToTimer")}
            </Link>
          </div>
        }
      />
      <input
        ref={fileRef}
        onChange={onImport}
        accept="application/json,.json"
        type="file"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={cstimerFileRef}
        onChange={onImportCstimer}
        accept="application/json,.json,.txt,text/plain"
        type="file"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {importError ? (
        <div className="rounded-card bg-danger-soft px-4 py-3 text-sm text-ink mb-3">
          {importError}
        </div>
      ) : null}
      {cstimerMessage ? (
        <div className="rounded-card bg-success-soft px-4 py-3 text-sm text-ink mb-3">
          {cstimerMessage}
        </div>
      ) : null}
      {entries.length ? (
        <div className="flex flex-col gap-6">
          <section
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
            aria-label={t("history.metricsLabel")}
          >
            <StatTile
              label={t("history.bestSingle")}
              value={formatSolveTime(best)}
              icon={<Clock3 className="text-lg" />}
            />
            <StatTile
              label={t("history.filteredAverage")}
              value={formatSolveTime(average(valid))}
              icon={<BarChart3 className="text-lg" />}
            />
            <StatTile
              label={t("history.validSolves")}
              value={`${valid.length}/${filtered.length}`}
              icon={<Check className="text-lg" />}
            />
            <StatTile
              label={t("history.penalties")}
              value={`+2 ${plusTwoCount} · DNF ${dnfCount}`}
              icon={<Tag className="text-lg" />}
            />
          </section>

          <section className="rounded-card bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight mb-0">
                {t("history.trendTitle")}
              </h2>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-primary/40" aria-hidden="true" />
                  {t("history.timeLabel")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-4 rounded-full bg-primary" aria-hidden="true" />
                  ao5
                </span>
              </div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="solve" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis
                    tickFormatter={value => `${value}s`}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--surface-3)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "var(--surface-2)",
                      border: "none",
                      borderRadius: 14,
                      boxShadow: "none",
                      color: "var(--ink)",
                    }}
                    labelFormatter={value => t("history.solveNumber", { number: String(value) })}
                    formatter={(value, name) => [
                      value === null || value === undefined ? "DNF" : `${value}s`,
                      name === "ao5" ? "ao5" : t("history.timeLabel"),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="seconds"
                    stroke="var(--primary)"
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: "var(--primary)", fillOpacity: 0.45, strokeWidth: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ao5"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-card bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold tracking-tight mb-0">
                {t("history.manageTitle")}
              </h2>
              {filtered.length ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onChange={toggleVisible}
                    ariaLabel={t("history.selectFiltered")}
                  />
                  <span className="text-sm text-muted">
                    {t("history.selectedCount", { count: selectedIds.size })}
                  </span>
                  <IconButton
                    label={t("history.deleteSelected")}
                    icon={<Trash2 className="text-base" />}
                    disabled={!selectedIds.size}
                    onClick={() => setBulkDeleteOpen(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-12 items-center gap-2">
              <div className="col-span-12 lg:col-span-6">
                <label className="sr-only" htmlFor="history-search">
                  {t("history.searchLabel")}
                </label>
                <div className="flex w-full items-stretch">
                  <span className="inline-flex items-center bg-surface-2 px-3 text-sm text-muted first:rounded-l-field last:rounded-r-field">
                    <Search className="text-base" />
                  </span>
                  <Input
                    id="history-search"
                    value={query}
                    onChange={event => {
                      setQuery(event.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    placeholder={t("history.searchLabel")}
                  />
                </div>
              </div>
              <div className="col-span-6 lg:col-span-3">
                <label className="sr-only" htmlFor="history-event-filter">
                  {t("history.eventFilterLabel")}
                </label>
                <Select
                  id="history-event-filter"
                  value={eventFilter}
                  onChange={event => {
                    setEventFilter(event.target.value as "all" | TimerEventId);
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  <option value="all">{t("history.allEvents")}</option>
                  {TIMER_EVENTS.map(event => (
                    <option key={event.id} value={event.id}>
                      {timerEventLabel(event.id, language)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-6 lg:col-span-3">
                <label className="sr-only" htmlFor="history-tag-filter">
                  {t("history.tagFilterLabel")}
                </label>
                <Select
                  id="history-tag-filter"
                  value={tag}
                  onChange={event => {
                    setTag(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  <option value="all">{t("history.allTags")}</option>
                  {tags.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {filtered.length ? (
              <>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleEntries.map(item => (
                    <SolveCard
                      key={item.id}
                      item={item}
                      language={language}
                      selected={selectedIds.has(item.id)}
                      onSelect={() => toggleSelected(item.id)}
                      onPenalty={updatePenalty}
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  ))}
                </div>
                {filtered.length > visibleCount ? (
                  <div className="mt-5 flex justify-center">
                    <Button
                      variant="soft"
                      size="sm"
                      type="button"
                      onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                    >
                      {t("history.showMore", {
                        count: Math.min(PAGE_SIZE, filtered.length - visibleCount),
                        remaining: filtered.length - visibleCount,
                      })}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-5">
                <EmptyState title={t("history.emptyFiltered")} />
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="rounded-card bg-surface p-5 sm:p-6">
            <EmptyState
            icon={<BarChart3 />}
            title={t("history.emptyTitle")}
            description={t("history.emptyDetail")}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/timer"
                  className={`${buttonClass("primary", "sm")}`}
                >
                  <Play className="text-base" />
                  {t("history.openTimer")}
                </Link>
                <button
                  type="button"
                  onClick={() => cstimerFileRef.current?.click()}
                  className={`${buttonClass("secondary", "sm")}`}
                >
                  <FileUp className="text-base" />
                  {t("history.importCstimer")}
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`${buttonClass("secondary", "sm")}`}
                >
                  <FileUp className="text-base" />
                  {t("history.importJson")}
                </button>
              </div>
            }
          />
        </section>
      )}
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
                  {t("history.penalty")}
                </span>
                <Select
                  value={editPenalty}
                  onChange={event =>
                    setEditPenalty(event.target.value as SolvePenalty)
                  }
                >
                  <option value="none">{t("history.noPenalty")}</option>
                  <option value="+2">+2</option>
                  <option value="DNF">DNF</option>
                </Select>
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
                  <div className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mb-0">
                    {solutionError}
                  </div>
                </div>
              ) : null}
              <label className="col-span-12">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {t("history.note")}
                </span>
                <Textarea
                  value={editNote}
                  onChange={event => setEditNote(event.target.value)}

                  rows={3}
                />
              </label>
              <label className="col-span-12">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {t("history.tags")}
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
              {t("history.cancel")}
            </Button>
            <IconButton
              label={t("history.saveSolve")}
              icon={<Check className="text-base" />}
              onClick={saveEdit}
              className={`${buttonClass("primary", "md")}`}
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
            <Button
              variant="secondary"
              size="md"
              type="button"

              onClick={() => setDeleteTarget(null)}
            >
              {t("history.cancel")}
            </Button>
            <IconButton
              label={t("history.deleteSolve")}
              icon={<Trash2 className="text-base" />}
              className={`${buttonClass("secondary", "md")}`}
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
            <Button
              variant="secondary"
              size="md"
              type="button"

              onClick={() => setBulkDeleteOpen(false)}
            >
              {t("history.cancel")}
            </Button>
            <IconButton
              label={t("history.deleteSelected")}
              icon={<Trash2 className="text-base" />}
              className={`${buttonClass("secondary", "md")}`}
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

function SolveCard({
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
  const date = new Date(item.createdAt).toLocaleString(
    language === "vi" ? "vi-VN" : "en-US",
    { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
  const penaltyButton = (penalty: SolvePenalty, label: string, activeClass: string) => (
    <button
      type="button"
      onClick={() => onPenalty(item, penalty)}
      aria-pressed={item.penalty === penalty}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
        item.penalty === penalty ? activeClass : "text-muted hover:bg-surface-3 hover:text-ink"
      )}
    >
      {label}
    </button>
  );
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-panel p-4 transition-colors",
        selected ? "bg-primary-soft" : "bg-surface-2"
      )}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded accent-primary"
          checked={selected}
          onChange={onSelect}
          aria-label={t("history.selectSolve")}
        />
        <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold leading-none text-primary">
          {eventLabel}
        </span>
        <span className="ml-auto text-xs tabular-nums text-muted">{date}</span>
      </div>

      <div>
        <strong
          className={cn(
            "block text-2xl font-semibold tabular-nums tracking-tight",
            item.penalty === "DNF" ? "text-danger" : "text-ink"
          )}
        >
          {formatSolveResult(item)}
        </strong>
        <p className="mb-0 mt-0.5 text-xs text-muted">
          {[
            item.inspectionMs
              ? `Inspection ${(item.inspectionMs / 1000).toFixed(1)}s`
              : null,
            item.moves ? t("history.moveCount", { count: item.moves }) : null,
            item.note || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {bundle?.length ? (
        <details className="text-sm">
          <summary className="cursor-pointer font-mono text-muted">
            {t("history.multiBlindBundle", { count: bundle.length })}
          </summary>
          <ol className="mb-0 mt-2 pl-5 font-mono text-xs">
            {bundle.map((scramble, index) => (
              <li key={`${index}-${scramble}`} className="break-words">
                {scramble}
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <p
          className="mb-0 line-clamp-2 break-words font-mono text-xs leading-relaxed text-muted"
          title={item.inputKind === "scramble" ? item.input : undefined}
        >
          {item.inputKind === "scramble" ? item.input : t("history.sixFaceState")}
        </p>
      )}

      {item.tags.length ? (
        <div className="flex flex-wrap gap-1">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold leading-none text-ink"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-1">
        {penaltyButton("+2", "+2", "bg-warning-soft text-ink")}
        {penaltyButton("DNF", "DNF", "bg-danger-soft text-danger")}
        <IconButton
          label={t("history.editSolve")}
          icon={<Pencil className="text-base" />}
          onClick={onEdit}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-ink"
        />
        <IconButton
          label={t("history.deleteRow")}
          icon={<Trash2 className="text-base" />}
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-danger transition hover:bg-danger-soft"
        />
      </div>
    </article>
  );
}
