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
 * One competition of the calendar, presented as a compact card: the date on
 * one line, the name as the link to the competition page, then the place and
 * venue and the events as single text lines. Cards tile into a grid so the
 * row never leaves one side empty. The website link is an icon on the top
 * right; the name stays the only text link.
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

  const eventsText = competition.eventIds
    .map(eventId => wcaEventShortName(eventId, language))
    .join(" · ");
  const eventsTitle = competition.eventIds
    .map(eventId => wcaEventName(eventId, language))
    .join(" · ");

  return (
    <li className="flex h-full flex-col rounded-2xl bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tabular-nums leading-none text-primary">
          {range.days}
        </span>
        <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted">
          {range.months}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
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
          {competition.website ? (
            <a
              href={competition.website}
              target="_blank"
              rel="noreferrer"
              aria-label={t("wca.website")}
              title={t("wca.website")}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 p-2 text-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <ExternalLink className="text-xs" />
            </a>
          ) : null}
        </span>
      </div>
      <h3 className="mt-2 min-w-0">
        <a
          href={competition.wcaUrl}
          target="_blank"
          rel="noreferrer"
          title={competition.name}
          className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-ink hover:text-primary"
        >
          {competition.name}
          <span className="sr-only"> — {t("wca.competitionPage")}</span>
        </a>
      </h3>
      <p
        className="mt-1.5 truncate text-[11px] text-muted"
        title={[place || t("wca.locationUnknown"), venue.text].filter(Boolean).join(" · ")}
      >
        {flag ? (
          <span aria-hidden="true">{flag} </span>
        ) : null}
        <GeoAlt className="inline text-[10px] align-[-0.1em]" />{" "}
        {place || t("wca.locationUnknown")}
        {venue.text ? (
          <>
            <span aria-hidden="true"> · </span>
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
      {eventsText ? (
        <p
          className="mt-1 truncate text-[11px] text-muted"
          title={eventsTitle}
        >
          {eventsText}
        </p>
      ) : null}
    </li>
  );
}
