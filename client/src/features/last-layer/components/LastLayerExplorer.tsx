/** One last-layer catalog drawer, shared with the Study SRS store. */
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
import { PracticeGroupPreview } from "./PracticeGroupPreview";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/FormControls";
import { Textarea } from "@/components/ui/FormControls";

type Family = "all" | "zbll" | "1lll";
type Props = {
  catalog: LastLayerCatalogCase[];
  family: Family;
  selectedCase: LastLayerCatalogCase | null;
  masteredKeys: Set<string>;
  onFamily: (family: Family) => void;
  onSelect: (catalogCase: LastLayerCatalogCase) => void;
};

const keyOf = (catalogCase: LastLayerCatalogCase) =>
  `${catalogCase.family}:${catalogCase.id}`;

/**
 * The catalog: every case of the Last Layer, grouped by family and by group.
 * It stays folded away until you ask for it, so the study page itself keeps
 * to one screen of work.
 */
export function LastLayerExplorer({
  catalog,
  family,
  selectedCase,
  masteredKeys,
  onFamily,
  onSelect,
}: Props) {
  const { t } = useLanguage();
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);
  const [previewCase, setPreviewCase] = useState<LastLayerCatalogCase | null>(
    null
  );

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
  const matchesQuery = (item: LastLayerCatalogCase) =>
    !needle ||
    `${item.id} ${item.group} ${item.algorithm}`.toLowerCase().includes(needle);
  const isUnmastered = (item: LastLayerCatalogCase) =>
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
  };

  const selectCase = (catalogCase: LastLayerCatalogCase) => {
    onSelect(catalogCase);
    setPreviewCase(null);
  };

  return (
    <details className="group rounded-card border border-line/80 bg-surface shadow-soft">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-t-card border-b border-line px-5 py-4 text-sm font-semibold text-ink transition hover:text-primary [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="text-base text-muted transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span>{t("study.catalogTitle")}</span>
        <small className="ml-2 text-muted">
          {t("study.catalogSummary", {
            cases: catalog.length,
            groups: families.length,
          })}
        </small>
      </summary>

      <div className="border-t border-line px-5 py-4">
        <div className="grid gap-4 md:grid-cols-12">
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
              onChange={event => switchFamily(event.target.value as Family)}
            >
              <option value="all">ALL · ZBLL + 1LLL</option>
              <option value="zbll">ZBLL</option>
              <option value="1lll">1LLL</option>
            </Select>
          </div>
          <div className="md:col-span-8">
            <label
              className="mb-1.5 block text-sm font-medium text-ink"
              htmlFor="study-catalog-search"
            >
              {t("study.searchCases")}
            </label>
            <div className="flex w-full items-stretch">
              <span className="inline-flex items-center border border-line bg-surface-2 px-3 text-sm text-muted first:rounded-l-field last:rounded-r-field">
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
          />
          <span className="text-sm text-muted">
            {unmasteredCount} {t("study.unmasteredCount")}
          </span>
        </div>

        {openGroup ? (
          <div className="mt-4">
            <div className="mb-4 flex items-center gap-2">
              <IconButton
                label={t("study.allGroups")}
                icon={<ChevronLeftIcon className="text-base" />}
                onClick={() => setGroup("")}
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2"
              />
              <strong className="text-sm">
                {openGroup.name} · {openGroup.mastered}/{openGroup.total}
              </strong>
            </div>
            {openGroupCases.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openGroupCases.map(catalogCase => {
                  const mastered = masteredKeys.has(keyOf(catalogCase));
                  const active =
                    selectedCase?.id === catalogCase.id &&
                    selectedCase?.family === catalogCase.family;
                  return (
                    <div key={`${catalogCase.family}:${catalogCase.id}`}>
                      <div
                        className={cn(
                          "h-full rounded-card border border-line/80 bg-surface shadow-soft",
                          active && "border-primary"
                        )}
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <PracticeGroupPreview
                              state={catalogCase.state}
                              label={catalogCase.id}
                              compact
                              onClick={() => setPreviewCase(catalogCase)}
                            />
                            {mastered ? (
                              <span
                                className={
                                  active
                                    ? "inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white"
                                    : "inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white"
                                }
                              >
                                ✓
                              </span>
                            ) : null}
                          </div>
                          <strong className="mt-4 block">
                            {catalogCase.id}
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
                          <Button
                            type="button"
                            variant="outline"
                            size="plain"
                            className="mt-4 px-3 py-1.5 text-xs"
                            onClick={() => selectCase(catalogCase)}
                          >
                            {t("study.studyThisCase")}
                          </Button>
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
                    onClick={() => setGroup(entry.name)}
                    className="h-full w-full rounded-card border border-line/80 bg-surface-2 px-5 py-4 text-left shadow-soft transition hover:border-primary"
                  >
                    <div className="flex items-center gap-2">
                      <PracticeGroupPreview
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
                  ? `${previewCase.family.toUpperCase()} · ${previewCase.id}`
                  : t("study.previewTitle")}
              </DialogTitle>
              <DialogDescription>{t("study.previewHint")}</DialogDescription>
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
              <PracticeGroupPreview
                state={previewCase.state}
                label={previewCase.id}
              />
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
