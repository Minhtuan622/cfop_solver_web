import { useState } from "react";
import { GeoAlt } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { wcaEventShortName } from "@/lib/wcaEvents";
import { cn } from "@/lib/utils";
import { flagEmoji, formatDayRange } from "../lib/wcaCalendar";
import { daysUntil, registrationState, type MyCompetition } from "../lib/myCompetitions";
import { MyCompetitionDetailView } from "./MyCompetitionDetail";

function Badge({ tone, children }: { tone: "success" | "primary" | "danger" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "success" && "bg-success-soft text-success",
        tone === "primary" && "bg-primary-soft text-primary",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "muted" && "bg-surface-2 text-muted"
      )}
    >
      {children}
    </span>
  );
}

export function MyCompetitionCard({ entry }: { entry: MyCompetition }) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { competition, summary, status } = entry;
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const range = formatDayRange(competition.startDate, competition.endDate, language);
  const flag = flagEmoji(competition.countryIso2);
  const days = daysUntil(competition.startDate, todayIso);
  const reg = registrationState(competition, now, todayIso);
  const detailId = `my-competition-${competition.id}`;
  const countdown =
    status !== "upcoming"
      ? null
      : days <= 0
        ? t("wca.mine.today")
        : days === 1
          ? t("wca.mine.tomorrow")
          : t("wca.mine.inDays", { count: days });

  return (
    <li className="rounded-2xl bg-surface p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-2 px-1 py-2 text-center">
          <span className="text-lg font-bold leading-none tabular-nums text-ink">{range.days}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted">{range.months}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-sm font-semibold leading-snug tracking-tight text-ink">{competition.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {status === "ongoing" ? <Badge tone="success">{t("wca.ongoing")}</Badge> : null}
            {countdown ? <Badge tone="primary">{countdown}</Badge> : null}
            {status !== "past" && reg === "open" ? <Badge tone="success">{t("wca.mine.reg.open")}</Badge> : null}
            {status === "upcoming" && reg === "notYet" ? <Badge tone="muted">{t("wca.mine.reg.notYet")}</Badge> : null}
            {competition.cancelledAt ? <Badge tone="danger">{t("wca.status.cancelled")}</Badge> : null}
            {summary ? (
              <Badge tone="muted">{t("wca.mine.stats", { events: summary.events, rounds: summary.rounds })}</Badge>
            ) : null}
            {summary && summary.podiums > 0 ? <Badge tone="primary">{t("wca.mine.podiums", { count: summary.podiums })}</Badge> : null}
          </div>
          <p className="mb-0 mt-1.5 text-xs text-muted">
            {flag ? <span aria-hidden="true">{flag} </span> : null}
            <GeoAlt className="inline text-[10px] align-[-0.1em]" aria-hidden="true" /> {competition.city}
            {competition.venue ? <span className="text-ink"> · {competition.venue}</span> : null}
          </p>
          <p className="mb-0 mt-1 text-xs text-muted">
            {competition.eventIds.map(eventId => wcaEventShortName(eventId, language)).join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="soft"
          size="xs"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen(value => !value)}
        >
          {open ? t("wca.mine.hideDetails") : t("wca.mine.details")}
          <span className="sr-only"> — {competition.name}</span>
        </Button>
      </div>
      {open ? (
        <div id={detailId} className="mt-3 rounded-xl bg-canvas p-3 sm:p-4">
          <MyCompetitionDetailView competitionId={competition.id} />
        </div>
      ) : null}
    </li>
  );
}
