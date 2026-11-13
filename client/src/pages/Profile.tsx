import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { ProfileProgressChart } from "@/features/profile/components/ProfileProgressChart";
import {
  applyCfopCloudState,
  createCfopCloudState,
  mergeCfopCloudStates,
  parseCfopCloudState,
} from "@/lib/cloudSync";
import {
  filterProfileProgress,
  meetsAo5Goal,
  profileProgressByDay,
  type ProfileProgressRange,
} from "@/features/profile/lib/profileProgress";
import {
  Eyebrow,
  LoadingTransition,
  RefreshIndicator,
  SkeletonCard,
  StatTile,
} from "@/components/ui/StudioUI";
import { trpc } from "@/lib/trpc";
import {
  readSolveHistory,
  effectiveTime,
  formatSolveTime,
} from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";
import { DEFAULT_TIMER_EVENT, normalizeTimerEventId } from "@/lib/timerEvents";
import { wcaTimerComparison } from "@/lib/wcaTimerComparison";
import {
  dueMemoRecords,
  readBldProfile,
  reviewStreak,
} from "@/features/bld/lib";
import {
  readLastLayerStudy,
  todayReviewCount,
} from "@/features/last-layer/lib";
import {
  comparisonMessage,
  formatWcaTime,
  initials,
  rankSummary,
  wcaEventName,
  type WcaProfileData,
  type WcaRecordRow,
} from "@/features/profile/lib/profilePresentation";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";
import {
  AlertTriangle,
  BookOpenCheck,
  BoxArrowRight,
  CheckCircleFill,
  Clock3,
  PersonCircle,
  Timer,
  Trophy,
} from "@/components/ui/Icon";

