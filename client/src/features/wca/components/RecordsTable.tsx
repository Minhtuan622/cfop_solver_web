import { useLanguage } from "@/contexts/LanguageContext";
import { formatSolveTime } from "@/lib/solveHistory";
import { wcaEventName } from "@/lib/wcaEvents";
import {
  formatRatio,
  gapMs,
  ratioToWorld,
  type OwnBest,
  type RecordRow,
} from "../lib/recordsView";
import { formatWcaRecordValue } from "../lib/wcaRecords";

type Props = {
  rows: readonly RecordRow[];
  world: readonly RecordRow[];
  isWorld: boolean;
  ownBests: Readonly<Record<string, OwnBest | null>>;
};

function Cell({
  eventId,
  field,
  value,
  world,
  isWorld,
  ownMs,
}: {
  eventId: string;
  field: "single" | "average";
  value: number | null;
  world: readonly RecordRow[];
  isWorld: boolean;
  ownMs: number | null | undefined;
}) {
  const { t } = useLanguage();
  const ratio = isWorld ? null : ratioToWorld(eventId, field, value, world);
  const gap = gapMs(ownMs ?? null, value);
  return (
    <div>
      <p className="m-0 text-lg font-bold tabular-nums tracking-tight text-ink">
        {formatWcaRecordValue(eventId, field, value)}
      </p>
      {ratio !== null ? (
        <p className="m-0 text-xs tabular-nums text-muted">
          {t("records.vsWorld", { ratio: formatRatio(ratio) })}
        </p>
      ) : null}
      {gap !== null && ownMs !== null && ownMs !== undefined ? (
        <p className="m-0 text-xs tabular-nums text-primary">
          {t("records.yours", { time: formatSolveTime(ownMs) })}
          {" · "}
          {gap <= 0
            ? t("records.beaten")
            : t("records.behind", { seconds: (gap / 1000).toFixed(2) })}
        </p>
      ) : null}
    </div>
  );
}

export function RecordsTable({ rows, world, isWorld, ownBests }: Props) {
  const { language, t } = useLanguage();
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(row => {
        const own = ownBests[row.eventId] ?? null;
        return (
          <li key={row.eventId} className="rounded-2xl bg-surface p-4">
            <h3 className="mb-3 mt-0 text-sm font-semibold tracking-tight text-ink">
              {wcaEventName(row.eventId, language)}
            </h3>
            <dl className="m-0 grid grid-cols-2 gap-4">
              <div>
                <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {t("wca.records.single")}
                </dt>
                <dd className="m-0">
                  <Cell
                    eventId={row.eventId}
                    field="single"
                    value={row.single}
                    world={world}
                    isWorld={isWorld}
                    ownMs={own?.singleMs}
                  />
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {t("wca.records.average")}
                </dt>
                <dd className="m-0">
                  <Cell
                    eventId={row.eventId}
                    field="average"
                    value={row.average}
                    world={world}
                    isWorld={isWorld}
                    ownMs={own?.averageMs}
                  />
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
