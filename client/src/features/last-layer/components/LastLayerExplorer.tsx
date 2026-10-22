/** One last-layer catalog drawer, shared with the Study SRS store. */
import { ChevronLeftIcon, ChevronRight, Dices, Search } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/BootstrapDialog";
import { PracticeGroupPreview } from "./PracticeGroupPreview";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

type Family = "all" | "zbll" | "1lll";
type Props = {
  catalog: LastLayerCatalogCase[];
  family: Family;
  selectedCase: LastLayerCatalogCase | null;
  masteredKeys: Set<string>;
  onFamily: (family: Family) => void;
  onSelect: (catalogCase: LastLayerCatalogCase) => void;
};

const keyOf = (catalogCase: LastLayerCatalogCase) => `${catalogCase.family}:${catalogCase.id}`;

/**
 * The catalog: every case of the Last Layer, grouped by family and by group.
 * It stays folded away until you ask for it, so the study page itself keeps
 * to one screen of work.
 */
export function LastLayerExplorer({ catalog, family, selectedCase, masteredKeys, onFamily, onSelect }: Props) {
  const { t } = useLanguage();
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);
  const [previewCase, setPreviewCase] = useState<LastLayerCatalogCase | null>(null);

  const families = useMemo(() => {
    const inFamily = catalog.filter((item) => family === "all" || item.family === family);
    const names = Array.from(new Set(inFamily.map((item) => item.group))).sort((a, b) => a.localeCompare(b));
    return names.map((name) => {
      const items = inFamily.filter((item) => item.group === name);
      const mastered = items.filter((item) => masteredKeys.has(keyOf(item))).length;
      return { name, mastered, total: items.length, previewState: items[0]?.state ?? "", items };
    });
  }, [catalog, family, masteredKeys]);

  const needle = query.trim().toLowerCase();
  const matchesQuery = (item: LastLayerCatalogCase) =>
    !needle || `${item.id} ${item.group} ${item.algorithm}`.toLowerCase().includes(needle);
  const isUnmastered = (item: LastLayerCatalogCase) => !masteredKeys.has(keyOf(item));

  const visibleGroups = useMemo(
    () => families.filter((entry) => entry.items.some((item) => matchesQuery(item) && (!onlyUnmastered || isUnmastered(item)))),
    [families, needle, onlyUnmastered],
  );

  const unmasteredCount = useMemo(
    () => catalog.filter((item) => (family === "all" || item.family === family) && isUnmastered(item)).length,
    [catalog, family, masteredKeys],
  );

  const openGroup = families.find((entry) => entry.name === group) ?? null;
  const openGroupCases = openGroup
    ? openGroup.items.filter((item) => matchesQuery(item) && (!onlyUnmastered || isUnmastered(item)))
    : [];

  const pickRandom = () => {
    const candidates = catalog.filter(
      (item) => (family === "all" || item.family === family) && isUnmastered(item) && matchesQuery(item),
    );
    if (candidates.length) onSelect(candidates[Math.floor(Math.random() * candidates.length)]);
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
    <details className="cfop-solver-details">
      <summary>
        <ChevronRight className="cfop-solver-details__chevron" aria-hidden="true" />
        <span>{t("study.catalogTitle")}</span>
        <small className="text-body-secondary ms-2">
          {t("study.catalogSummary", { cases: catalog.length, groups: families.length })}
        </small>
      </summary>

      <div className="cfop-solver-details__body">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="study-catalog-family">
              {t("study.familySelect")}
            </label>
            <select
              id="study-catalog-family"
              value={family}
              onChange={(event) => switchFamily(event.target.value as Family)}
              className="form-select"
            >
              <option value="all">ALL · ZBLL + 1LLL</option>
              <option value="zbll">ZBLL</option>
              <option value="1lll">1LLL</option>
            </select>
          </div>
          <div className="col-12 col-md-8">
            <label className="form-label" htmlFor="study-catalog-search">
              {t("study.searchCases")}
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <Search className="fs-5" />
              </span>
              <input
                id="study-catalog-search"
                value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 80))}
                placeholder={t("study.searchPlaceholder")}
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
          <button
            type="button"
            onClick={() => setOnlyUnmastered((value) => !value)}
            aria-pressed={onlyUnmastered}
            className={cn("btn btn-sm", onlyUnmastered ? "btn-primary" : "btn-outline-secondary")}
          >
            {onlyUnmastered ? t("study.unmasteredOnly") : t("study.allCases")}
          </button>
          <IconButton
            label={t("study.randomPractice")}
            icon={<Dices className="fs-6" />}
            onClick={pickRandom}
            disabled={!unmasteredCount}
            className="btn btn-outline-secondary btn-sm"
          />
          <span className="small text-body-secondary">
            {unmasteredCount} {t("study.unmasteredCount")}
          </span>
        </div>

        {openGroup ? (
          <div className="mt-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <IconButton
                label={t("study.allGroups")}
                icon={<ChevronLeftIcon className="fs-6" />}
                onClick={() => setGroup("")}
                className="btn btn-outline-secondary btn-sm"
              />
              <strong>
                {openGroup.name} · {openGroup.mastered}/{openGroup.total}
              </strong>
            </div>
            {openGroupCases.length ? (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
                {openGroupCases.map((catalogCase) => {
                  const mastered = masteredKeys.has(keyOf(catalogCase));
                  const active = selectedCase?.id === catalogCase.id && selectedCase?.family === catalogCase.family;
                  return (
                    <div key={`${catalogCase.family}:${catalogCase.id}`} className="col">
                      <div className={cn("card h-100", active && "border-primary")}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <PracticeGroupPreview
                              state={catalogCase.state}
                              label={catalogCase.id}
                              compact
                              onClick={() => setPreviewCase(catalogCase)}
                            />
                            {mastered ? (
                              <span className={active ? "badge text-bg-primary" : "badge text-bg-success"}>✓</span>
                            ) : null}
                          </div>
                          <strong className="d-block mt-3">{catalogCase.id}</strong>
                          <small className="text-body-secondary d-block">
                            {catalogCase.family.toUpperCase()} · {catalogCase.group}
                          </small>
                          <code className="d-block small text-body-secondary text-truncate mt-2" title={catalogCase.algorithm}>
                            {catalogCase.algorithm}
                          </code>
                          <button
                            type="button"
                            onClick={() => selectCase(catalogCase)}
                            className="btn btn-outline-primary btn-sm mt-3"
                          >
                            {t("study.studyThisCase")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="small text-body-secondary mb-0">{t("study.noCasesMatch")}</p>
            )}
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3 mt-1">
            {visibleGroups.map((entry) => {
              const percent = entry.total ? Math.round((entry.mastered / entry.total) * 100) : 0;
              return (
                <div key={entry.name} className="col">
                  <button
                    type="button"
                    onClick={() => setGroup(entry.name)}
                    className="card h-100 w-100 text-start border-0 bg-body-tertiary cfop-study-group"
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-2">
                        <PracticeGroupPreview state={entry.previewState} label={entry.name} compact />
                        <span className="flex-grow-1">
                          <strong className="d-block text-truncate">{entry.name}</strong>
                          <small className="text-body-secondary">
                            {entry.mastered}/{entry.total}
                          </small>
                        </span>
                      </div>
                      <span className="progress d-block mt-2">
                        <span className="progress-bar" style={{ width: `${percent}%` }}>
                          {percent}%
                        </span>
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
            {visibleGroups.length ? null : <p className="small text-body-secondary mb-0">{t("study.noCasesMatch")}</p>}
          </div>
        )}
      </div>

      <Dialog open={Boolean(previewCase)} onOpenChange={(open) => { if (!open) setPreviewCase(null); }}>
        <DialogContent className="w-100 overflow-hidden">
          <DialogHeader>
            <div>
              <DialogTitle>{previewCase ? `${previewCase.family.toUpperCase()} · ${previewCase.id}` : t("study.previewTitle")}</DialogTitle>
              <DialogDescription>{t("study.previewHint")}</DialogDescription>
            </div>
            <button type="button" className="btn-close" aria-label={t("study.closePreview")} onClick={() => setPreviewCase(null)} />
          </DialogHeader>
          {previewCase ? (
            <div className="modal-body d-flex flex-column align-items-center gap-3 p-3 p-sm-4 overflow-auto">
              <PracticeGroupPreview state={previewCase.state} label={previewCase.id} />
              <div className="text-center w-100">
                <strong>{previewCase.group}</strong>
                <code className="d-block small text-body-secondary mt-2 text-break">{previewCase.algorithm}</code>
              </div>
            </div>
          ) : null}
          <DialogFooter className="flex-column flex-sm-row">
            <button type="button" className="btn btn-outline-secondary w-100 flex-sm-grow-0" onClick={() => setPreviewCase(null)}>
              {t("study.close")}
            </button>
            {previewCase ? (
              <button type="button" className="btn btn-primary w-100 flex-sm-grow-0" onClick={() => selectCase(previewCase)}>
                {t("study.studyThisCase")}
              </button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </details>
  );
}
