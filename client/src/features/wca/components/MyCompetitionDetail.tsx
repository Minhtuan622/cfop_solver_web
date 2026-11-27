import { ExternalLink, GeoAlt } from "@/components/ui/Icon";
import { SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { wcaEventName, wcaEventShortName } from "@/lib/wcaEvents";
import { cn } from "@/lib/utils";
import { formatDayRange } from "../lib/wcaCalendar";
import {
  formatAttempt,
  formatClock,
  formatDateTime,
  formatDayHeading,
  formatEntryFee,
  formatResultCell,
  groupScheduleByDay,
  mapsUrl,
  registrationState,
  type CompetitionInfo,
  type MyCompetitionDetail,
} from "../lib/myCompetitions";

const linkClass = "inline-flex items-center gap-1.5 text-primary hover:underline";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="m-0 mt-0.5 break-words text-sm text-ink">{children}</dd>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2 mt-0 text-sm font-semibold tracking-tight text-ink">{children}</h4>;
}

function Overview({ info }: { info: CompetitionInfo }) {
  const { language, t } = useLanguage();
  const now = new Date();
  const reg = registrationState(info, now, now.toISOString().slice(0, 10));
  const fee = formatEntryFee(info.entryFee, language);
  const open = formatDateTime(info.registrationOpen, language);
  const close = formatDateTime(info.registrationClose, language);
  const range = formatDayRange(info.startDate, info.endDate, language);
  const map = mapsUrl(info);
  return (
    <section>
      <Heading>{t("wca.mine.info")}</Heading>
      <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label={t("wca.mine.dates")}>
          {info.startDate === info.endDate ? info.startDate : `${info.startDate} → ${info.endDate}`}
          <span className="text-muted"> · {range.days} {range.months}</span>
        </Fact>
        <Fact label={t("wca.mine.venue")}>
          {[info.venue, info.venueAddress, info.venueDetails].filter(Boolean).join(" · ") || info.city}
          {map ? (
            <>
              {" "}
              <a href={map} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <GeoAlt className="text-xs" aria-hidden="true" />
                {t("wca.mine.openMap")}
              </a>
            </>
          ) : null}
        </Fact>
        {info.competitorLimit ? (
          <Fact label={t("wca.mine.limit")}>
            {t("wca.mine.limitValue", { count: info.competitorLimit })}
          </Fact>
        ) : null}
        {info.entryFee ? (
          <Fact label={t("wca.mine.fee")}>
            {info.entryFee.lowestDenomination === 0 ? t("wca.mine.feeFree") : fee}
          </Fact>
        ) : null}
        {info.guestsEnabled !== null ? (
          <Fact label={t("wca.mine.guests")}>
            {info.guestsEnabled ? t("wca.mine.guestsYes") : t("wca.mine.guestsNo")}
          </Fact>
        ) : null}
        <Fact label={t("wca.mine.registration")}>
          {t(`wca.mine.reg.${reg}`)}
          {open && close ? (
            <span className="block text-muted">{t("wca.mine.regWindow", { open, close })}</span>
          ) : null}
        </Fact>
        {info.announcedAt ? (
          <Fact label={t("wca.mine.announced")}>{formatDateTime(info.announcedAt, language)}</Fact>
        ) : null}
        {info.resultsPostedAt ? (
          <Fact label={t("wca.mine.resultsPosted")}>{formatDateTime(info.resultsPostedAt, language)}</Fact>
        ) : null}
      </dl>
    </section>
  );
}

function Events({ detail }: { detail: MyCompetitionDetail }) {
  const { language, t } = useLanguage();
  const { competition, registeredEventIds, results } = detail;
  const mine = new Set([...(registeredEventIds ?? []), ...results.map(row => row.eventId)]);
  const past = competition.resultsPostedAt !== null;
  return (
    <section>
      <Heading>{t("wca.mine.events")}</Heading>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {competition.eventIds.map(eventId => (
          <li
            key={eventId}
            title={wcaEventName(eventId, language)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              mine.has(eventId) ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted"
            )}
          >
            {wcaEventShortName(eventId, language)}
          </li>
        ))}
      </ul>
      {registeredEventIds ? (
        <p className="mb-0 mt-2 text-xs text-muted">
          {t("wca.mine.eventsRegistered", { count: registeredEventIds.length })}
        </p>
      ) : !past && mine.size === 0 ? (
        <p className="mb-0 mt-2 text-xs text-muted">{t("wca.mine.eventsNotPublic")}</p>
      ) : null}
    </section>
  );
}

