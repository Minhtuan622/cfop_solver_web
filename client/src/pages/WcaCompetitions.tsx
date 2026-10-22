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

  return (
    <div className="container py-3">
      <PageHeader
        eyebrow={t("wca.eyebrow")}
        title={t("wca.title")}
        description={t("wca.description")}
        actions={
          <a href={WCA_CALENDAR_URL} target="_blank" rel="noreferrer" className="btn btn-outline-secondary">
            {t("wca.openCalendar")}
            <ExternalLink className="ms-1" />
          </a>
        }
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
      />

      <div className="cfop-calendar-results">
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
            <LoadingTransition>
              {competitionsQuery.isFetching ? <div className="mb-3"><RefreshIndicator label={t("wca.refreshing")} /></div> : null}
              <WcaCompetitionList groups={groups} language={language} />
            </LoadingTransition>
          )
        ) : null}
      </div>

      <p className="small text-body-secondary mt-4 mb-0">{t("wca.footer")}</p>
    </div>
  );
}
