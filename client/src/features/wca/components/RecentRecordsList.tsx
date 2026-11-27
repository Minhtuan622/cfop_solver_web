import { useState } from "react";
import { ExternalLink } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  SkeletonList,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { wcaEventName } from "@/lib/wcaEvents";
import { cn } from "@/lib/utils";
import {
  countByTag,
  filterRecent,
  type RecentRecord,
  type TagFilter,
} from "../lib/recordsView";
import { flagEmoji } from "../lib/wcaCalendar";
import { formatWcaRecordValue } from "../lib/wcaRecords";

const FILTERS: readonly TagFilter[] = ["ALL", "WR", "CR", "NR"];
const WCA_PERSON_URL = "https://www.worldcubeassociation.org/persons/";
const WCA_COMPETITION_URL =
  "https://www.worldcubeassociation.org/competitions/";

type Props = {
  records: readonly RecentRecord[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
};

function dateLabel(iso: string | null, language: string) {
  if (!iso) return "";
  const time = Date.parse(iso);
  return Number.isFinite(time)
    ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
      }).format(time)
    : "";
}

export function RecentRecordsList({
  records,
  isLoading,
  isError,
  error,
}: Props) {
  const { language, t } = useLanguage();
  const [tag, setTag] = useState<TagFilter>("ALL");
  const counts = countByTag(records ?? []);
  const shown = filterRecent(records ?? [], tag);

  if (isLoading)
    return <SkeletonList rows={4} label={t("records.recent.loading")} />;
  if (isError)
    return (
      <StatusFeedback tone="danger" title={t("records.recent.failed")}>
        {errorMessage(error, t)}
      </StatusFeedback>
    );
  if (!records?.length)
    return (
      <EmptyState
        title={t("records.recent.empty")}
        description={t("records.recent.emptyHint")}
      />
    );

  return (
    <div>
      <div
        role="group"
        aria-label={t("records.recent.filter")}
        className="mb-3 flex flex-wrap gap-2"
      >
        {FILTERS.map(item => (
          <Button
            key={item}
            type="button"
            size="xs"
            variant={tag === item ? "primary" : "secondary"}
            aria-pressed={tag === item}
            onClick={() => setTag(item)}
          >
            {item === "ALL"
              ? t("records.recent.all", { count: records.length })
              : `${t(`records.tag.${item}`)} · ${counts[item]}`}
          </Button>
        ))}
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {shown.map(record => (
          <li
            key={record.id}
            className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3"
          >
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                record.tag === "WR"
                  ? "bg-danger-soft text-danger"
                  : record.tag === "CR"
                    ? "bg-warning/20 text-ink"
                    : "bg-primary-soft text-primary"
              )}
              title={t(`records.tag.${record.tag}`)}
            >
              {record.tag}
            </span>
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
              <p className="m-0 min-w-0 text-sm font-semibold text-ink">
                {record.countryIso2 ? (
                  <span aria-hidden="true">
                    {flagEmoji(record.countryIso2)}{" "}
                  </span>
                ) : null}
                {record.wcaId ? (
                  <a
                    href={`${WCA_PERSON_URL}${record.wcaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-primary"
                  >
                    {record.personName}
                  </a>
                ) : (
                  record.personName
                )}
              </p>
              <p className="m-0 text-right text-lg font-bold tabular-nums tracking-tight text-ink">
                {formatWcaRecordValue(
                  record.eventId,
                  record.type,
                  record.attemptResult
                )}
              </p>
              <p className="m-0 min-w-0 truncate text-xs text-muted">
                {wcaEventName(record.eventId, language)} ·{" "}
                {t(`wca.records.${record.type}`)}
                {record.competitionName ? (
                  <>
                    {" · "}
                    {record.competitionId ? (
                      <a
                        href={`${WCA_COMPETITION_URL}${record.competitionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted underline decoration-line underline-offset-2 hover:text-primary"
                      >
                        {record.competitionName}
                      </a>
                    ) : (
                      record.competitionName
                    )}
                  </>
                ) : null}
              </p>
              <p className="m-0 text-right text-xs text-muted">
                {dateLabel(record.enteredAt, language)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-3 text-xs text-muted">
        <ExternalLink className="mr-1 inline text-[10px]" aria-hidden="true" />
        {t("records.recent.source")}
      </p>
    </div>
  );
}
