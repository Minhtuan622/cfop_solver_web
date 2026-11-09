import { ChevronDown, ExternalLink, Trophy } from "@/components/ui/Icon";
import { StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { wcaEventName } from "@/lib/wcaEvents";
import { formatWcaRecordValue, type WcaRecordField } from "../lib/wcaRecords";
import type { WcaWorldRecord } from "../lib/wcaCalendar";
import { useState } from "react";

const WCA_RECORDS_URL = "https://www.worldcubeassociation.org/results/records";

const RECORD_FIELDS: ReadonlyArray<{
  field: WcaRecordField;
  labelKey: string;
}> = [
  { field: "single", labelKey: "wca.records.single" },
  { field: "average", labelKey: "wca.records.average" },
];

export type WcaWorldRecordsProps = {
  records: readonly WcaWorldRecord[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
};

/**
 * The current world records, collapsed by default so they stay out of the way
 * of the calendar. The header still announces the 3×3 record, so a visitor
 * knows what is behind the toggle without opening it.
 */
export function WcaWorldRecords({
  records,
  isLoading,
  isError,
  error,
}: WcaWorldRecordsProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const threeByThree = records?.find(record => record.eventId === "333");
  const preview = threeByThree
    ? `3×3 ${formatWcaRecordValue("333", "single", threeByThree.single)} · ${formatWcaRecordValue("333", "average", threeByThree.average)}`
    : null;

  return (
    <section
      className="mt-8 rounded-card border border-line/80 bg-surface p-4 shadow-soft sm:p-5"
      aria-labelledby="wca-world-records-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="wca-world-records-title"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink"
          >
            <Trophy className="text-warning" aria-hidden="true" />
            {t("wca.records.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {isLoading
              ? t("wca.records.loading")
              : (preview ?? t("wca.records.hint"))}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-expanded={open}
          aria-controls="wca-world-records-panel"
          onClick={() => setOpen(value => !value)}
        >
          {open
            ? t("wca.records.collapse")
            : t("wca.records.expand", { count: records?.length ?? 17 })}
          <ChevronDown
            className={`text-base transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open ? (
        <div
          id="wca-world-records-panel"
          className="mt-4 border-t border-line pt-4"
        >
          {isError ? (
            <StatusFeedback tone="danger" title={t("wca.records.loadFailed")}>
              {errorMessage(error, t)}
            </StatusFeedback>
          ) : null}

          {!isError && records?.length === 0 ? (
            <p className="text-sm text-muted">{t("wca.records.empty")}</p>
          ) : null}

          {!isError && records?.length ? (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {records.map(record => (
                  <li
                    className="rounded-panel border border-line bg-surface p-3"
                    key={record.eventId}
                  >
                    <h3 className="mb-2 text-xs font-semibold tracking-tight text-ink">
                      {wcaEventName(record.eventId, language)}
                    </h3>
                    <dl className="flex flex-wrap gap-x-4 gap-y-2">
                      {RECORD_FIELDS.map(({ field, labelKey }) => (
                        <div key={field}>
                          <dt className="text-[10px] font-semibold tracking-[0.06em] text-muted uppercase">
                            {t(labelKey)}
                          </dt>
                          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                            {formatWcaRecordValue(
                              record.eventId,
                              field,
                              record[field]
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <a
                  className="text-sm font-medium text-primary underline decoration-line underline-offset-2"
                  href={WCA_RECORDS_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("wca.records.open")}
                  <ExternalLink className="ml-1" />
                </a>
              </div>
            </>
          ) : null}

          {isLoading ? (
            <div
              className="mt-4 grid grid-cols-2 gap-3 text-muted sm:grid-cols-3 xl:grid-cols-4"
              role="status"
              aria-label={t("wca.records.loading")}
            >
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  className="rounded-panel border border-line bg-surface p-3"
                  key={index}
                >
                  <span className="mb-2 block h-3 w-5/12 rounded-full bg-surface-3" />
                  <span className="block h-3 w-10/12 rounded-full bg-surface-3" />
                </div>
              ))}
              <span className="sr-only">{t("wca.records.loading")}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
