import { useState } from "react";
import { Link } from "wouter";
import { Calendar3, Trophy } from "@/components/ui/Icon";
import { buttonClass, Button } from "@/components/ui/Button";
import { EmptyState, RefreshIndicator, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { formatWcaRecordValue } from "../lib/wcaRecords";
import { wcaEventShortName } from "@/lib/wcaEvents";
import { sortSections, type MyCompetition } from "../lib/myCompetitions";
import { MyCompetitionCard } from "./MyCompetitionCard";

const PAST_STEP = 24;

function ranks(value: { world: number | null; continental: number | null; country: number | null }) {
  return (
    [
      ["TG", value.world],
      ["CL", value.continental],
      ["QG", value.country],
    ] as const
  )
    .filter(([, rank]) => typeof rank === "number")
    .map(([label, rank]) => `${label} #${rank}`)
    .join(" · ");
}

function Section({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6" aria-labelledby={id}>
      <h2 id={id} className="mb-3 px-1 text-sm font-semibold tracking-tight text-ink">
        {title} <span className="font-normal tabular-nums text-muted">· {count}</span>
      </h2>
      {children}
    </section>
  );
}

function List({ items }: { items: readonly MyCompetition[] }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 lg:grid-cols-2">
      {items.map(entry => (
        <MyCompetitionCard key={entry.competition.id} entry={entry} />
      ))}
    </ul>
  );
}

export function MyCompetitionsPanel() {
  const { language, t } = useLanguage();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const account = accountQuery.data;
  const linked = Boolean(account?.wcaId);
  const mineQuery = trpc.cfopAccount.wca.myCompetitions.useQuery(undefined, {
    enabled: linked,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const profileQuery = trpc.cfopAccount.wca.profile.useQuery(undefined, {
    enabled: linked,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const [visiblePast, setVisiblePast] = useState(PAST_STEP);

  if (accountQuery.isLoading) return <SkeletonList rows={3} label={t("wca.mine.loading")} />;
  if (!account)
    return (
      <EmptyState
        icon={<Trophy className="text-2xl" />}
        title={t("wca.mine.loginTitle")}
        description={t("wca.mine.loginBody")}
        action={
          <Link href="/profile" className={buttonClass("primary", "md")}>
            {t("wca.mine.openProfile")}
          </Link>
        }
      />
    );
  if (!linked)
    return (
      <EmptyState
        icon={<Trophy className="text-2xl" />}
        title={t("wca.mine.linkTitle")}
        description={t("wca.mine.linkBody")}
        action={
          <Link href="/profile" className={buttonClass("primary", "md")}>
            {t("wca.mine.openProfile")}
          </Link>
        }
      />
    );
  if (mineQuery.isLoading) return <SkeletonList rows={4} label={t("wca.mine.loading")} />;
  if (mineQuery.isError)
    return (
      <StatusFeedback tone="danger" title={t("wca.mine.loadFailed")}>
        {errorMessage(mineQuery.error, t)}
      </StatusFeedback>
    );
  const mine = mineQuery.data;
  if (!mine) return null;

  const { ongoing, upcoming } = sortSections(mine.upcoming);
  const past = mine.past.items.slice(0, visiblePast);
  const medals = profileQuery.data?.medals;

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-ink">
          <Calendar3 className="text-muted" aria-hidden="true" />
          {t("wca.mine.summaryUpcoming", { count: mine.upcoming.length })}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-ink">
          <Trophy className="text-muted" aria-hidden="true" />
          {t("wca.mine.summaryPast", { count: profileQuery.data?.competitionCount ?? mine.past.total })}
        </span>
        {medals && medals.total > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-ink">
            {t("wca.mine.summaryMedals", { gold: medals.gold, silver: medals.silver, bronze: medals.bronze })}
          </span>
        ) : null}
      </div>
      {mineQuery.isFetching ? (
        <div className="mt-2">
          <RefreshIndicator label={t("wca.refreshing")} />
        </div>
      ) : null}

      {ongoing.length ? (
        <Section id="my-ongoing" title={t("wca.mine.ongoing")} count={ongoing.length}>
          <List items={ongoing} />
        </Section>
      ) : null}

      <Section id="my-upcoming" title={t("wca.mine.upcoming")} count={upcoming.length}>
        {upcoming.length ? (
          <List items={upcoming} />
        ) : (
          <p className="m-0 px-1 text-sm text-muted">{t("wca.mine.emptyUpcoming")}</p>
        )}
      </Section>

      {profileQuery.data?.personalRecords.length ? (
        <Section id="my-records" title={t("wca.mine.personalRecords")} count={profileQuery.data.personalRecords.length}>
          <div className="overflow-x-auto rounded-2xl bg-surface p-3 sm:p-4">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.pr.event")}</th>
                  <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.pr.single")}</th>
                  <th scope="col" className="py-1 font-semibold">{t("wca.mine.pr.average")}</th>
                </tr>
              </thead>
              <tbody>
                {profileQuery.data.personalRecords.map(record => (
                  <tr key={record.eventId} className="align-top odd:bg-surface-2/60">
                    <td className="py-1.5 pr-3 font-semibold">{wcaEventShortName(record.eventId, language)}</td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {formatWcaRecordValue(record.eventId, "single", record.singleCentiseconds)}
                      <span className="block text-xs text-muted">{ranks(record.singleRanks)}</span>
                    </td>
                    <td className="py-1.5 tabular-nums">
                      {formatWcaRecordValue(record.eventId, "average", record.averageCentiseconds)}
                      <span className="block text-xs text-muted">{ranks(record.averageRanks)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      <Section id="my-past" title={t("wca.mine.past")} count={mine.past.total}>
        {past.length ? (
          <>
            <List items={past} />
            {past.length < mine.past.total ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="m-0 text-xs text-muted">
                  {t("wca.mine.showing", { shown: past.length, total: mine.past.total })}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setVisiblePast(value => value + PAST_STEP)}
                >
                  {t("wca.mine.loadMore")}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="m-0 px-1 text-sm text-muted">{t("wca.mine.emptyPast")}</p>
        )}
      </Section>
    </div>
  );
}
