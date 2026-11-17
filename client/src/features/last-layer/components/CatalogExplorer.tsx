/**
 * The shared study-catalog drawer, used by the Last Layer and 2×2 lanes.
 * Generic over the case shape, the family options and the cube preview so
 * both lanes get the same learning tools: group progress bars, an
 * unmastered filter, a random-practice dice, bulk mark-as-learned and a
 * preview dialog. Stays folded away until you ask for it.
 */
import {
  ChevronLeftIcon,
  ChevronRight,
  Dices,
  Search,
} from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { buttonClass } from "@/components/ui/Button";

/** Any case row the catalog knows how to show: LL (zbll/1lll) or 2×2 (cll/pbl). */
export type CatalogExplorerCase = {
  family: string;
  id: string;
  group: string;
  algorithm: string;
  state: string;
  /** Display name for humans; falls back to the id. */
  name?: string;
};

export type CatalogExplorerPreviewProps = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
};

type Family = string;

const DEFAULT_FAMILY_OPTIONS = [
  { value: "all", label: "ALL · ZBLL + 1LLL" },
  { value: "zbll", label: "ZBLL" },
  { value: "1lll", label: "1LLL" },
] as const;

type Props = {
  catalog: readonly CatalogExplorerCase[];
  family: Family;
  selectedCase: CatalogExplorerCase | null;
  masteredKeys: Set<string>;
  onFamily: (family: Family) => void;
  onSelect: (catalogCase: CatalogExplorerCase) => void;
  /** Nhận tập hợp case đã thuộc mới sau một thao tác hàng loạt. */
  onMasteredChange?: (keys: Set<string>) => void;
  /** Options for the family select; pass null to hide it (parent already filters). */
  familyOptions?: readonly { value: string; label: string }[] | null;
  catalogTitle: string;
  previewHint: string;
  renderPreview: ComponentType<CatalogExplorerPreviewProps>;
};

const keyOf = (catalogCase: CatalogExplorerCase) =>
  `${catalogCase.family}:${catalogCase.id}`;

