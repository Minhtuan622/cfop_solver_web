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
 * One competition of the calendar, presented as a dense row: a date tile on
 * the side, the name as the link to the competition page, the place and
 * venue, and the events that will be run. The website link sits on the far
 * right so the row fills its width instead of leaving one side empty.
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
    <li className="rounded-2xl bg-surface-3 px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3">
        <div
          className="flex w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface px-1 py-1.5 leading-none"
          aria-hidden="true"
        >
          <span className="text-base font-bold tabular-nums text-primary">
            {range.days}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
            {range.months}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="min-w-0">
              <a
                href={competition.wcaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold leading-snug tracking-tight text-ink hover:text-primary"
                title={competition.name}
              >
                <span className="line-clamp-1">{competition.name}</span>
                <ExternalLink className="shrink-0 text-xs text-muted" />
                <span className="sr-only">
                  {" "}
                  — {t("wca.competitionPage")}
                </span>
              </a>
            </h3>
            <div className="flex shrink-0 flex-wrap gap-1">
              {ongoing ? (
                <span className="inline-flex items-center rounded-full bg-success px-2 py-0.5 text-[9px] font-semibold text-on-success">
                  {t("wca.ongoing")}
                </span>
              ) : null}
              {cancelled ? (
                <span className="inline-flex items-center rounded-full bg-danger px-2 py-0.5 text-[9px] font-semibold text-on-danger">
                  {competitionStatusLabel(competition.status, t)}
                </span>
              ) : null}
            </div>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              {flag ? <span aria-hidden="true">{flag}</span> : null}
              <GeoAlt className="text-[10px]" />
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
            {competition.eventIds.length ? (
              <span className="inline-flex flex-wrap items-center gap-1">
                <span aria-hidden="true">·</span>
                <ul
                  className="inline-flex flex-wrap gap-1"
                  aria-label={t("wca.events")}
                >
                  {competition.eventIds.map(eventId => (
                    <li
                      key={eventId}
                      className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-primary"
                      title={wcaEventName(eventId, language)}
                    >
                      {wcaEventShortName(eventId, language)}
                    </li>
                  ))}
                </ul>
              </span>
            ) : null}
          </p>
        </div>
        {competition.website ? (
          <a
            href={competition.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-surface px-2 py-1.5 text-[11px] font-semibold text-ink transition hover:bg-surface-2 sm:px-3"
          >
            <span className="hidden sm:inline">{t("wca.website")}</span>
            <ExternalLink className="text-xs" />
          </a>
        ) : null}
      </div>
    </li>
  );
}
