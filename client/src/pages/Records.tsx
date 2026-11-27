import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button, buttonClass } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { EmptyState, PageHeader, RefreshIndicator, SectionCard, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { readSolveHistory } from "@/lib/solveHistory";
import { trpc } from "@/lib/trpc";
import { RecentRecordsList } from "@/features/wca/components/RecentRecordsList";
import { RecordsTable } from "@/features/wca/components/RecordsTable";
import { flagEmoji } from "@/features/wca/lib/wcaCalendar";
import { ownBest, recordsForRegion, type OwnBest, type Region } from "@/features/wca/lib/recordsView";

const WCA_RECORDS_URL = "https://www.worldcubeassociation.org/results/records";

type RegionKind = Region["kind"];

export default function Records() {
  const { t } = useLanguage();
  const [kind, setKind] = useState<RegionKind>("world");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [history] = useState(() => readSolveHistory());

  const recordsQuery = trpc.wca.records.useQuery(undefined, { staleTime: 60 * 60 * 1000, retry: 1 });
  const recentQuery = trpc.wca.recentRecords.useQuery(undefined, { staleTime: 5 * 60 * 1000, retry: 0 });
  const data = recordsQuery.data;

  const region: Region = useMemo(() => {
    if (kind === "continent") return { kind, id: continent || data?.continents[0]?.id || "" };
    if (kind === "country") return { kind, name: country || data?.countries[0]?.name || "" };
    return { kind: "world" };
  }, [kind, continent, country, data]);

  const rows = data ? recordsForRegion(data, region) : [];
  const ownBests = useMemo(() => {
    const result: Record<string, OwnBest | null> = {};
    for (const row of data?.world ?? []) result[row.eventId] = ownBest(history, row.eventId);
    return result;
  }, [data, history]);
  const hasOwn = Object.values(ownBests).some(Boolean);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        title={t("records.title")}
        description={t("records.description")}
        actions={
          <>
            <Link href="/wca" className={buttonClass("secondary", "md")}>
              {t("records.openCalendar")}
            </Link>
            <a
              href={WCA_RECORDS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "md")}
            >
              {t("wca.records.open")}
              <ExternalLink className="text-sm" aria-hidden="true" />
            </a>
          </>
        }
      />

      <SectionCard title={t("records.current")} description={hasOwn ? t("records.ownHint") : undefined}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t("records.region")} className="flex flex-wrap gap-2">
            {(["world", "continent", "country"] as const).map(item => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={kind === item ? "primary" : "secondary"}
                aria-pressed={kind === item}
                onClick={() => setKind(item)}
              >
                {t(`records.region.${item}`)}
              </Button>
            ))}
          </div>
          {kind === "continent" && data ? (
            <Select
              aria-label={t("records.region.continent")}
              className="min-w-40"
              value={region.kind === "continent" ? region.id : ""}
              onChange={event => setContinent(event.target.value)}
            >
              {data.continents.map(item => (
                <option key={item.id} value={item.id}>
                  {t(`records.continent.${item.id}`)}
                </option>
              ))}
            </Select>
          ) : null}
          {kind === "country" && data ? (
            <Select
              aria-label={t("records.region.country")}
              className="min-w-52"
              value={region.kind === "country" ? region.name : ""}
              onChange={event => setCountry(event.target.value)}
            >
              {data.countries.map(item => (
                <option key={item.name} value={item.name}>
                  {item.iso2 ? `${flagEmoji(item.iso2)} ` : ""}
                  {item.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        {recordsQuery.isFetching && data ? <RefreshIndicator label={t("wca.refreshing")} /> : null}
        {recordsQuery.isLoading ? <SkeletonList rows={6} label={t("records.loading")} /> : null}
        {recordsQuery.isError ? (
          <StatusFeedback tone="danger" title={t("records.loadFailed")}>
            {errorMessage(recordsQuery.error, t)}
          </StatusFeedback>
        ) : null}
        {data && rows.length === 0 ? <EmptyState title={t("records.empty")} /> : null}
        {data && rows.length > 0 ? (
          <RecordsTable rows={rows} world={data.world} isWorld={kind === "world"} ownBests={ownBests} />
        ) : null}
      </SectionCard>

      <div className="mt-6">
        <SectionCard title={t("records.recent.title")} description={t("records.recent.description")}>
          <RecentRecordsList
            records={recentQuery.data}
            isLoading={recentQuery.isLoading}
            isError={recentQuery.isError}
            error={recentQuery.error}
          />
        </SectionCard>
      </div>
    </div>
  );
}
