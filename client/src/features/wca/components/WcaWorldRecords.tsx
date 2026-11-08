import { ChevronDown, ExternalLink, Trophy } from "@/components/ui/BootstrapIcon";
import { StatusFeedback } from "@/components/ui/BootstrapUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { wcaEventName } from "@/lib/wcaEvents";
import { formatWcaRecordValue, type WcaRecordField } from "../lib/wcaRecords";
import type { WcaWorldRecord } from "../lib/wcaCalendar";
import { useState } from "react";

const WCA_RECORDS_URL = "https://www.worldcubeassociation.org/results/records";

const RECORD_FIELDS: ReadonlyArray<{ field: WcaRecordField; labelKey: string }> = [
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
export function WcaWorldRecords({ records, isLoading, isError, error }: WcaWorldRecordsProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const threeByThree = records?.find((record) => record.eventId === "333");
  const preview = threeByThree
    ? `3×3 ${formatWcaRecordValue("333", "single", threeByThree.single)} · ${formatWcaRecordValue("333", "average", threeByThree.average)}`
    : null;

  return (
    <section className="cfop-world-records" aria-labelledby="wca-world-records-title">
      <div className="cfop-world-records__header">
        <div className="cfop-world-records__heading">
          <h2 id="wca-world-records-title" className="cfop-world-records__title">
            <Trophy aria-hidden="true" />
            {t("wca.records.title")}
          </h2>
          <p className="cfop-world-records__hint">
            {isLoading ? t("wca.records.loading") : preview ?? t("wca.records.hint")}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm cfop-world-records__toggle"
          aria-expanded={open}
          aria-controls="wca-world-records-panel"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("wca.records.collapse") : t("wca.records.expand", { count: records?.length ?? 17 })}
          <ChevronDown className={open ? "cfop-world-records__chevron is-open" : "cfop-world-records__chevron"} />
        </button>
      </div>

      {open ? (
        <div id="wca-world-records-panel" className="cfop-world-records__content">
          {isError ? (
            <StatusFeedback tone="danger" title={t("wca.records.loadFailed")}>{errorMessage(error, t)}</StatusFeedback>
          ) : null}

          {!isError && records?.length === 0 ? (
            <p className="small text-body-secondary mb-0">{t("wca.records.empty")}</p>
          ) : null}

          {!isError && records?.length ? (
            <>
              <ul className="cfop-world-records__grid list-unstyled mb-3">
                {records.map((record) => (
                  <li className="cfop-world-record" key={record.eventId}>
                    <h3 className="cfop-world-record__event">{wcaEventName(record.eventId, language)}</h3>
                    <dl className="cfop-world-record__values mb-0">
                      {RECORD_FIELDS.map(({ field, labelKey }) => (
                        <div className="cfop-world-record__value" key={field}>
                          <dt className="cfop-world-record__label">{t(labelKey)}</dt>
                          <dd className="cfop-world-record__result mb-0">{formatWcaRecordValue(record.eventId, field, record[field])}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-end">
                <a className="cfop-world-records__link" href={WCA_RECORDS_URL} target="_blank" rel="noreferrer">
                  {t("wca.records.open")}
                  <ExternalLink className="ms-1" />
                </a>
              </div>
            </>
          ) : null}

          {isLoading ? (
            <div className="cfop-world-records__grid placeholder-glow text-body-secondary" role="status" aria-label={t("wca.records.loading")}>
              {Array.from({ length: 8 }, (_, index) => (
                <div className="cfop-world-record" key={index}>
                  <span className="placeholder col-5 mb-2" />
                  <span className="placeholder col-10" />
                </div>
              ))}
              <span className="visually-hidden">{t("wca.records.loading")}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
