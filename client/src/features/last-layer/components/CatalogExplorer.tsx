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
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { buttonClass } from "@/components/ui/Button";
import { readFocusSet, writeFocusSet } from "../lib/focusSet";
import type { CatalogExplorerCase, CatalogExplorerPreviewProps, CatalogGroupEntry } from "../lib/catalogExplorerTypes";
import { CatalogBulkBar } from "./CatalogBulkBar";
import { CatalogCaseCard } from "./CatalogCaseCard";
import { CatalogFocusPanel } from "./CatalogFocusPanel";
import { CatalogGroupGrid } from "./CatalogGroupGrid";
import { CatalogPreviewDialog } from "./CatalogPreviewDialog";

export type {
  CatalogExplorerCase,
  CatalogExplorerPreviewProps,
} from "../lib/catalogExplorerTypes";

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
  /**
   * When provided, the preview dialog renders this instead of `renderPreview`
   * (used to show the 3D replay of the case algorithm on the cube lanes).
   */
  dialogPreview?: ComponentType<CatalogExplorerPreviewProps>;
  /** When set (and `dialogPreview` is provided), the dialog footer shows a replay button. */
  dialogReplayLabel?: string;
  /** When set, the catalog narrows to the user's stored focus groups for this lane key. */
  focusStorageKey?: string;
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
  dialogPreview,
  dialogReplayLabel,
  focusStorageKey,
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

  const [replayToken, setReplayToken] = useState(0);
  const DialogPreview = dialogPreview ?? Preview;
  const [focusSet, setFocusSet] = useState<string[]>(() =>
    focusStorageKey ? readFocusSet(focusStorageKey) : []
  );
  const [focusOpen, setFocusOpen] = useState(false);
  useEffect(() => {
    if (focusStorageKey) writeFocusSet(focusStorageKey, focusSet);
  }, [focusSet, focusStorageKey]);
  const families = useMemo((): CatalogGroupEntry[] => {
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
        family: items[0]?.family,
        meta: items[0]?.meta,
        items,
      };
    });
  }, [catalog, family, masteredKeys]);

  const needle = query.trim().toLowerCase();
  const matchesQuery = (item: CatalogExplorerCase) =>
    !needle ||
    `${item.id} ${item.name ?? ""} ${item.group} ${item.algorithm}`
      .toLowerCase()
      .includes(needle);
  const isUnmastered = (item: CatalogExplorerCase) =>
    !masteredKeys.has(keyOf(item));

  const focusActive = focusSet.length > 0;
  const inFocus = (item: CatalogExplorerCase) =>
    !focusActive || focusSet.includes(item.group);
  const visibleFamilies = useMemo(
    () =>
      focusActive
        ? families.filter(entry => focusSet.includes(entry.name))
        : families,
    [families, focusActive, focusSet]
  );

  const visibleGroups = useMemo(
    () =>
      visibleFamilies.filter(entry =>
        entry.items.some(
          item => matchesQuery(item) && (!onlyUnmastered || isUnmastered(item))
        )
      ),
    [visibleFamilies, needle, onlyUnmastered]
  );

  const unmasteredCount = useMemo(
    () =>
      catalog.filter(
        item =>
          (family === "all" || item.family === family) &&
          isUnmastered(item) &&
          inFocus(item)
      ).length,
    [catalog, family, masteredKeys, focusActive, focusSet]
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
        matchesQuery(item) &&
        inFocus(item)
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
            groups: visibleFamilies.length,
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
            variant={onlyUnmastered ? "primary" : "soft"}
            size="sm"
            onClick={() => setOnlyUnmastered(value => !value)}
            aria-pressed={onlyUnmastered}
          >
            {onlyUnmastered ? t("study.unmasteredOnly") : t("study.allCases")}
          </Button>
          {focusStorageKey ? (
            <Button
              type="button"
              variant={focusActive ? "primary" : "soft"}
              size="sm"
              onClick={() => setFocusOpen(value => !value)}
              aria-pressed={focusActive}
            >
              {focusActive
                ? t("study.focusSetActive", { count: focusSet.length })
                : t("study.focusSet")}
            </Button>
          ) : null}
          <IconButton
            label={t("study.randomPractice")}
            icon={<Dices className="text-base" />}
            onClick={pickRandom}
            disabled={!unmasteredCount}
            className={`${buttonClass("soft", "sm")}`}
          />
          <span className="text-sm text-muted">
            {unmasteredCount} {t("study.unmasteredCount")}
          </span>
        </div>

        {focusStorageKey && focusOpen ? (
          <CatalogFocusPanel
            families={families}
            focusSet={focusSet}
            setFocusSet={setFocusSet}
          />
        ) : null}

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
              <CatalogBulkBar
                selectedCount={selectedKeys.size}
                total={openGroupCases.length}
                onSelectAll={selectAllVisible}
                onClear={clearSelection}
                onMark={markSelected}
              />
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
                      <CatalogCaseCard
                        catalogCase={catalogCase}
                        mastered={mastered}
                        active={active}
                        selected={selected}
                        selectionMode={selectionMode}
                        Preview={Preview}
                        replayToken={replayToken}
                        onToggleSelected={() => toggleSelected(catalogCase)}
                        onPreview={() => setPreviewCase(catalogCase)}
                        onStudy={() => selectCase(catalogCase)}
                      />
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
          <CatalogGroupGrid
            groups={visibleGroups}
            Preview={Preview}
            onOpenGroup={openGroupName}
          />
        )}
      </div>

      <CatalogPreviewDialog
        previewCase={previewCase}
        previewHint={previewHint}
        DialogPreview={DialogPreview}
        replayToken={replayToken}
        canReplay={Boolean(dialogPreview)}
        replayLabel={dialogReplayLabel}
        onClose={() => setPreviewCase(null)}
        onReplay={() => setReplayToken(token => token + 1)}
        onStudy={selectCase}
      />
    </details>
  );
}
