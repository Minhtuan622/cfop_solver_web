import { useState } from "react";
import { PersonCircle } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingTransition } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatSolveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { wcaTimerComparison } from "@/features/wca/lib/wcaTimerComparison";
import {
  comparisonMessage,
  formatWcaTime,
  rankSummary,
  wcaEventName,
  type WcaProfileData,
  type WcaRecordRow,
} from "../lib/profilePresentation";

/** Bảng so sánh thời gian Timer (3×3) với thành tích WCA. */
function WcaTimerComparison({
  entries,
  record,
}: {
  entries: SolveHistoryEntry[];
  record: Pick<WcaRecordRow, "singleCentiseconds" | "averageCentiseconds">;
}) {
  const { t } = useLanguage();
  const rows = wcaTimerComparison(entries, record);
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold tracking-tight mb-1">
        {t("profile.compare.title")}
      </h3>
      <p className="text-sm text-muted mb-2">{t("profile.compare.hint")}</p>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:py-1.5 [&_td]:py-1.5 align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">{t("profile.compare.metric")}</th>
              <th scope="col">{t("profile.compare.timer")}</th>
              <th scope="col">{t("profile.compare.wca")}</th>
              <th scope="col">{t("profile.compare.delta")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td>
                  {row.timerMs === null ? "—" : formatSolveTime(row.timerMs)}
                </td>
                <td>{row.wcaMs === null ? "—" : formatSolveTime(row.wcaMs)}</td>
                <td
                  className={
                    row.deltaMs === null
                      ? "text-muted"
                      : row.deltaMs < 0
                        ? "text-success"
                        : row.deltaMs > 0
                          ? "text-primary"
                          : "text-muted"
                  }
                >
                  {comparisonMessage(row.deltaMs, t)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted mb-0 mt-2">
        {t("profile.compare.footer")}
      </p>
    </div>
  );
}

/** Hồ sơ WCA đã liên kết: thành tích 3×3, huy chương, kỷ lục, so sánh với Timer. */
export function WcaProfileDetails({
  profile,
  entries,
}: {
  profile: WcaProfileData;
  entries: SolveHistoryEntry[];
}) {
  const { language, t } = useLanguage();
  const [showAllRecords, setShowAllRecords] = useState(false);
  const threeByThree = profile.personalRecords.find(
    record => record.eventId === "333"
  );
  const locale = language === "vi" ? "vi-VN" : "en-US";
  return (
    <LoadingTransition className="mt-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="rounded-full bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center"
          style={{ width: 58, height: 58 }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={t("profile.wcaAvatarAlt", { name: profile.name })}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <PersonCircle className="text-2xl" />
          )}
        </div>
        <div>
          <p className="font-semibold mb-0">{profile.name}</p>
          <p className="text-sm text-muted mb-0">
            {profile.wcaId} ·{" "}
            {profile.countryName ||
              profile.countryIso2 ||
              t("profile.wcaCountryUnknown")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-2 text-sm mt-2">
        <div className="col-span-6">
          <p className="text-muted mb-0">{t("profile.compare.single")}</p>
          <p className="mb-0 font-semibold">
            {formatWcaTime(threeByThree?.singleCentiseconds)}
          </p>
        </div>
        <div className="col-span-6">
          <p className="text-muted mb-0">{t("profile.compare.average")}</p>
          <p className="mb-0 font-semibold">
            {formatWcaTime(threeByThree?.averageCentiseconds)}
          </p>
        </div>
        <div className="col-span-6">
          <p className="text-muted mb-0">{t("profile.wcaSolves")}</p>
          <p className="mb-0 font-semibold">
            {profile.competitionCount.toLocaleString(locale)} /{" "}
            {profile.totalSolves.toLocaleString(locale)}
          </p>
        </div>
        <div className="col-span-6">
          <p className="text-muted mb-0">{t("profile.wcaMedals")}</p>
          <p className="mb-0 font-semibold">
            {profile.medals.total.toLocaleString(locale)}{" "}
            <span className="text-muted font-normal">
              {t("profile.wcaMedalsBreakdown", {
                gold: profile.medals.gold,
                silver: profile.medals.silver,
                bronze: profile.medals.bronze,
              })}
            </span>
          </p>
        </div>
        <div className="col-span-6">
          <p className="text-muted mb-0">{t("profile.wcaRecords")}</p>
          <p className="mb-0 font-semibold">
            {profile.records.total.toLocaleString(locale)}{" "}
            <span className="text-muted font-normal">
              {t("profile.wcaRecordsBreakdown", {
                world: profile.records.world,
                continental: profile.records.continental,
                national: profile.records.national,
              })}
            </span>
          </p>
        </div>
        <div className="col-span-6">
          <p className="text-muted mb-0">{t("profile.wcaRank")}</p>
          <p className="mb-0 font-semibold">
            {rankSummary(
              threeByThree?.averageRanks ?? {
                world: null,
                continental: null,
                country: null,
              },
              language
            )}
          </p>
        </div>
      </div>
      <WcaTimerComparison
        entries={entries}
        record={
          threeByThree ?? {
            singleCentiseconds: null,
            averageCentiseconds: null,
          }
        }
      />
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        type="button"

        aria-expanded={showAllRecords}
        onClick={() => setShowAllRecords(value => !value)}
      >
        {showAllRecords
          ? t("profile.wcaRecordsHide")
          : t("profile.wcaRecordsToggle", {
              count: profile.personalRecords.length,
            })}
      </Button>
      {showAllRecords ? (
        <div className="w-full overflow-x-auto mt-4">
          <table className="w-full text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:py-1.5 [&_td]:py-1.5 align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">{t("profile.wcaEvent")}</th>
                <th scope="col">{t("profile.wcaSingle")}</th>
                <th scope="col">{t("profile.wcaAverage")}</th>
                <th scope="col">{t("profile.wcaRankSingle")}</th>
                <th scope="col">{t("profile.wcaRankAverage")}</th>
              </tr>
            </thead>
            <tbody>
              {profile.personalRecords.map(record => (
                <tr key={record.eventId}>
                  <th scope="row">{wcaEventName(record.eventId, language)}</th>
                  <td>{formatWcaTime(record.singleCentiseconds)}</td>
                  <td>{formatWcaTime(record.averageCentiseconds)}</td>
                  <td className="text-sm">
                    {rankSummary(record.singleRanks, language)}
                  </td>
                  <td className="text-sm">
                    {rankSummary(record.averageRanks, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </LoadingTransition>
  );
}
