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
 * One competition of the calendar as a compact card: the date stands out in a
 * soft tile on the left; the name (link to the competition page), the place
 * and venue, and the events sit on the right. The website link is a small
 * icon next to the name.
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
    <li className="flex h-full gap-3 rounded-2xl bg-surface p-3 sm:p-4">
      {/* Ngày nổi bật bên trái, thông tin gọn bên phải. */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-2 px-1 py-2 text-center">
        <span className="text-lg font-bold leading-none tabular-nums text-ink">
          {range.days}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted">
          {range.months}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1">
            <a
              href={competition.wcaUrl}
              target="_blank"
              rel="noreferrer"
              title={competition.name}
              className="line-clamp-2 py-0.5 text-sm font-semibold leading-snug tracking-tight text-ink transition-colors hover:text-primary"
            >
              {competition.name}
              <span className="sr-only"> — {t("wca.competitionPage")}</span>
            </a>
          </h3>
          {competition.website ? (
            <a
              href={competition.website}
              target="_blank"
              rel="noreferrer"
              aria-label={t("wca.website")}
              title={t("wca.website")}
              className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ExternalLink className="text-xs" />
            </a>
          ) : null}
        </div>
        {ongoing || cancelled ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ongoing ? (
              <span className="inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                {t("wca.ongoing")}
              </span>
            ) : null}
            {cancelled ? (
              <span className="inline-flex items-center rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
                {competitionStatusLabel(competition.status, t)}
              </span>
            ) : null}
          </div>
        ) : null}
        <p
          className="mb-0 mt-1.5 truncate text-xs text-muted"
          title={[place || t("wca.locationUnknown"), venue.text].filter(Boolean).join(" · ")}
        >
          {flag ? <span aria-hidden="true">{flag} </span> : null}
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
                  className="text-ink transition-colors hover:text-primary"
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
          <p className="mb-0 mt-1 truncate text-xs text-muted" title={eventsTitle}>
            {eventsText}
          </p>
        ) : null}
      </div>
    </li>
  );
}
