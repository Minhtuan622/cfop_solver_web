import { SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { wcaEventShortName } from "@/lib/wcaEvents";
import { cn } from "@/lib/utils";
import { formatClock, formatDayHeading } from "../lib/myCompetitions";
import { groupActivitiesByDay, parseActivityCode, type CompetitionSchedule } from "../lib/explore";

const KNOWN_ROLES = new Set([
  "competitor",
  "staff-judge",
  "staff-scrambler",
  "staff-runner",
  "staff-dataentry",
  "staff-announcer",
]);

type Agenda = NonNullable<CompetitionSchedule["me"]>["agenda"];

function AgendaList({ agenda }: { agenda: Agenda }) {
  const { language, t } = useLanguage();
  const days = groupActivitiesByDay(agenda.map(item => ({ ...item, startTime: item.activity.startTime, timezone: item.activity.timezone })));
  return (
    <section className="mb-5">
      <h5 className="mb-2 mt-0 text-sm font-semibold tracking-tight text-ink">{t("wcax.agenda.title")}</h5>
      <div className="flex flex-col gap-3">
        {days.map(day => (
          <div key={day.date}>
            <p className="mb-1 mt-0 text-xs font-semibold uppercase tracking-wide text-muted">
              {formatDayHeading(day.date, language)}
            </p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {day.items.map(item => (
                <li
                  key={`${item.activityId}-${item.assignmentCode}`}
                  className="grid grid-cols-[6.5rem_1fr] gap-x-3 rounded-lg bg-primary-soft px-3 py-1.5 text-sm text-ink sm:grid-cols-[6.5rem_1fr_auto]"
                >
                  <span className="tabular-nums text-muted">
                    {formatClock(item.activity.startTime, item.activity.timezone, language)}–
                    {formatClock(item.activity.endTime, item.activity.timezone, language)}
                  </span>
                  <span className="min-w-0 break-words font-medium">
                    {item.activity.name}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {KNOWN_ROLES.has(item.assignmentCode) ? t(`wcax.role.${item.assignmentCode}`) : item.assignmentCode}
                      {item.stationNumber ? ` · ${t("wcax.station", { n: item.stationNumber })}` : ""}
                    </span>
                  </span>
                  <span className="col-start-2 text-xs text-muted sm:col-start-3">{item.activity.roomName}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ScheduleView({ competitionId, personal }: { competitionId: string; personal: boolean }) {
  const { language, t } = useLanguage();
  const publicQuery = trpc.wca.competitionSchedule.useQuery(
    { id: competitionId },
    { enabled: !personal, staleTime: 10 * 60 * 1000, retry: false }
  );
  const personalQuery = trpc.cfopAccount.wca.competitionAgenda.useQuery(
    { id: competitionId },
    { enabled: personal, staleTime: 10 * 60 * 1000, retry: false }
  );
  const query = personal ? personalQuery : publicQuery;
  if (query.isLoading) return <SkeletonList rows={4} label={t("wcax.loading")} />;
  if (query.isError)
    return (
      <StatusFeedback tone="danger" title={t("wcax.failed")}>
        {errorMessage(query.error, t)}
      </StatusFeedback>
    );
  const schedule = query.data;
  if (!schedule) return null;
  const top = schedule.activities.filter(activity => activity.parentId === null);
  if (top.length === 0) return <p className="m-0 text-sm text-muted">{t("wca.mine.scheduleEmpty")}</p>;
  const mineEvents = new Set(schedule.me?.eventIds ?? []);
  const days = groupActivitiesByDay(top);
  return (
    <div>
      {personal ? (
        schedule.me ? (
          schedule.me.agenda.length > 0 ? (
            <AgendaList agenda={schedule.me.agenda} />
          ) : (
            <p className="mb-4 mt-0 text-sm text-muted">{t("wcax.agenda.none")}</p>
          )
        ) : (
          <p className="mb-4 mt-0 text-sm text-muted">{t("wcax.agenda.notRegistered")}</p>
        )
      ) : null}
      <p className="mb-3 mt-0 text-xs text-muted">
        {t("wca.mine.scheduleNote", { zone: top[0].timezone })} · {t("wcax.competitors", { count: schedule.competitorCount })}
      </p>
      <div className="flex flex-col gap-4">
        {days.map(day => (
          <div key={day.date}>
            <h5 className="mb-1.5 mt-0 text-xs font-semibold uppercase tracking-wide text-muted">
              {formatDayHeading(day.date, language)}
            </h5>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {day.items.map(item => {
                const eventId = parseActivityCode(item.code).eventId;
                const highlighted = eventId !== null && mineEvents.has(eventId);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "grid grid-cols-[6.5rem_1fr] gap-x-3 rounded-lg px-3 py-1.5 text-sm sm:grid-cols-[6.5rem_1fr_auto]",
                      highlighted ? "bg-primary-soft text-ink" : "bg-surface-2 text-ink"
                    )}
                  >
                    <span className="tabular-nums text-muted">
                      {formatClock(item.startTime, item.timezone, language)}–{formatClock(item.endTime, item.timezone, language)}
                    </span>
                    <span className="min-w-0 break-words font-medium">
                      {eventId ? <span className="mr-2 text-xs text-muted">{wcaEventShortName(eventId, language)}</span> : null}
                      {item.name}
                    </span>
                    {item.roomName ? <span className="col-start-2 text-xs text-muted sm:col-start-3">{item.roomName}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
