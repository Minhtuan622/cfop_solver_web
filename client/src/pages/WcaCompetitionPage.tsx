import { Link, useRoute } from "wouter";
import { buttonClass } from "@/components/ui/Button";
import { PageHeader, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { CompetitionExplorer } from "@/features/wca/components/CompetitionExplorer";
import { CompetitionInfoSections } from "@/features/wca/components/MyCompetitionDetail";

export default function WcaCompetitionPage() {
  const { t } = useLanguage();
  const [, params] = useRoute("/wca/competitions/:id");
  const id = params?.id ?? "";
  const query = trpc.wca.competitionInfo.useQuery({ id }, { enabled: Boolean(id), staleTime: 5 * 60 * 1000, retry: false });
  const info = query.data;
  const today = new Date().toISOString().slice(0, 10);
  const started = info ? info.startDate <= today : false;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader
        title={info?.name ?? t("wcax.competition.title")}
        description={info ? undefined : t("wcax.competition.description")}
        actions={
          <Link href="/wca" className={buttonClass("secondary", "md")}>
            {t("wcax.backToWca")}
          </Link>
        }
      />
      {query.isLoading ? <SkeletonList rows={4} label={t("wcax.loading")} /> : null}
      {query.isError ? (
        <StatusFeedback tone="danger" title={t("wcax.failed")}>
          {errorMessage(query.error, t)}
        </StatusFeedback>
      ) : null}
      {info ? (
        <div className="flex flex-col gap-5">
          <CompetitionInfoSections info={info} />
          <CompetitionExplorer
            competitionId={info.id}
            eventIds={info.eventIds}
            initial={started ? "results" : "psych"}
          />
        </div>
      ) : null}
    </div>
  );
}