function WcaTimerComparison({
  entries,
  record,
}: {
  entries: ReturnType<typeof readSolveHistory>;
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

function WcaProfileDetails({
  profile,
  entries,
}: {
  profile: WcaProfileData;
  entries: ReturnType<typeof readSolveHistory>;
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

export default function Profile() {
  const { language, t } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const utils = trpc.useUtils();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });
  const account = accountQuery.data;
  const [entries] = useState(() => readSolveHistory());
  const [bld] = useState(() => readBldProfile());
  const [lastLayer] = useState(() => readLastLayerStudy());
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [goalSeconds, setGoalSeconds] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [progressRange, setProgressRange] =
    useState<ProfileProgressRange>("30d");
  const [location] = useLocation();
  const syncQuery = trpc.cfopAccount.cloudState.get.useQuery(undefined, {
    enabled: Boolean(account),
    retry: false,
  });
  const wcaProfileQuery = trpc.cfopAccount.wca.profile.useQuery(undefined, {
    enabled: Boolean(account?.wcaId),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const wcaOauthStatusQuery = trpc.cfopAccount.wca.oauthStatus.useQuery(
    undefined,
    { enabled: Boolean(account), staleTime: 60_000, retry: false }
  );
  const updateProfile = trpc.cfopAccount.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.cfopAccount.me.invalidate();
      setMessage(t("profile.profileSaved"));
    },
    onError: next => setError(errorMessage(next, t)),
  });
  const storageStatusQuery = trpc.cfopAccount.storageStatus.useQuery(
    undefined,
    {
      enabled: Boolean(account),
      staleTime: 10 * 60 * 1000,
      retry: false,
    }
  );
  const uploadAvatar = trpc.cfopAccount.uploadAvatar.useMutation({
    onSuccess: async () => {
      await utils.cfopAccount.me.invalidate();
      setMessage(t("profile.avatarSaved"));
    },
    onError: next => setError(errorMessage(next, t)),
  });
  const changePassword = trpc.cfopAccount.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("profile.passwordChanged"));
    },
    onError: next => setError(errorMessage(next, t)),
  });
  const manualSync = trpc.cfopAccount.cloudState.save.useMutation({
    onSuccess: async result => {
      await utils.cfopAccount.cloudState.get.invalidate();
      setMessage(
        t("profile.syncDone", {
          time: new Date(result.updatedAt).toLocaleTimeString(locale),
        })
      );
    },
    onError: async next => {
      const code = (next as { data?: { code?: string } }).data?.code;
      // Client quá cũ (tab mở từ trước khi triển khai): yêu cầu tải lại.
      if (code === "PRECONDITION_FAILED") {
        setError(t("profile.syncReloadRequired"));
        return;
      }
      if (code === "CONFLICT") {
        // Thiết bị khác vừa ghi: đọc bản mới từ máy chủ, gộp với dữ liệu cục
        // bộ rồi lưu lại với revision mới.
        const fresh = await syncQuery.refetch();
        const parsed = parseCfopCloudState(fresh.data?.payload);
        const local = createCfopCloudState();
        const merged = mergeCfopCloudStates(local, parsed);
        applyCfopCloudState(merged);
        manualSync.mutate({
          ...merged,
          baseVersion: fresh.data?.revision ?? null,
        });
        return;
      }
      setError(errorMessage(next, t));
    },
  });
  const startWcaOAuth = trpc.cfopAccount.wca.startOAuth.useMutation({
    onSuccess: result => window.location.assign(result.url),
    onError: next => setError(errorMessage(next, t)),
  });
  const unlinkWca = trpc.cfopAccount.wca.unlink.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.cfopAccount.me.invalidate(),
        utils.cfopAccount.wca.profile.invalidate(),
      ]);
      setMessage(t("profile.wcaUnlinked"));
    },
    onError: next => setError(errorMessage(next, t)),
  });

  useEffect(() => {
    if (account) {
      setDisplayName(account.displayName);
      setBio(account.bio ?? "");
      setGoalSeconds(
        account.goalMs ? String(Math.round(account.goalMs / 1000)) : ""
      );
    }
  }, [account]);
  useEffect(() => {
    const state = new URLSearchParams(location.split("?")[1] ?? "").get("wca");
    if (state === "linked") {
      void Promise.all([
        utils.cfopAccount.me.invalidate(),
        utils.cfopAccount.wca.profile.invalidate(),
      ]);
      setMessage(t("profile.wcaOauthLinked"));
    }
    if (state === "error") setError(t("profile.wcaOauthFailed"));
  }, [location, utils]);

  const timerEntries = entries.filter(
    entry => normalizeTimerEventId(entry.eventId) === DEFAULT_TIMER_EVENT
  );
  const valid = timerEntries
    .map(effectiveTime)
    .filter((value): value is number => value !== null);
  const best = valid.length ? Math.min(...valid) : null;
  const ao5 =
    timerEntries.length >= 5 ? rollingAverage(timerEntries.slice(0, 5)) : null;
  const due = dueMemoRecords(bld).length;
  const streak = reviewStreak(bld);
  const reviewedLastLayer = todayReviewCount(lastLayer.records);
  const chart = useMemo(
    () => profileProgressByDay(timerEntries),
    [timerEntries]
  );
  const filteredChart = useMemo(
    () => filterProfileProgress(chart, progressRange),
    [chart, progressRange]
  );
  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const parsed = goalSeconds.trim() ? Number(goalSeconds) : null;
    if (
      parsed !== null &&
      (!Number.isInteger(parsed) || parsed < 1 || parsed > 3600)
    ) {
      setError(t("profile.goalInvalid"));
      return;
    }
    updateProfile.mutate({
      displayName,
      bio,
      goalMs: parsed === null ? null : parsed * 1000,
    });
  };
  const submitPassword = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    changePassword.mutate({ currentPassword, newPassword });
  };
  const chooseAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (
      !(["image/jpeg", "image/png", "image/webp"] as string[]).includes(
        file.type
      ) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError(t("profile.avatarTypeError"));
      return;
    }
    setError("");
    setAvatarFile(file);
  };
  const uploadCroppedAvatar = (
    blob: Blob,
    contentType: "image/jpeg" | "image/png" | "image/webp"
  ) => {
    const reader = new FileReader();
    reader.onerror = () => setError(t("profile.avatarReadError"));
    reader.onload = () => {
      const base64 =
        typeof reader.result === "string" ? reader.result.split(",")[1] : "";
      if (base64) {
        setAvatarFile(null);
        uploadAvatar.mutate({ data: base64, contentType });
      }
    };
    reader.readAsDataURL(blob);
  };

  if (accountQuery.isLoading)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SkeletonCard lines={6} label={t("profile.loading")} />
      </div>
    );
  if (!account)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mb-0">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("profile.guestTitle")}
          </h1>
          <p className="mb-4">{t("profile.guestDetail")}</p>
          <Link
            href="/"
            className={`${buttonClass("primary", "md")}`}
          >
            {t("profile.guestCta")}
          </Link>
        </div>
      </div>
    );
  const goalLabel = account.goalMs
    ? t("profile.goalFormat", { seconds: Math.round(account.goalMs / 1000) })
    : t("profile.goalUnset");
  const wcaProfile = wcaProfileQuery.data as WcaProfileData | undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <section className="rounded-card bg-surface mb-6 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-12 items-center gap-6">
            <div className="col-span-12 lg:col-span-6">
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="rounded-full bg-primary-soft text-primary flex items-center justify-center overflow-hidden shrink-0"
                  style={{ width: 88, height: 88 }}
                  aria-label={t("profile.avatarAlt")}
                >
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={t("profile.avatarAlt")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold">
                      {initials(account.displayName)}
                    </span>
                  )}
                </div>
                <div>
                  <Eyebrow>{t("profile.eyebrow")}</Eyebrow>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-semibold mb-2">
                    {account.displayName}
                  </h1>
                  <p className="text-muted mb-0">
                    {account.bio || t("profile.bioFallback")}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-span-12">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link
                  href="/timer"
                  className={`${buttonClass("primary", "md")}`}
                >
                  <Timer className="mr-2" />
                  {t("profile.openTimer")}
                </Link>
                <Link
                  href="/history"
                  className={`${buttonClass("secondary", "md")}`}
                >
                  <Clock3 className="mr-2" />
                  {t("profile.openHistory")}
                </Link>
              </div>
              <p className="text-sm text-muted lg:text-right mb-0 mt-2">
                {t("profile.goalLabelPrefix")} <strong>{goalLabel}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div
          className="rounded-panel px-4 py-3 text-sm bg-success-soft text-ink flex items-start gap-2"
          role="status"
        >
          <CheckCircleFill className="mt-1" />
          <span>{message}</span>
        </div>
      ) : null}
      {error ? (
        <div
          className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink flex items-start gap-2"
          role="alert"
        >
          <AlertTriangle className="mt-1" />
          <span>{error}</span>
        </div>
      ) : null}

      <section
        className="grid grid-cols-12 gap-4 mb-6"
        aria-label={t("profile.statsLabel")}
      >
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statSolves")}
            value={String(timerEntries.length)}
            detail={t("profile.statSolvesDetail")}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statBest")}
            value={best === null ? "—" : formatSolveTime(best)}
            detail={t("profile.statBestDetail")}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statAo5")}
            value={ao5 === null ? "—" : formatSolveTime(ao5)}
            detail={t("profile.statAo5Detail")}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statReview")}
            value={String(reviewedLastLayer)}
            detail={t("profile.statReviewDetail")}
          />
        </div>
      </section>

      {meetsAo5Goal(ao5, account.goalMs) ? (
        <section
          className="rounded-panel px-4 py-3 text-sm bg-success-soft text-ink flex flex-wrap items-center justify-between gap-4 mb-6"
          role="status"
        >
          <div>
            <h2 className="text-base font-semibold tracking-tight mb-1">
              <Trophy className="mr-2" />
              {t("profile.goalReachedTitle", { goal: goalLabel })}
            </h2>
            <p className="mb-0">
              {t("profile.goalReachedPrefix")}{" "}
              <strong>{formatSolveTime(ao5 ?? 0)}</strong>
              {t("profile.goalReachedSuffix")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-white text-base">
            {t("profile.goalReachedBadge")}
          </span>
        </section>
      ) : null}

      <div className="grid grid-cols-12 gap-6 mb-6">
        <section className="col-span-12 xl:col-span-8">
          <div className="rounded-card bg-surface h-full">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap justify-between items-end gap-2 mb-6">
                <div>
                  <Eyebrow>{t("profile.progressEyebrow")}</Eyebrow>
                  <h2 className="text-lg font-semibold tracking-tight mb-1">
                    {t("profile.progressTitle")}
                  </h2>
                  <p className="text-muted text-sm mb-0">
                    {t("profile.progressHint")}
                  </p>
                </div>
                <div
                  className="inline-flex flex-wrap items-center gap-1"
                  role="group"
                  aria-label={t("profile.progressRangeLabel")}
                >
                  {(["7d", "30d", "all"] as ProfileProgressRange[]).map(
                    range => (
                      <Button
                        variant={
                          progressRange === range ? "primary" : "secondary"
                        }
                        size="sm"
                        key={range}
                        type="button"

                        onClick={() => setProgressRange(range)}
                      >
                        {range === "7d"
                          ? t("profile.range7d")
                          : range === "30d"
                            ? t("profile.range30d")
                            : t("profile.rangeAll")}
                      </Button>
                    )
                  )}
                </div>
              </div>
              <ProfileProgressChart data={filteredChart} />
            </div>
          </div>
        </section>
        <aside className="col-span-12 xl:col-span-4">
          <div className="rounded-card bg-surface mb-6">
            <div className="p-5 sm:p-6">
              <Eyebrow>Study</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mb-1">
                {t("profile.studyTitle")}
              </h2>
              <p className="text-sm text-muted mb-4">
                {t("profile.studyHint")}
              </p>
              <div className="bg-transparent">
                <div className="block px-4 py-3 text-sm px-0 flex justify-between">
                  <span>{t("profile.studyBldDue")}</span>
                  <strong>{due}</strong>
                </div>
                <div className="block px-4 py-3 text-sm px-0 flex justify-between">
                  <span>{t("profile.studyBldStreak")}</span>
                  <strong>
                    {t("profile.studyBldStreakValue", {
                      count: streak.current,
                    })}
                  </strong>
                </div>
                <div className="block px-4 py-3 text-sm px-0 flex justify-between">
                  <span>{t("profile.studyBldReviewed")}</span>
                  <strong>{Object.keys(bld.memoRecords).length}</strong>
                </div>
                <div className="block px-4 py-3 text-sm px-0 flex justify-between">
                  <span>{t("profile.studyLastLayer")}</span>
                  <strong>{Object.keys(lastLayer.records).length}</strong>
                </div>
              </div>
              <Link
                href="/study"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 w-full mt-4"
              >
                <BookOpenCheck className="mr-2" />
                {t("profile.openStudy")}
              </Link>
            </div>
          </div>
          <div className="rounded-card bg-surface">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="bg-success-soft text-success rounded-xl p-2">
                  <CheckCircleFill className="text-lg" />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight mb-1">
                    {t("profile.syncTitle")}
                  </h2>
                  <p className="text-sm text-muted mb-2">
                    {t("profile.syncHint")}
                  </p>
                </div>
              </div>
              <p className="text-sm mb-4 mt-4">
                <span
                  className={
                    syncQuery.isSuccess ? "text-success" : "text-muted"
                  }
                >
                  {syncQuery.isSuccess
                    ? t("profile.syncConnected")
                    : t("profile.syncChecking")}
                </span>
                {syncQuery.data?.updatedAt
                  ? ` · ${new Date(syncQuery.data.updatedAt).toLocaleString(locale)}`
                  : ` · ${t("profile.syncNeverSaved")}`}
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  manualSync.mutate({
                    ...createCfopCloudState(),
                    baseVersion: syncQuery.data?.revision ?? null,
                  });
                }}
                disabled={manualSync.isPending}
              >
                {manualSync.isPending
                  ? t("profile.syncPending")
                  : t("profile.syncNow")}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-card bg-surface mb-6">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-1">
                {t("profile.wcaEyebrow")}
              </p>
              <h2 className="text-lg font-semibold tracking-tight mb-1">
                {t("profile.wcaTitle")}
              </h2>
              <p className="text-sm text-muted mb-0">{t("profile.wcaHint")}</p>
            </div>
            {account.wcaId ? (
              <a
                className={`${buttonClass("secondary", "sm")}`}
                href={
                  wcaProfile?.profileUrl ??
                  `https://www.worldcubeassociation.org/persons/${account.wcaId}`
                }
                target="_blank"
                rel="noreferrer"
              >
                {t("profile.wcaOpen")} <BoxArrowRight className="ml-1" />
              </a>
            ) : null}
          </div>
          {wcaProfileQuery.isFetching && wcaProfileQuery.data ? (
            <div className="mt-4">
              <RefreshIndicator label={t("profile.wcaRefreshing")} />
            </div>
          ) : null}
          {wcaProfileQuery.isLoading ? (
            <SkeletonCard
              lines={4}
              className="mt-4"
              label={t("profile.wcaLoading")}
            />
          ) : null}
          {wcaProfile ? (
            <WcaProfileDetails profile={wcaProfile} entries={entries} />
          ) : null}
          <div className="mt-6">
            <p className="text-sm mb-2">
              {wcaOauthStatusQuery.data?.configured
                ? t("profile.wcaOauthReady")
                : t("profile.wcaOauthPending")}
            </p>
            <Button
              variant="secondary"
              size="sm"
              type="button"

              disabled={
                !wcaOauthStatusQuery.data?.configured || startWcaOAuth.isPending
              }
              onClick={() => {
                setError("");
                setMessage("");
                startWcaOAuth.mutate();
              }}
            >
              {startWcaOAuth.isPending
                ? t("profile.wcaOauthLinkPending")
                : t("profile.wcaOauthLink")}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-7">
          <div className="rounded-card bg-surface h-full">
            <div className="p-5 sm:p-6">
              <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-1">
                {t("profile.sectionAccount")}
              </p>
              <h2 className="text-lg font-semibold tracking-tight mb-4">
                {t("profile.sectionPersonal")}
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="rounded-full bg-surface-2 flex items-center justify-center overflow-hidden shrink-0"
                  style={{ width: 54, height: 54 }}
                >
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={t("profile.avatarAlt")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold">
                      {initials(account.displayName)}
                    </span>
                  )}
                </div>
                {(storageStatusQuery.data?.enabled ?? true) && (
                  <label className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs mb-0">
                    {uploadAvatar.isPending
                      ? t("profile.avatarUploadPending")
                      : t("profile.avatarUpload")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={chooseAvatar}
                      disabled={uploadAvatar.isPending}
                    />
                  </label>
                )}
              </div>
              <form onSubmit={submitProfile}>
                <label className="mb-1.5 block text-sm font-medium text-ink w-full">
                  {t("profile.displayName")}
                  <Input
                    className="mt-1"
                    required
                    minLength={2}
                    maxLength={80}
                    value={displayName}
                    onChange={event => setDisplayName(event.target.value)}
                  />
                </label>
                <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-4">
                  {t("profile.bio")}
                  <Textarea
                    className="mt-1"
                    maxLength={280}
                    value={bio}
                    onChange={event => setBio(event.target.value)}

                    rows={3}
                    placeholder={t("profile.bioPlaceholder")}
                  />
                </label>
                <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-4">
                  {t("profile.goal")}
                  <Input
                    className="mt-1"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={3600}
                    value={goalSeconds}
                    onChange={event => setGoalSeconds(event.target.value)}

                    placeholder={t("profile.goalPlaceholder")}
                  />
                  <span className="mt-1.5 text-xs text-muted">
                    {t("profile.goalHelp")}
                  </span>
                </label>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-4"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending
                    ? t("profile.saveProfilePending")
                    : t("profile.saveProfile")}
                </Button>
              </form>
            </div>
          </div>
        </section>
        <section className="col-span-12 lg:col-span-5">
          <div className="rounded-card bg-surface h-full">
            <div className="p-5 sm:p-6">
              <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-1">
                {t("profile.sectionSecurity")}
              </p>
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                {t("profile.passwordTitle")}
              </h2>
              <p className="text-sm text-muted mb-6">
                {t("profile.passwordHint")}
              </p>
              <form onSubmit={submitPassword}>
                <label className="mb-1.5 block text-sm font-medium text-ink w-full">
                  {t("profile.currentPassword")}
                  <Input
                    className="mt-1"
                    required
                    type="password"
                    autoComplete="current-password"
                    minLength={10}
                    maxLength={128}
                    value={currentPassword}
                    onChange={event => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-4">
                  {t("profile.newPassword")}
                  <Input
                    className="mt-1"
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={128}
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                  />
                </label>
                <Button
                  variant="secondary"
                  size="md"
                  className="mt-4"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending
                    ? t("profile.changePasswordPending")
                    : t("profile.changePassword")}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
      <AvatarCropDialog
        file={avatarFile}
        onClose={() => setAvatarFile(null)}
        onConfirm={uploadCroppedAvatar}
      />
    </div>
  );
}
