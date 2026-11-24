import { ArrowLeft, Trash2 } from "@/components/ui/Icon";
import { Link } from "wouter";
import {
  deleteSolveHistory,
  deleteSolveHistoryMany,
  exportSolveHistory,
  exportCstimerSolveHistory,
  importSolveHistory,
  importCstimerSolveHistory,
  readSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
  updateSolveHistory,
} from "@/lib/solveHistory";
import { EmptyState, IconButton } from "@/components/ui/StudioUI";
import { Checkbox } from "@/components/ui/Checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { downloadFile as saveFile } from "@/lib/browserDownload";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/StudioUI";
import {
  ConfirmDeleteDialog,
  HISTORY_PAGE_SIZE,
  HistoryEmptyState,
  HistoryFilters,
  HistoryPhaseTrendChart,
  HistoryStatTiles,
  HistoryTransferMenu,
  HistoryTrendChart,
  SolveCard,
  SolveEditDialog,
  filterHistory,
  historyCsv,
  historyTags,
  historyTrend,
  phaseTrend,
  useSolveEditor,
  validTimes,
  type HistoryFilter,
} from "@/features/history";

export default function History() {
  const { language, t } = useLanguage();
  const [entries, setEntries] = useState<SolveHistoryEntry[]>(() =>
    readSolveHistory()
  );
  const [filter, setFilter] = useState<HistoryFilter>({
    query: "",
    tag: "all",
    eventFilter: "all",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const editor = useSolveEditor({
    onSaved: setEntries,
    invalidSolutionMessage: t("history.invalidSolution"),
  });
  const [deleteTarget, setDeleteTarget] = useState<SolveHistoryEntry | null>(
    null
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [cstimerMessage, setCstimerMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cstimerFileRef = useRef<HTMLInputElement>(null);
  const tags = useMemo(() => historyTags(entries), [entries]);
  const filtered = useMemo(
    () => filterHistory(entries, filter),
    [entries, filter]
  );
  const valid = useMemo(() => validTimes(filtered), [filtered]);
  const chart = useMemo(() => historyTrend(filtered), [filtered]);
  const phaseChart = useMemo(() => phaseTrend(filtered), [filtered]);
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);
  const visibleEntries = filtered.slice(0, visibleCount);
  const allSelected =
    filtered.length > 0 && filtered.every(item => selectedIds.has(item.id));
  const changeFilter = (patch: Partial<HistoryFilter>) => {
    setFilter(current => ({ ...current, ...patch }));
    setVisibleCount(HISTORY_PAGE_SIZE);
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
      historyCsv(entries),
    );
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
  const onExportJson = () =>
    saveFile(
      "cfop-solve-history.json",
      "application/json",
      JSON.stringify(exportSolveHistory(), null, 2)
    );
  const onExportCstimer = () => {
    saveFile(
      "cfop-solve-history-cstimer.json",
      "application/json",
      JSON.stringify(exportCstimerSolveHistory(), null, 2),
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <PageHeader
        title={t("history.title")}
        description={t("history.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <HistoryTransferMenu
              onImportJson={() => fileRef.current?.click()}
              onImportCstimer={() => cstimerFileRef.current?.click()}
              onExportJson={onExportJson}
              onExportCstimer={onExportCstimer}
              onExportCsv={exportCsv}
            />
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
          <HistoryStatTiles filtered={filtered} valid={valid} />

          <HistoryTrendChart chart={chart} />

          <HistoryPhaseTrendChart rows={phaseChart} />

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
            <HistoryFilters filter={filter} tags={tags} onChange={changeFilter} />

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
                      onEdit={() => editor.open(item)}
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
                      onClick={() => setVisibleCount(count => count + HISTORY_PAGE_SIZE)}
                    >
                      {t("history.showMore", {
                        count: Math.min(HISTORY_PAGE_SIZE, filtered.length - visibleCount),
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
        <HistoryEmptyState
          onImportCstimer={() => cstimerFileRef.current?.click()}
          onImportJson={() => fileRef.current?.click()}
        />
      )}
      <SolveEditDialog editor={editor} />
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title={t("history.deleteTitle")}
        description={t("history.deleteDetail")}
        confirmLabel={t("history.deleteSolve")}
        onConfirm={() => {
          if (deleteTarget)
            setEntries(deleteSolveHistory(deleteTarget.id));
          setDeleteTarget(null);
        }}
      />
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("history.bulkDeleteTitle")}
        description={t("history.bulkDeleteDetail")}
        confirmLabel={t("history.deleteSelected")}
        onConfirm={() => {
          setEntries(deleteSolveHistoryMany(selectedIds));
          setSelectedIds(new Set());
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}
