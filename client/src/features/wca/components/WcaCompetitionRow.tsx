import { ExternalLink, GeoAlt } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { wcaEventName, wcaEventShortName } from "@/lib/wcaEvents";
import {
  competitionStatusLabel,
  flagEmoji,
  formatDayRange,
  locationLabel,
  parseVenue,
  toIsoDate,
  type WcaCompetition,
} from "../lib/wcaCalendar";

/**
 * One competition of the calendar, presented as a card with a date block on the
 * side, the name as the link to the competition page, the place and venue, and
 * the events that will be run. The name stays the only link so the card does
 * not need a button of its own.
 */
export function WcaCompetitionRow({
  competition,
  language,
}: {
  competition: WcaCompetition;
  language: Language;
}) {
  const { t } = useLanguage();
  const venue = parseVenue(competition.venueName);
  const place = locationLabel(competition);
  const flag = flagEmoji(competition.countryIso2);
  const range = formatDayRange(
    competition.startDate,
    competition.endDate,
    language
  );
  const cancelled = competition.status !== "approved";
  const today = toIsoDate(new Date());
  const ongoing =
    competition.startDate <= today && competition.endDate >= today;

  return (
    <li className="rounded-card border border-line/80 bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div
          className="flex shrink-0 flex-col items-center leading-none"
          aria-hidden="true"
        >
          <span className="text-lg font-bold tabular-nums text-primary">
            {range.days}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
            {range.months}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h3 className="min-w-0">
              <a
                href={competition.wcaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-ink hover:text-primary"
              >
                <span>{competition.name}</span>
                <ExternalLink className="text-muted" />
                <span className="sr-only"> — {t("wca.competitionPage")}</span>
              </a>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ongoing ? (
                <span className="inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white">
                  {t("wca.ongoing")}
                </span>
              ) : null}
              {cancelled ? (
                <span className="inline-flex items-center rounded-full bg-danger px-2.5 py-1 text-[11px] font-semibold text-white">
                  {competitionStatusLabel(competition.status, t)}
                </span>
              ) : null}
            </div>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              {flag ? <span aria-hidden="true">{flag}</span> : null}
              <GeoAlt className="text-xs" />
              {place || t("wca.locationUnknown")}
            </span>
            {venue.text ? (
              <>
                <span aria-hidden="true">·</span>
                {venue.href ? (
                  <a
                    href={venue.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline decoration-line underline-offset-2 hover:text-primary"
                  >
                    {venue.text}
                  </a>
                ) : (
                  <span className="text-ink">{venue.text}</span>
                )}
              </>
            ) : null}
          </p>
          {competition.eventIds.length ? (
            <ul
              className="mt-2 flex flex-wrap gap-1.5"
              aria-label={t("wca.events")}
            >
              {competition.eventIds.map(eventId => (
                <li
                  key={eventId}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  title={wcaEventName(eventId, language)}
                >
                  {wcaEventShortName(eventId, language)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {competition.website ? (
          <a
            href={competition.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2"
          >
            {t("wca.website")}
            <ExternalLink className="ml-1" />
          </a>
        ) : null}
      </div>
    </li>
  );
}