export function CatalogExplorer({
  catalog,
  family,
  selectedCase,
  masteredKeys,
  onFamily,
  onSelect,
  onMasteredChange,
  familyOptions = DEFAULT_FAMILY_OPTIONS,
  catalogTitle,
  previewHint,
  renderPreview: Preview,
}: Props) {
  const { t } = useLanguage();
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);
  const [previewCase, setPreviewCase] = useState<CatalogExplorerCase | null>(
    null
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const families = useMemo(() => {
    const inFamily = catalog.filter(
      item => family === "all" || item.family === family
    );
    const names = Array.from(new Set(inFamily.map(item => item.group))).sort(
      (a, b) => a.localeCompare(b)
    );
    return names.map(name => {
      const items = inFamily.filter(item => item.group === name);
      const mastered = items.filter(item =>
        masteredKeys.has(keyOf(item))
      ).length;
      return {
        name,
        mastered,
        total: items.length,
        previewState: items[0]?.state ?? "",
        items,
      };
    });
  }, [catalog, family, masteredKeys]);

  const needle = query.trim().toLowerCase();
  const matchesQuery = (item: CatalogExplorerCase) =>
    !needle ||
    `${item.id} ${item.group} ${item.algorithm}`.toLowerCase().includes(needle);
  const isUnmastered = (item: CatalogExplorerCase) =>
    !masteredKeys.has(keyOf(item));

  const visibleGroups = useMemo(
    () =>
      families.filter(entry =>
        entry.items.some(
          item => matchesQuery(item) && (!onlyUnmastered || isUnmastered(item))
        )
      ),
    [families, needle, onlyUnmastered]
  );

  const unmasteredCount = useMemo(
    () =>
      catalog.filter(
        item =>
          (family === "all" || item.family === family) && isUnmastered(item)
      ).length,
    [catalog, family, masteredKeys]
  );

  const openGroup = families.find(entry => entry.name === group) ?? null;
  const openGroupCases = openGroup
    ? openGroup.items.filter(
        item => matchesQuery(item) && (!onlyUnmastered || isUnmastered(item))
      )
    : [];

  const pickRandom = () => {
    const candidates = catalog.filter(
      item =>
        (family === "all" || item.family === family) &&
        isUnmastered(item) &&
        matchesQuery(item)
    );
    if (candidates.length)
      onSelect(candidates[Math.floor(Math.random() * candidates.length)]);
  };

  const switchFamily = (next: Family) => {
    onFamily(next);
    setGroup("");
    setSelectedKeys(new Set());
    setSelectionMode(false);
  };

  const openGroupName = (name: string) => {
    setGroup(name);
    setSelectedKeys(new Set());
    setSelectionMode(false);
  };

  const toggleSelected = (catalogCase: CatalogExplorerCase) => {
    const key = keyOf(catalogCase);
    setSelectedKeys(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllVisible = () =>
    setSelectedKeys(new Set(openGroupCases.map(keyOf)));
  const clearSelection = () => setSelectedKeys(new Set());

  const markSelected = (mastered: boolean) => {
    if (!onMasteredChange || selectedKeys.size === 0) return;
    const next = new Set(masteredKeys);
    for (const key of selectedKeys) {
      if (mastered) next.add(key);
      else next.delete(key);
    }
    onMasteredChange(next);
    setSelectedKeys(new Set());
    setSelectionMode(false);
  };

  const selectCase = (catalogCase: CatalogExplorerCase) => {
    onSelect(catalogCase);
    setPreviewCase(null);
  };

  return (
    <details className="group rounded-card bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-t-card px-5 py-4 text-sm font-semibold text-ink transition hover:text-primary [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="text-base text-muted transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span>{catalogTitle}</span>
        <small className="ml-2 text-muted">
          {t("study.catalogSummary", {
            cases: catalog.length,
            groups: families.length,
          })}
        </small>
      </summary>

      <div className="px-5 py-4">
        <div className="grid gap-4 md:grid-cols-12">
          {familyOptions !== null ? (
            <div className="md:col-span-4">
              <label
                className="mb-1.5 block text-sm font-medium text-ink"
                htmlFor="study-catalog-family"
              >
                {t("study.familySelect")}
              </label>
              <Select
                id="study-catalog-family"
                value={family}
                onChange={event => switchFamily(event.target.value)}
              >
                {(familyOptions ?? DEFAULT_FAMILY_OPTIONS).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="hidden md:col-span-4 md:block" aria-hidden="true" />
          )}
          <div
            className={
              familyOptions !== null ? "md:col-span-8" : "md:col-span-12"
            }
          >
            <label
              className="mb-1.5 block text-sm font-medium text-ink"
              htmlFor="study-catalog-search"
            >
              {t("study.searchCases")}
            </label>
            <div className="flex w-full items-stretch">
              <span className="inline-flex items-center bg-surface-2 px-3 text-sm text-muted first:rounded-l-field last:rounded-r-field">
                <Search className="text-lg" />
              </span>
              <Input
                id="study-catalog-search"
                value={query}
                onChange={event => setQuery(event.target.value.slice(0, 80))}
                placeholder={t("study.searchPlaceholder")}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center mt-4">
          <Button
            type="button"
            variant={onlyUnmastered ? "primary" : "secondary"}
            size="sm"
            onClick={() => setOnlyUnmastered(value => !value)}
            aria-pressed={onlyUnmastered}
          >
            {onlyUnmastered ? t("study.unmasteredOnly") : t("study.allCases")}
          </Button>
          <IconButton
            label={t("study.randomPractice")}
            icon={<Dices className="text-base" />}
            onClick={pickRandom}
            disabled={!unmasteredCount}
            className={`${buttonClass("secondary", "sm")}`}
          />
          <span className="text-sm text-muted">
            {unmasteredCount} {t("study.unmasteredCount")}
          </span>
        </div>

        {openGroup ? (
          <div className="mt-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <IconButton
                label={t("study.allGroups")}
                icon={<ChevronLeftIcon className="text-base" />}
                onClick={() => openGroupName("")}
                className="inline-flex items-center justify-center rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2"
              />
              <strong className="text-sm">
                {openGroup.name} · {openGroup.mastered}/{openGroup.total}
              </strong>
              {onMasteredChange ? (
                <Button
                  type="button"
                  variant={selectionMode ? "primary" : "secondary"}
                  size="sm"
                  aria-pressed={selectionMode}
                  className="ml-auto"
                  onClick={() => {
                    setSelectionMode(value => !value);
                    setSelectedKeys(new Set());
                  }}
                >
                  {selectionMode ? t("study.bulkDone") : t("study.bulkSelect")}
                </Button>
              ) : null}
            </div>
            {selectionMode ? (
              <div className="sticky bottom-3 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-full bg-ink px-4 py-2 text-canvas">
                <span className="text-xs font-semibold tabular-nums">
                  {t("study.bulkSelected", {
                    count: selectedKeys.size,
                    total: openGroupCases.length,
                  })}
                </span>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-xs font-semibold text-canvas/80 transition hover:bg-white/10 hover:text-canvas"
                  onClick={selectAllVisible}
                >
                  {t("study.bulkSelectAll")}
                </button>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-xs font-semibold text-canvas/80 transition hover:bg-white/10 hover:text-canvas"
                  onClick={clearSelection}
                >
                  {t("study.bulkClear")}
                </button>
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-warning px-3 py-1.5 text-xs font-semibold text-on-warning transition disabled:opacity-40"
                    disabled={selectedKeys.size === 0}
                    onClick={() => markSelected(true)}
                  >
                    {t("study.bulkMark", { count: selectedKeys.size })}
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-canvas/90 transition hover:bg-white/10 disabled:opacity-40"
                    disabled={selectedKeys.size === 0}
                    onClick={() => markSelected(false)}
                  >
                    {t("study.bulkUnmark", { count: selectedKeys.size })}
                  </button>
                </span>
              </div>
            ) : null}
            {openGroupCases.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openGroupCases.map(catalogCase => {
                  const mastered = masteredKeys.has(keyOf(catalogCase));
                  const active =
                    selectedCase?.id === catalogCase.id &&
                    selectedCase?.family === catalogCase.family;
                  const selected = selectedKeys.has(keyOf(catalogCase));
                  return (
                    <div key={`${catalogCase.family}:${catalogCase.id}`}>
                      <div
                        className={cn(
                          "h-full rounded-card bg-surface",
                          selectionMode && "cursor-pointer"
                        )}
                        onClick={event => {
                          if (!selectionMode) return;
                          if (
                            (event.target as HTMLElement).closest(
                              "button, a, input, label, select, textarea"
                            )
                          )
                            return;
                          toggleSelected(catalogCase);
                        }}
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <Preview
                              state={catalogCase.state}
                              label={catalogCase.id}
                              compact
                              onClick={() => setPreviewCase(catalogCase)}
                            />
                            <div className="flex shrink-0 items-center gap-2">
                              {selectionMode ? (
                                <Checkbox
                                  checked={selected}
                                  onChange={() => toggleSelected(catalogCase)}
                                  ariaLabel={`${t("study.bulkSelect")} ${catalogCase.id}`}
                                />
                              ) : null}
                              {mastered ? (
                                <span
                                  className={
                                    active
                                      ? "inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-on-primary"
                                      : "inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-on-success"
                                  }
                                >
                                  ✓
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <strong className="mt-4 block">
                            {catalogCase.name ?? catalogCase.id}
                          </strong>
                          <small className="text-muted mt-1 block">
                            {catalogCase.family.toUpperCase()} ·{" "}
                            {catalogCase.group}
                          </small>
                          <code
                            className="text-muted mt-2 block truncate text-sm"
                            title={catalogCase.algorithm}
                          >
                            {catalogCase.algorithm}
                          </code>
                          {selectionMode ? null : (
                            <Button
                              type="button"
                              variant="outline"
                              size="plain"
                              className="mt-4 px-3 py-1.5 text-xs"
                              onClick={() => selectCase(catalogCase)}
                            >
                              {t("study.studyThisCase")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted mb-0">
                {t("study.noCasesMatch")}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-1 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {visibleGroups.map(entry => {
              const percent = entry.total
                ? Math.round((entry.mastered / entry.total) * 100)
                : 0;
              return (
                <div key={entry.name}>
                  <button
                    type="button"
                    onClick={() => openGroupName(entry.name)}
                    className="h-full w-full rounded-card bg-surface-2 px-5 py-4 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <Preview
                        state={entry.previewState}
                        label={entry.name}
                        compact
                      />
                      <span className="grow">
                        <strong className="block truncate">{entry.name}</strong>
                        <small className="text-muted">
                          {entry.mastered}/{entry.total}
                        </small>
                      </span>
                    </div>
                    <span className="bg-surface-3 mt-3 block h-2 w-full overflow-hidden rounded-full">
                      <span
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </button>
                </div>
              );
            })}
            {visibleGroups.length ? null : (
              <p className="text-sm text-muted mb-0">
                {t("study.noCasesMatch")}
              </p>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(previewCase)}
        onOpenChange={open => {
          if (!open) setPreviewCase(null);
        }}
      >
        <DialogContent className="w-full overflow-hidden">
          <DialogHeader>
            <div>
              <DialogTitle>
                {previewCase
                  ? previewCase.name ??
                    `${previewCase.family.toUpperCase()} · ${previewCase.id}`
                  : t("study.previewTitle")}
              </DialogTitle>
              <DialogDescription>{previewHint}</DialogDescription>
            </div>
            <IconButton
              className="ml-auto h-8 w-8 shrink-0 text-muted hover:bg-surface-3 hover:text-ink"
              label={t("study.closePreview")}
              icon={null}
              onClick={() => setPreviewCase(null)}
            />
          </DialogHeader>
          {previewCase ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex flex-col items-center gap-4 p-4 sm:p-6 overflow-auto">
              <Preview state={previewCase.state} label={previewCase.id} />
              <div className="text-center w-full">
                <strong>{previewCase.group}</strong>
                <code className="block text-sm text-muted mt-2 break-words">
                  {previewCase.algorithm}
                </code>
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex-col sm:flex-row">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:grow-0"
              type="button"

              onClick={() => setPreviewCase(null)}
            >
              {t("study.close")}
            </Button>
            {previewCase ? (
              <Button
                variant="primary"
                size="md"
                className="w-full sm:grow-0"
                type="button"

                onClick={() => selectCase(previewCase)}
              >
                {t("study.studyThisCase")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  );
}
