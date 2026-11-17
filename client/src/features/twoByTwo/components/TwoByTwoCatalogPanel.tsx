/**
 * Browsable 2×2 catalog: searchable grid of cases with the 2×2 net preview.
 * Clicking a case pulls it into the practice card.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "@/components/ui/Icon";
import { CubeNet2x2 } from "@/components/common/CubeNet2x2";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TwoByTwoCatalogCase } from "../lib/twoByTwoCatalog";
import { cn } from "@/lib/utils";

const ALL = "all";

export function TwoByTwoCatalogPanel({
  cases,
  groups,
  masteredKeys,
  activeCase,
  onSelect,
}: {
  cases: readonly TwoByTwoCatalogCase[];
  groups: readonly string[];
  masteredKeys: Set<string>;
  activeCase: TwoByTwoCatalogCase | null;
  onSelect: (item: TwoByTwoCatalogCase) => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  // Reset the subset filter when the set (groups) changes — e.g. switching
  // from CLL (Sune …) to PBL (Adj / Diag) would otherwise filter everything
  // out.
  useEffect(() => {
    setFilter(ALL);
  }, [groups]);

  const visible = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return cases.filter(item => {
      if (filter !== ALL && item.group !== filter) return false;
      if (!needle) return true;
      return `${item.id} ${item.name} ${item.algorithm}`.toUpperCase().includes(needle);
    });
  }, [cases, filter, query]);

  return (
    <section className="rounded-card bg-surface" aria-label={t("twoByTwo.catalogLabel")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {t("twoByTwo.catalogTitle")}
          </p>
          <p className="text-sm text-muted">
            {t("twoByTwo.catalogHint", { count: visible.length })}
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
            onChange={event => setQuery(event.target.value)}
            placeholder={t("twoByTwo.searchPlaceholder")}
            aria-label={t("twoByTwo.searchPlaceholder")}
            className="h-10 w-56 max-w-full rounded-full bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus-visible:ring-4 focus-visible:ring-primary/20"
          />
        </label>
      </div>
      <div
        className="flex flex-wrap items-center gap-1.5 px-5 sm:px-6"
        role="group"
        aria-label={t("twoByTwo.filterLabel")}
      >
        {[ALL, ...groups].map(value => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
              filter === value
                ? "bg-primary text-on-primary hover:bg-primary-hover"
                : "bg-surface-2 text-ink hover:bg-surface-3",
            )}
          >
            {value === ALL ? t("cfop.filterAll") : value}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6 lg:grid-cols-6">
        {visible.map(item => {
          const mastered = masteredKeys.has(`${item.family}:${item.id}`);
          const selected = activeCase?.id === item.id;
          return (
            <button
              key={item.id}
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
              <CubeNet2x2 state={item.state} compact />
              <span className="mt-1.5 block truncate text-[11px] font-semibold text-ink">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted">{t("twoByTwo.emptyCases")}</p>
      ) : null}
    </section>
  );
}
