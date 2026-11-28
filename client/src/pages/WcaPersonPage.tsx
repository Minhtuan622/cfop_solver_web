import { Link, useRoute } from "wouter";
import { buttonClass } from "@/components/ui/Button";
import { ExternalLink, PersonCircle } from "@/components/ui/Icon";
import { PageHeader, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { wcaEventName } from "@/lib/wcaEvents";
import { flagEmoji } from "@/features/wca/lib/wcaCalendar";
import { formatWcaRecordValue } from "@/features/wca/lib/wcaRecords";

function rankText(ranks: { world: number | null; continental: number | null; country: number | null }) {
  const parts: Array<[string, number | null]> = [
    ["TG", ranks.world],
    ["CL", ranks.continental],
    ["QG", ranks.country],
  ];
  const shown = parts.filter((item): item is [string, number] => item[1] !== null);
  return shown.length ? shown.map(([label, rank]) => `${label} #${rank.toLocaleString("en-US")}`).join(" · ") : "—";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-panel bg-surface px-4 py-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="m-0 mt-0.5 text-xl font-bold tabular-nums text-ink">{value.toLocaleString("en-US")}</p>
    </div>
  );
}

export default function WcaPersonPage() {
  const { language, t } = useLanguage();
  const [, params] = useRoute("/wca/persons/:wcaId");
  const wcaId = params?.wcaId ?? "";
  const query = trpc.wca.person.useQuery({ wcaId }, { enabled: Boolean(wcaId), staleTime: 10 * 60 * 1000, retry: false });
  const person = query.data;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        title={person?.name ?? t("wcax.person.title")}
        description={person ? `${person.wcaId} · ${flagEmoji(person.countryIso2)} ${person.countryName}` : undefined}
        actions={
          <>
            <Link href="/wca?tab=people" className={buttonClass("secondary", "md")}>
              {t("wcax.backToSearch")}
            </Link>
            {person ? (
              <a href={person.profileUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
                {t("wca.mine.link.wca")}
                <ExternalLink className="text-sm" aria-hidden="true" />
              </a>
            ) : null}
          </>
        }
      />
      {query.isLoading ? <SkeletonList rows={4} label={t("wcax.loading")} /> : null}
      {query.isError ? (
        <StatusFeedback tone="danger" title={t("wcax.failed")}>
          {errorMessage(query.error, t)}
        </StatusFeedback>
      ) : null}
      {person ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt={person.name} className="h-16 w-16 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <PersonCircle className="text-6xl text-muted" aria-hidden="true" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <Stat label={t("wcax.person.competitions")} value={person.competitionCount} />
            <Stat label={t("wcax.person.solves")} value={person.totalSolves} />
            <Stat label={t("wcax.person.gold")} value={person.medals.gold} />
            <Stat label={t("wcax.person.silver")} value={person.medals.silver} />
            <Stat label={t("wcax.person.bronze")} value={person.medals.bronze} />
            <Stat label={t("wcax.person.records")} value={person.records.total} />
          </div>
          <section>
            <h4 className="mb-2 mt-0 text-sm font-semibold tracking-tight text-ink">{t("wcax.person.pr")}</h4>
            {person.personalRecords.length === 0 ? (
              <p className="m-0 text-sm text-muted">{t("wcax.person.noPr")}</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-muted">
                      <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.pr.event")}</th>
                      <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.pr.single")}</th>
                      <th scope="col" className="py-1 pr-3 font-semibold">{t("wcax.person.ranks")}</th>
                      <th scope="col" className="py-1 pr-3 font-semibold">{t("wca.mine.pr.average")}</th>
                      <th scope="col" className="py-1 font-semibold">{t("wcax.person.ranks")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {person.personalRecords.map(record => (
                      <tr key={record.eventId} className="odd:bg-surface-2/60">
                        <th scope="row" className="py-1 pr-3 font-medium">{wcaEventName(record.eventId, language)}</th>
                        <td className="py-1 pr-3 tabular-nums">{formatWcaRecordValue(record.eventId, "single", record.singleCentiseconds)}</td>
                        <td className="py-1 pr-3 text-xs text-muted">{rankText(record.singleRanks)}</td>
                        <td className="py-1 pr-3 tabular-nums">{formatWcaRecordValue(record.eventId, "average", record.averageCentiseconds)}</td>
                        <td className="py-1 text-xs text-muted">{rankText(record.averageRanks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
