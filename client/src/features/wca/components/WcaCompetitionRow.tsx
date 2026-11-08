import { ExternalLink, GeoAlt } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { wcaEventName, wcaEventShortName } from "@/lib/wcaEvents";
import { competitionStatusLabel, flagEmoji, formatDayRange, locationLabel, parseVenue, toIsoDate, type WcaCompetition } from "../lib/wcaCalendar";

/**
 * One competition of the calendar, presented as a card with a date block on the
 * side, the name as the link to the competition page, the place and venue, and
 * the events that will be run. The name stays the only link so the card does
 * not need a button of its own.
 */
export function WcaCompetitionRow({ competition, language }: { competition: WcaCompetition; language: Language }) {
  const { t } = useLanguage();
  const venue = parseVenue(competition.venueName);
  const place = locationLabel(competition);
  const flag = flagEmoji(competition.countryIso2);
  const range = formatDayRange(competition.startDate, competition.endDate, language);
  const cancelled = competition.status !== "approved";
  const today = toIsoDate(new Date());
  const ongoing = competition.startDate <= today && competition.endDate >= today;

  return (
    <li className="cfop-agenda-row">
      <div className="cfop-agenda-row__date" aria-hidden="true">
        <span className="cfop-agenda-row__day">{range.days}</span>
        <span className="cfop-agenda-row__month">{range.months}</span>
      </div>
      <div className="cfop-agenda-row__body">
        <div className="cfop-agenda-row__heading">
          <h3 className="cfop-agenda-row__title">
            <a href={competition.wcaUrl} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center gap-2">
              <span>{competition.name}</span>
              <ExternalLink className="cfop-agenda-row__external" />
              <span className="visually-hidden"> — {t("wca.competitionPage")}</span>
            </a>
          </h3>
          <div className="cfop-agenda-row__badges">
            {ongoing ? <span className="badge text-bg-success">{t("wca.ongoing")}</span> : null}
            {cancelled ? <span className="badge text-bg-danger">{competitionStatusLabel(competition.status, t)}</span> : null}
          </div>
        </div>
        <p className="cfop-agenda-row__meta">
          <span className="d-inline-flex align-items-center gap-1">
            {flag ? <span aria-hidden="true">{flag}</span> : null}
            <GeoAlt className="cfop-agenda-row__place-icon" />
            {place || t("wca.locationUnknown")}
          </span>
          {venue.text ? (
            <>
              <span aria-hidden="true" className="cfop-agenda-row__separator">·</span>
              {venue.href ? (
                <a href={venue.href} target="_blank" rel="noreferrer" className="cfop-agenda-row__venue">
                  {venue.text}
                </a>
              ) : (
                <span className="cfop-agenda-row__venue">{venue.text}</span>
              )}
            </>
          ) : null}
        </p>
        {competition.eventIds.length ? (
          <ul className="cfop-event-chips list-unstyled mb-0" aria-label={t("wca.events")}>
            {competition.eventIds.map((eventId) => (
              <li key={eventId} className="cfop-event-chip" title={wcaEventName(eventId, language)}>
                {wcaEventShortName(eventId, language)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {competition.website ? (
        <a href={competition.website} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm cfop-agenda-row__site">
          {t("wca.website")}
          <ExternalLink className="ms-1" />
        </a>
      ) : null}
    </li>
  );
}