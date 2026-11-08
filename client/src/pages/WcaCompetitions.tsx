import { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingTransition, PageHeader, RefreshIndicator, SkeletonList, StatusFeedback } from "@/components/ui/BootstrapUI";
import { Calendar3, ExternalLink, Trophy } from "@/components/ui/BootstrapIcon";
import { trpc } from "@/lib/trpc";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";
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

  const countriesQuery = trpc.wca.countries.useQuery(undefined, { staleTime: 24 * 60 * 60 * 1000, retry: 1 });
  const recordsQuery = trpc.wca.worldRecords.useQuery(undefined, { staleTime: 60 * 60 * 1000, retry: 1 });
  const calendarInput = useMemo(() => {
    const startMonth = month === 0 ? 1 : month;
    const endMonth = month === 0 ? 12 : month;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
      end: `${year}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      countryIso2: countryIso2 || null,
    };
  }, [year, month, countryIso2]);
  const rangeIsValid = true;
  const competitionsQuery = trpc.wca.competitions.useQuery(calendarInput, { staleTime: 5 * 60 * 1000, retry: 1 });

  const competitions = competitionsQuery.data;
  const visible = useMemo(() => (competitions ?? []).filter((competition) => matchesQuery(competition, query)), [competitions, query]);
  useEffect(() => setPage(1), [year, month, countryIso2, query]);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedVisible = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const groups = useMemo(() => groupByMonth(paginatedVisible), [paginatedVisible]);

  const resetFilters = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setCountryIso2("");
    setQuery("");
  };

  return (
    <div className="container py-4 cfop-wca-page">
      <section className="cfop-wca-hero" aria-labelledby="wca-title">
        <div className="cfop-wca-hero__copy">
          <p className="cfop-wca-hero__eyebrow">{t("wca.eyebrow")}</p>
          <h1 id="wca-title" className="cfop-wca-hero__title">{t("wca.title")}</h1>
          <p className="cfop-wca-hero__description">{t("wca.description")}</p>
          <div className="cfop-wca-hero__meta">
            <span className="cfop-wca-hero__meta-item">
              <Calendar3 aria-hidden="true" />
              {competitions?.length ? t("wca.resultsCount", { count: competitions.length }) : t("wca.loading")}
            </span>
            <span className="cfop-wca-hero__meta-item">
              <Trophy aria-hidden="true" />
              {t("wca.records.count", { count: recordsQuery.data?.length ?? 17 })}
            </span>
          </div>
        </div>
        <div className="cfop-wca-hero__visual" aria-hidden="true">
          <div className="cfop-wca-hero__cube">
            {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
          </div>
          <a href={WCA_CALENDAR_URL} target="_blank" rel="noreferrer" className="btn btn-primary cfop-wca-hero__cta">
            {t("wca.openCalendar")}
            <ExternalLink className="ms-1" />
          </a>
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

      <section className="cfop-wca-agenda" aria-labelledby="wca-agenda-title">
        <div className="cfop-wca-agenda__header">
          <div>
            <h2 id="wca-agenda-title" className="cfop-wca-agenda__title">{t("wca.agendaTitle")}</h2>
            <p className="cfop-wca-agenda__subtitle">
              {t("wca.agendaSubtitle", { count: visible.length })}
            </p>
          </div>
          {competitionsQuery.isFetching ? <RefreshIndicator label={t("wca.refreshing")} /> : null}
        </div>

        {competitionsQuery.isLoading ? (
          <SkeletonList rows={6} label={t("wca.loading")} />
        ) : null}

        {competitionsQuery.isError ? (
          <StatusFeedback tone="danger" title={t("wca.loadFailed")}>{errorMessage(competitionsQuery.error, t)}</StatusFeedback>
        ) : null}

        {!competitionsQuery.isLoading && !competitionsQuery.isError && competitions?.length === 0 ? (
          <EmptyState
            icon={<Calendar3 className="fs-3" />}
            title={t("wca.empty")}
            description={t("wca.emptyHint")}
            action={
              <a href={WCA_CALENDAR_URL} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm">
                {t("wca.openCalendar")}
                <ExternalLink className="ms-1" />
              </a>
            }
          />
        ) : null}

        {competitions?.length ? (
          visible.length === 0 ? (
            <EmptyState
              icon={<Trophy className="fs-3" />}
              title={t("wca.searchEmpty")}
              action={<button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setQuery("")}>{t("wca.clearSearch")}</button>}
            />
          ) : (
            <>
              <WcaCompetitionList groups={groups} language={language} />
              {totalPages > 1 ? (
                <nav className="cfop-pagination" aria-label={t("wca.pagination")}>
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                    {t("wca.pagePrev")}
                  </button>
                  <span className="cfop-pagination__info">{t("wca.pageInfo", { page: currentPage, total: totalPages })}</span>
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                    {t("wca.pageNext")}
                  </button>
                </nav>
              ) : null}
            </>
          )
        ) : null}
      </section>

      <p className="small text-body-secondary mt-4 mb-0">{t("wca.footer")}</p>
    </div>
  );
}