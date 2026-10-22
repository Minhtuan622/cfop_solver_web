import { ExternalLink, GeoAlt } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { competitionStatusLabel, flagEmoji, formatDayRange, locationLabel, parseVenue, type WcaCompetition } from "../lib/wcaCalendar";

/**
 * One competition of the calendar. The name is the link to the competition
 * page, so the row does not need a button of its own.
 */
export function WcaCompetitionRow({ competition, language }: { competition: WcaCompetition; language: Language }) {
  const { t } = useLanguage();
  const venue = parseVenue(competition.venueName);
  const place = locationLabel(competition);
  const flag = flagEmoji(competition.countryIso2);
  const range = formatDayRange(competition.startDate, competition.endDate, language);
  const cancelled = competition.status !== "approved";

  return (
    <li className="cfop-calendar-row">
      <div className="cfop-calendar-row__date" aria-hidden="true">
        <span className="cfop-calendar-row__day">{range.days}</span>
        <span className="cfop-calendar-row__month">{range.months}</span>
      </div>
      <div className="cfop-calendar-row__body">
        <h3 className="cfop-calendar-row__title">
          <a href={competition.wcaUrl} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center gap-2">
            <span>{competition.name}</span>
            <ExternalLink className="cfop-calendar-row__external" />
            <span className="visually-hidden"> — {t("wca.competitionPage")}</span>
          </a>
        </h3>
        <p className="cfop-calendar-row__meta">
          <span className="d-inline-flex align-items-center gap-1">
            {flag ? <span aria-hidden="true">{flag}</span> : null}
            <GeoAlt className="cfop-calendar-row__place-icon" />
            {place || t("wca.locationUnknown")}
          </span>
          {venue.text ? (
            <>
              <span aria-hidden="true">·</span>
              {venue.href ? (
                <a href={venue.href} target="_blank" rel="noreferrer" className="cfop-calendar-row__venue">
                  {venue.text}
                </a>
              ) : (
                <span className="cfop-calendar-row__venue">{venue.text}</span>
              )}
            </>
          ) : null}
          {cancelled ? <span className="badge text-bg-danger">{competitionStatusLabel(competition.status, t)}</span> : null}
        </p>
      </div>
      {competition.website ? (
        <a href={competition.website} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm cfop-calendar-row__site">
          {t("wca.website")}
          <ExternalLink className="ms-1" />
        </a>
      ) : null}
    </li>
  );
}
