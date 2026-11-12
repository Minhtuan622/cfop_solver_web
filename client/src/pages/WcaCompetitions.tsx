import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  LoadingTransition,
  PageHeader,
  RefreshIndicator,
  SkeletonList,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import { Calendar3, ExternalLink, Trophy } from "@/components/ui/Icon";
import { trpc } from "@/lib/trpc";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import {
  WcaCalendarFilters,
  WcaCompetitionList,
  WcaWorldRecords,
  groupByMonth,
  matchesQuery,
} from "@/features/wca";

const WCA_CALENDAR_URL = "https://www.worldcubeassociation.org/competitions";

export default function WcaCompetitions() {
  const { language, t } = useLanguage();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [countryIso2, setCountryIso2] = useState("");
  const [query, setQuery] = useState("");

  const PAGE_SIZE = 24;
  const [page, setPage] = useState(1);

  const countriesQuery = trpc.wca.countries.useQuery(undefined, {
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
  const recordsQuery = trpc.wca.worldRecords.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const calendarInput = useMemo(() => {
    const startMonth = month === 0 ? 1 : month;
    const endMonth = month === 0 ? 12 : month;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
      end: `${year}-${String(endMonth).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`,
      countryIso2: countryIso2 || null,
    };
  }, [year, month, countryIso2]);
  const rangeIsValid = true;
  const competitionsQuery = trpc.wca.competitions.useQuery(calendarInput, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const competitions = competitionsQuery.data;
  const visible = useMemo(
    () =>
      (competitions ?? []).filter(competition =>
        matchesQuery(competition, query)
      ),
    [competitions, query]
  );
  useEffect(() => setPage(1), [year, month, countryIso2, query]);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedVisible = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const groups = useMemo(
    () => groupByMonth(paginatedVisible),
    [paginatedVisible]
  );

  const resetFilters = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setCountryIso2("");
    setQuery("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <section
        className="relative overflow-hidden rounded-3xl border border-line/80 bg-surface px-5 py-6 shadow-soft sm:px-8"
        aria-labelledby="wca-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(91,91,214,0.14),transparent_55%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 flex-1 basis-72">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {t("wca.eyebrow")}
            </p>
            <h1
              id="wca-title"
              className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            >
              {t("wca.title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
              {t("wca.description")}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2 text-ink">
                <Calendar3 className="text-primary" aria-hidden="true" />
                {competitions?.length
                  ? t("wca.resultsCount", { count: competitions.length })
                  : t("wca.loading")}
              </span>
              <span className="inline-flex items-center gap-2 text-ink">
                <Trophy className="text-warning" aria-hidden="true" />
                {t("wca.records.count", {
                  count: recordsQuery.data?.length ?? 17,
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3" aria-hidden="true">
            <div className="grid grid-cols-3 gap-1.5 opacity-70">
              {Array.from({ length: 9 }, (_, index) => (
                <span
                  key={index}
                  className="aspect-square rounded-[0.3rem] bg-surface-3"
                />
              ))}
            </div>
            <a
              href={WCA_CALENDAR_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("wca.openCalendar")}
              <ExternalLink className="ml-1" />
            </a>
          </div>
        </div>
      </section>

      <WcaWorldRecords
        records={recordsQuery.data}
        isLoading={recordsQuery.isLoading}
        isError={recordsQuery.isError}
        error={recordsQuery.error}
      />

      <WcaCalendarFilters
        year={year}
        month={month}
        countryIso2={countryIso2}
        countries={countriesQuery.data ?? []}
        countriesLoading={countriesQuery.isLoading}
        query={query}
        shownCount={visible.length}
        totalCount={competitions?.length ?? 0}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onCountryChange={setCountryIso2}
        onQueryChange={setQuery}
        onReset={resetFilters}
      />

      <section className="mt-8" aria-labelledby="wca-agenda-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="wca-agenda-title"
              className="text-base font-semibold tracking-tight text-ink"
            >
              {t("wca.agendaTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {t("wca.agendaSubtitle", { count: visible.length })}
            </p>
          </div>
          {competitionsQuery.isFetching ? (
            <RefreshIndicator label={t("wca.refreshing")} />
          ) : null}
        </div>

        {competitionsQuery.isLoading ? (
          <SkeletonList rows={6} label={t("wca.loading")} />
        ) : null}

        {competitionsQuery.isError ? (
          <StatusFeedback tone="danger" title={t("wca.loadFailed")}>
            {errorMessage(competitionsQuery.error, t)}
          </StatusFeedback>
        ) : null}

        {competitions?.length === 0 ? (
          <EmptyState
            icon={<Calendar3 className="text-2xl" />}
            title={t("wca.empty")}
            description={t("wca.emptyHint")}
          />
        ) : null}

        {competitions?.length ? (
          visible.length === 0 ? (
            <EmptyState
              icon={<Trophy className="text-2xl" />}
              title={t("wca.searchEmpty")}
              action={
                <Button
                  type="button"
                  variant="outlined"
                  size="plain"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setQuery("")}
                >
                  {t("wca.clearSearch")}
                </Button>
              }
            />
          ) : (
            <>
              <WcaCompetitionList groups={groups} language={language} />
              {totalPages > 1 ? (
                <nav
                  className="mt-6 flex items-center justify-center gap-3"
                  aria-label={t("wca.pagination")}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    size="plain"
                    className="px-3 py-1.5 text-xs"
                    disabled={currentPage === 1}
                    onClick={() => setPage(value => Math.max(1, value - 1))}
                  >
                    {t("wca.pagePrev")}
                  </Button>
                  <span className="text-sm text-muted">
                    {t("wca.pageInfo", {
                      page: currentPage,
                      total: totalPages,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="outlined"
                    size="plain"
                    className="px-3 py-1.5 text-xs"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage(value => Math.min(totalPages, value + 1))
                    }
                  >
                    {t("wca.pageNext")}
                  </Button>
                </nav>
              ) : null}
            </>
          )
        ) : null}
      </section>

      <p className="mt-6 text-sm text-muted">{t("wca.footer")}</p>
    </div>
  );
}
