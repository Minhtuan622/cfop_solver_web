import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  PageHeader,
  RefreshIndicator,
  SkeletonList,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import { Calendar3, ExternalLink, Trophy } from "@/components/ui/Icon";
import { trpc } from "@/lib/trpc";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Button, buttonClass } from "@/components/ui/Button";
import {
  CommunityPanel,
  MyCompetitionsPanel,
  NearbyPanel,
  PeoplePanel,
  WcaCalendarFilters,
  WcaCompetitionList,
  groupByMonth,
  matchesQuery,
} from "@/features/wca";

const TABS = ["calendar", "mine", "nearby", "people", "community"] as const;
const WCA_CALENDAR_URL = "https://www.worldcubeassociation.org/competitions";

export default function WcaCompetitions() {
  const { language, t } = useLanguage();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [countryIso2, setCountryIso2] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return TABS.find(id => id === requested) ?? "calendar";
  });

  const PAGE_SIZE = 24;
  const [page, setPage] = useState(1);

  const countriesQuery = trpc.wca.countries.useQuery(undefined, {
    staleTime: 24 * 60 * 60 * 1000,
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
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      <PageHeader
        title={t("wca.title")}
        description={t("wca.description")}
        actions={
          <>
            <Link href="/records" className={buttonClass("secondary", "md")}>
              <Trophy className="text-sm" aria-hidden="true" />
              {t("wca.openRecords")}
            </Link>
            <a
              href={WCA_CALENDAR_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              {t("wca.openCalendar")}
              <ExternalLink className="text-sm" aria-hidden="true" />
            </a>
          </>
        }
      />
      <div
        role="tablist"
        aria-label={t("wca.tabs")}
        className="mb-6 flex flex-wrap gap-2"
      >
        {TABS.map(id => (
          <Button
            key={id}
            type="button"
            role="tab"
            id={`wca-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`wca-panel-${id}`}
            variant={tab === id ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTab(id)}
          >
            {t(`wca.tab.${id}`)}
          </Button>
        ))}
      </div>
      {tab === "mine" ? (
        <div role="tabpanel" id="wca-panel-mine" aria-labelledby="wca-tab-mine">
          <MyCompetitionsPanel />
        </div>
      ) : tab === "nearby" ? (
        <div role="tabpanel" id="wca-panel-nearby" aria-labelledby="wca-tab-nearby">
          <NearbyPanel />
        </div>
      ) : tab === "people" ? (
        <div role="tabpanel" id="wca-panel-people" aria-labelledby="wca-tab-people">
          <PeoplePanel />
        </div>
      ) : tab === "community" ? (
        <div role="tabpanel" id="wca-panel-community" aria-labelledby="wca-tab-community">
          <CommunityPanel />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="wca-panel-calendar"
          aria-labelledby="wca-tab-calendar"
        >
          <div className="-mt-2 mb-6 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-ink">
              <Calendar3 className="text-muted" aria-hidden="true" />
              {competitions?.length
                ? t("wca.resultsCount", { count: competitions.length })
                : t("wca.loading")}
            </span>
          </div>

          <WcaCalendarFilters
            year={year}
            month={month}
            countryIso2={countryIso2}
            countries={countriesQuery.data ?? []}
            countriesLoading={countriesQuery.isLoading}
            query={query}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onCountryChange={setCountryIso2}
            onQueryChange={setQuery}
            onReset={resetFilters}
          />

          <section className="mt-6" aria-labelledby="wca-agenda-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3">
              <h2
                id="wca-agenda-title"
                className="text-sm font-semibold tracking-tight text-ink"
              >
                {t("wca.agendaTitle")}
              </h2>
              <p
                className="text-[11px] tabular-nums text-muted"
                role="status"
                aria-live="polite"
              >
                {t("wca.agendaSubtitle", { count: visible.length })}
              </p>
            </div>

            {competitionsQuery.isFetching ? (
              <div className="mt-1 px-3">
                <RefreshIndicator label={t("wca.refreshing")} />
              </div>
            ) : null}

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
                      variant="secondary"
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
                        variant="secondary"
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
                        variant="secondary"
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
      )}
    </div>
  );
}