function Schedule({ detail }: { detail: MyCompetitionDetail }) {
  const { language, t } = useLanguage();
  const days = groupScheduleByDay(detail.schedule);
  const mine = new Set([...(detail.registeredEventIds ?? []), ...detail.results.map(row => row.eventId)]);
  return (
    <section>
      <Heading>{t("wca.mine.schedule")}</Heading>
      {days.length === 0 ? (
        <p className="m-0 text-sm text-muted">{t("wca.mine.scheduleEmpty")}</p>
      ) : (
        <>
          <p className="mb-3 mt-0 text-xs text-muted">
            {t("wca.mine.scheduleNote", { zone: detail.schedule[0].timezone })}
          </p>
          <div className="flex flex-col gap-4">
            {days.map(day => (
              <div key={day.date}>
                <h5 className="mb-1.5 mt-0 text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatDayHeading(day.date, language)}
                </h5>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {day.items.map(item => {
                    const highlighted = item.eventId !== null && mine.has(item.eventId);
                    return (
                      <li
                        key={`${item.code}-${item.startTime}-${item.room}`}
                        className={cn(
                          "grid grid-cols-[6.5rem_1fr] gap-x-3 rounded-lg px-3 py-1.5 text-sm sm:grid-cols-[6.5rem_1fr_auto]",
                          highlighted ? "bg-primary-soft text-ink" : "bg-surface-2 text-ink"
                        )}
                      >
                        <span className="tabular-nums text-muted">
                          {formatClock(item.startTime, item.timezone, language)}–
                          {formatClock(item.endTime, item.timezone, language)}
                        </span>
                        <span className="min-w-0 break-words font-medium">{item.name}</span>
                        {item.room ? <span className="col-start-2 text-xs text-muted sm:col-start-3">{item.room}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Results({ detail }: { detail: MyCompetitionDetail }) {
  const { language, t } = useLanguage();
  if (detail.results.length === 0 && detail.competition.resultsPostedAt === null) return null;
  return (
    <section>
      <Heading>{t("wca.mine.results")}</Heading>
      {detail.results.length === 0 ? (
        <p className="m-0 text-sm text-muted">{t("wca.mine.resultsEmpty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.col.round")}</th>
                <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.col.pos")}</th>
                <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.col.best")}</th>
                <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.col.average")}</th>
                <th scope="col" className="py-1 font-semibold">{t("wca.mine.col.attempts")}</th>
              </tr>
            </thead>
            <tbody>
              {detail.results.map(row => (
                <tr key={`${row.eventId}-${row.roundTypeId}`} className="align-top odd:bg-surface-2/60">
                  <td className="py-1.5 pr-3">
                    <span className="font-semibold">{wcaEventShortName(row.eventId, language)}</span>{" "}
                    <span className="text-muted">{t(`wca.mine.round.${row.roundTypeId}`)}</span>
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{row.position ?? "—"}</td>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {formatResultCell(row.eventId, "single", row.best)}
                    {row.singleRecord ? <span className="ml-1 text-xs font-semibold text-success">{row.singleRecord}</span> : null}
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {formatResultCell(row.eventId, "average", row.average)}
                    {row.averageRecord ? <span className="ml-1 text-xs font-semibold text-success">{row.averageRecord}</span> : null}
                  </td>
                  <td className="py-1.5 text-xs tabular-nums text-muted">
                    {row.attempts.map(value => formatAttempt(row.eventId, value)).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Team({ info }: { info: CompetitionInfo }) {
  const { t } = useLanguage();
  if (info.delegates.length === 0 && info.organizers.length === 0) return null;
  const names = (people: CompetitionInfo["delegates"]) => people.map(person => person.name).join(", ");
  return (
    <section>
      <Heading>{t("wca.mine.people")}</Heading>
      <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {info.delegates.length ? <Fact label={t("wca.mine.delegates")}>{names(info.delegates)}</Fact> : null}
        {info.organizers.length ? <Fact label={t("wca.mine.organizers")}>{names(info.organizers)}</Fact> : null}
      </dl>
    </section>
  );
}

function Links({ info }: { info: CompetitionInfo }) {
  const { t } = useLanguage();
  const links = [
    { href: info.wcaUrl, label: t("wca.mine.link.wca") },
    { href: info.liveUrl, label: t("wca.mine.link.live") },
    info.website ? { href: info.website, label: t("wca.mine.link.website") } : null,
    info.externalRegistrationPage ? { href: info.externalRegistrationPage, label: t("wca.mine.link.register") } : null,
  ].filter((link): link is { href: string; label: string } => link !== null);
  return (
    <section>
      <Heading>{t("wca.mine.links")}</Heading>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
        {links.map(link => (
          <li key={link.href}>
            <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {link.label}
              <ExternalLink className="text-xs" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MyCompetitionDetailView({ competitionId }: { competitionId: string }) {
  const { t } = useLanguage();
  const query = trpc.cfopAccount.wca.competitionDetail.useQuery(
    { id: competitionId },
    { staleTime: 5 * 60 * 1000, retry: false }
  );
  if (query.isLoading) return <SkeletonList rows={3} label={t("wca.mine.detail.loading")} />;
  if (query.isError)
    return (
      <StatusFeedback tone="danger" title={t("wca.mine.detail.failed")}>
        {errorMessage(query.error, t)}
      </StatusFeedback>
    );
  const detail = query.data;
  if (!detail) return null;
  return (
    <div className="flex flex-col gap-5">
      <Overview info={detail.competition} />
      <Events detail={detail} />
      <Schedule detail={detail} />
      <Results detail={detail} />
      <Team info={detail.competition} />
      <Links info={detail.competition} />
    </div>
  );
}
