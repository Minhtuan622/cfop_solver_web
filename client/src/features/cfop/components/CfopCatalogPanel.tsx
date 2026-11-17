/**
 * Browsable CFOP catalog: searchable grid of every F2L/OLL/PLL case with a
 * live cube-net preview. Clicking a case pulls it into the practice card.
 */
import { useMemo, useState } from "react";
import { Check, Search } from "@/components/ui/Icon";
import { CubeNet } from "@/components/common/CubeNet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CfopCatalogCase } from "../lib/cfopCatalog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 48;

type CfopFilter = "all" | "f2l" | "oll" | "pll";
const FILTERS: readonly CfopFilter[] = ["all", "f2l", "oll", "pll"];

export function CfopCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
}: {
  cases: readonly CfopCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: CfopCatalogCase | null;
  onSelect: (item: CfopCatalogCase) => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<CfopFilter>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return cases.filter(item => {
      if (filter !== "all" && item.family !== filter) return false;
      if (!needle) return true;
      return `${item.id} ${item.name} ${item.algorithm}`.toUpperCase().includes(needle);
    });
  }, [cases, filter, query]);

  const displayed = visible.slice(0, visibleCount);
  const filterLabel = (value: CfopFilter) =>
    value === "all"
      ? t("cfop.filterAll")
      : value === "f2l"
        ? "F2L"
        : value === "oll"
          ? "OLL"
          : "PLL";

  return (
    <section className="rounded-card bg-surface" aria-label={t("cfop.catalogLabel")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {t("cfop.catalogTitle")}
          </p>
          <p className="text-sm text-muted">
            {t("cfop.catalogHint", { count: visible.length })}
          </p>
        </div>
        <label className="relative block min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder={t("cfop.searchPlaceholder")}
            aria-label={t("cfop.searchPlaceholder")}
            className="h-10 w-56 max-w-full rounded-full bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus-visible:ring-4 focus-visible:ring-primary/20"
          />
        </label>
      </div>
      <div
        className="flex flex-wrap items-center gap-1.5 px-5 sm:px-6"
        role="group"
        aria-label={t("cfop.filterLabel")}
      >
        {FILTERS.map(value => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
              setVisibleCount(PAGE_SIZE);
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
              filter === value
                ? "bg-primary text-on-primary hover:bg-primary-hover"
                : "bg-surface-2 text-ink hover:bg-surface-3",
            )}
          >
            {filterLabel(value)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6 lg:grid-cols-6">
        {displayed.map(item => {
          const mastered = masteredKeys.has(`${item.family}:${item.id}`);
          const selected = activeCase?.id === item.id && activeCase.family === item.family;
          return (
            <button
              key={`${item.family}:${item.id}`}
              type="button"
              onClick={() => onSelect(item)}
              aria-pressed={selected}
              className={cn(
                "group relative rounded-2xl bg-surface-2 p-2.5 text-left transition focus-visible:ring-4 focus-visible:ring-primary/20 hover:bg-surface-3",
                selected && "ring-4 ring-primary/40",
              )}
            >
              {mastered ? (
                <span
                  className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-success text-on-success"
                  title={t("study.mastered")}
                  aria-label={t("study.mastered")}
                >
                  <Check className="text-xs" />
                </span>
              ) : null}
              <CubeNet
                state={item.state}
                compact
                lastLayerOnly={item.family === "oll" || item.family === "pll"}
              />
              <span className="mt-1.5 block truncate text-[11px] font-semibold text-ink">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
      {visible.length > visibleCount ? (
        <div className="flex justify-center px-5 pb-5">
          <button
            type="button"
            className="rounded-full bg-surface-2 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-surface-3 focus-visible:ring-4 focus-visible:ring-primary/20"
            onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
          >
            {t("cfop.showMore", { count: visible.length - visibleCount })}
          </button>
        </div>
      ) : null}
      {visible.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">{t("cfop.emptyCases")}</p>
      ) : null}
    </section>
  );
}
