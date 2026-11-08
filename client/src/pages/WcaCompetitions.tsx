import { useMemo, useState } from "react";
import { EmptyState, LoadingTransition, PageHeader, RefreshIndicator, SkeletonList, StatusFeedback } from "@/components/ui/BootstrapUI";
import { Calendar3, ExternalLink, Trophy } from "@/components/ui/BootstrapIcon";
import { trpc } from "@/lib/trpc";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DEFAULT_PRESET_ID,
  RANGE_PRESETS,
  WcaCalendarFilters,
  WcaCompetitionList,
  WcaWorldRecords,
  addDays,
  groupByMonth,
  matchesQuery,
  toIsoDate,
} from "@/features/wca";

const WCA_CALENDAR_URL = "https://www.worldcubeassociation.org/competitions";

export default function WcaCompetitions() {
  const { language, t } = useLanguage();
  const [start, setStart] = useState(() => toIsoDate(new Date()));
  const [end, setEnd] = useState(() => toIsoDate(addDays(new Date(), 90)));
  const [countryIso2, setCountryIso2] = useState("");
  const [query, setQuery] = useState("");
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);

  const countriesQuery = trpc.wca.countries.useQuery(undefined, { staleTime: 24 * 60 * 60 * 1000, retry: 1 });
  const recordsQuery = trpc.wca.worldRecords.useQuery(undefined, { staleTime: 60 * 60 * 1000, retry: 1 });
  const calendarInput = useMemo(() => ({ start, end, countryIso2: countryIso2 || null }), [start, end, countryIso2]);
  const rangeIsValid = Boolean(start && end && end >= start);
  const competitionsQuery = trpc.wca.competitions.useQuery(calendarInput, { staleTime: 5 * 60 * 1000, retry: 1, enabled: rangeIsValid });

  const competitions = competitionsQuery.data;
  const visible = useMemo(() => (competitions ?? []).filter((competition) => matchesQuery(competition, query)), [competitions, query]);
  const groups = useMemo(() => groupByMonth(visible), [visible]);

  const applyPreset = (days: number) => {
    const today = new Date();
    setStart(toIsoDate(today));
    setEnd(toIsoDate(addDays(today, days)));
    setPresetId(RANGE_PRESETS.find((preset) => preset.days === days)?.id ?? "");
  };

  const resetFilters = () => {
    const today = new Date();
    setStart(toIsoDate(today));
    setEnd(toIsoDate(addDays(today, 90)));
    setCountryIso2("");
    setQuery("");
    setPresetId(DEFAULT_PRESET_ID);
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
        start={start}
        end={end}
        countryIso2={countryIso2}
        countries={countriesQuery.data ?? []}
        countriesLoading={countriesQuery.isLoading}
        query={query}
        presetId={presetId}
        shownCount={visible.length}
        totalCount={competitions?.length ?? 0}
        onStartChange={(value) => { setStart(value); setPresetId(""); }}
        onEndChange={(value) => { setEnd(value); setPresetId(""); }}
        onCountryChange={setCountryIso2}
        onQueryChange={setQuery}
        onPresetChange={applyPreset}
        onReset={resetFilters}
      />

      <section className="cfop-wca-agenda" aria-labelledby="wca-agenda-title">
        <div className="cfop-wca-agenda__header">
          <div>
            <h2 id="wca-agenda-title" className="cfop-wca-agenda__title">{t("wca.agendaTitle")}</h2>
            <p className="cfop-wca-agenda__subtitle">
              {rangeIsValid
                ? t("wca.agendaSubtitle", { count: visible.length })
                : t("wca.invalidRangeHint")}
            </p>
          </div>
          {competitionsQuery.isFetching ? <RefreshIndicator label={t("wca.refreshing")} /> : null}
        </div>

        {rangeIsValid ? null : <StatusFeedback tone="warning" title={t("wca.invalidRange")}>{t("wca.invalidRangeHint")}</StatusFeedback>}

        {rangeIsValid && competitionsQuery.isLoading ? (
          <SkeletonList rows={6} label={t("wca.loading")} />
        ) : null}

        {rangeIsValid && competitionsQuery.isError ? (
          <StatusFeedback tone="danger" title={t("wca.loadFailed")}>{errorMessage(competitionsQuery.error, t)}</StatusFeedback>
        ) : null}

        {rangeIsValid && !competitionsQuery.isLoading && !competitionsQuery.isError && competitions?.length === 0 ? (
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

        {rangeIsValid && competitions?.length ? (
          visible.length === 0 ? (
            <EmptyState
              icon={<Trophy className="fs-3" />}
              title={t("wca.searchEmpty")}
              action={<button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setQuery("")}>{t("wca.clearSearch")}</button>}
            />
          ) : (
            <WcaCompetitionList groups={groups} language={language} />
          )
        ) : null}
      </section>

      <p className="small text-body-secondary mt-4 mb-0">{t("wca.footer")}</p>
    </div>
  );
}