import { ChevronDown, ExternalLink, Trophy } from "@/components/ui/Icon";
import { StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { wcaEventName } from "@/lib/wcaEvents";
import { formatWcaRecordValue, type WcaRecordField } from "../lib/wcaRecords";
import type { WcaWorldRecord } from "../lib/wcaCalendar";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

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

  return (
    <section
      className="mt-6 rounded-3xl bg-warning-soft p-4 sm:p-5"
      aria-labelledby="wca-world-records-title"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning text-on-warning"
          aria-hidden="true"
        >
          <Trophy className="text-xl" />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <h2
            id="wca-world-records-title"
            className="text-sm font-semibold tracking-tight text-ink"
          >
            {t("wca.records.title")}
          </h2>
          {isLoading ? (
            <p className="mt-0.5 text-sm text-muted">
              {t("wca.records.loading")}
            </p>
          ) : threeByThree ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-ink">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                3×3
              </span>
              <span className="text-xl font-bold tabular-nums tracking-tight">
                {formatWcaRecordValue("333", "single", threeByThree.single)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {t("wca.records.single")}
              </span>
              <span aria-hidden="true" className="text-muted">
                ·
              </span>
              <span className="text-xl font-bold tabular-nums tracking-tight">
                {formatWcaRecordValue("333", "average", threeByThree.average)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {t("wca.records.average")}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted">{t("wca.records.hint")}</p>
          )}
        </div>
        <Button
          variant="soft"
          size="plain"
          className="shrink-0 px-3 py-1.5 text-xs"
          type="button"
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
        </Button>
      </div>

      {open ? (
        <div
          id="wca-world-records-panel"
          className="mt-3"
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
                    className="rounded-2xl bg-surface p-3"
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
                  className="rounded-2xl bg-surface p-3"
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
