import { useMemo, useState } from "react";
import { LoadingTransition, RefreshIndicator, SkeletonCard } from "@/components/ui/BootstrapUI";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language, Translate } from "@/lib/i18n";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateRange(start: string, end: string, language: Language) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  const locale = language === "vi" ? "vi-VN" : "en-US";
  if (start === end) return startDate.toLocaleDateString(locale, options);
  return `${startDate.toLocaleDateString(locale, options)} – ${endDate.toLocaleDateString(locale, options)}`;
}

function messageFor(error: unknown, t: Translate) {
  return error instanceof Error ? error.message : t("wca.loadFailed");
}

function competitionStatus(value: string, t: Translate) {
  if (value === "approved") return t("wca.status.approved");
  if (value === "cancelled") return t("wca.status.cancelled");
  return value;
}

export default function WcaCompetitions() {
  const { language, t } = useLanguage();
  const [start, setStart] = useState(() => dateInputValue(new Date()));
  const [end, setEnd] = useState(() => dateInputValue(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)));
  const [countryIso2, setCountryIso2] = useState<string>("");
  const countriesQuery = trpc.wca.countries.useQuery(undefined, { staleTime: 24 * 60 * 60 * 1000, retry: 1 });
  const calendarInput = useMemo(() => ({ start, end, countryIso2: countryIso2 || null }), [start, end, countryIso2]);
  const competitionsQuery = trpc.wca.competitions.useQuery(calendarInput, { staleTime: 5 * 60 * 1000, retry: 1, enabled: Boolean(start && end && end >= start) });

  return <div className="container">
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div><p className="text-body-secondary small mb-1">{t("wca.eyebrow")}</p><h1 className="h2 mb-1">{t("wca.title")}</h1><p className="text-body-secondary mb-0">{t("wca.description")}</p></div>
      <a href="https://www.worldcubeassociation.org/competitions" target="_blank" rel="noreferrer" className="btn btn-outline-secondary">{t("wca.openCalendar")} <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a>
    </div>
    <section className="card mb-4"><div className="card-body"><form className="row g-3" onSubmit={(event) => event.preventDefault()}>
      <label className="col-12 col-md-4 form-label mb-0">{t("wca.from")}<input value={start} onChange={(event) => setStart(event.target.value)} className="form-control mt-1" type="date" /></label>
      <label className="col-12 col-md-4 form-label mb-0">{t("wca.to")}<input value={end} onChange={(event) => setEnd(event.target.value)} className="form-control mt-1" type="date" min={start} /></label>
      <label className="col-12 col-md-4 form-label mb-0">{t("wca.country")}<select className="form-select mt-1" value={countryIso2} onChange={(event) => setCountryIso2(event.target.value)} disabled={countriesQuery.isLoading}><option value="">{t("wca.allCountries")}</option>{countriesQuery.data?.map((country) => <option key={country.iso2} value={country.iso2}>{country.name}</option>)}</select></label>
    </form></div></section>
    {end < start ? <div className="alert alert-warning">{t("wca.invalidRange")}</div> : null}
    {competitionsQuery.isFetching && competitionsQuery.data ? <div className="mb-3"><RefreshIndicator label={t("wca.refreshing")} /></div> : null}
    {competitionsQuery.isLoading ? <div className="row g-3" aria-live="polite" aria-label={t("wca.loading")}>{Array.from({ length: 4 }, (_, index) => <div className="col-12 col-lg-6" key={index}><SkeletonCard lines={2} label={t("wca.loading")} /></div>)}</div> : null}
    {competitionsQuery.isError ? <div className="alert alert-danger" role="alert">{messageFor(competitionsQuery.error, t)}</div> : null}
    {competitionsQuery.data && !competitionsQuery.data.length ? <div className="alert alert-secondary">{t("wca.empty")}</div> : null}
    {competitionsQuery.data?.length ? <LoadingTransition><section className="row g-3" aria-label={t("wca.listLabel")}>{competitionsQuery.data.map((competition) => <article className="col-12 col-lg-6" key={competition.id}><div className="card h-100"><div className="card-body d-flex flex-column"><div className="d-flex justify-content-between gap-3"><div><h2 className="h5 mb-1">{competition.name}</h2><p className="text-body-secondary small mb-0">{formatDateRange(competition.startDate, competition.endDate, language)}</p></div><span className="badge text-bg-light align-self-start">{competitionStatus(competition.status, t)}</span></div><p className="mb-1 mt-3"><i className="bi bi-geo-alt me-2" aria-hidden="true" />{[competition.cityName, competition.countryName].filter(Boolean).join(", ") || t("wca.locationUnknown")}</p>{competition.venueName ? <p className="text-body-secondary small mb-0">{competition.venueName}</p> : null}<div className="d-flex flex-wrap gap-2 mt-auto pt-3"><a href={competition.wcaUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">{t("wca.competitionPage")} <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a>{competition.website ? <a href={competition.website} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm">{t("wca.website")}</a> : null}</div></div></div></article>)}</section></LoadingTransition> : null}
    <p className="small text-body-secondary mt-4 mb-0">{t("wca.footer")}</p>
  </div>;
}
