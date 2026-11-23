import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AvatarCropDialog } from "@/features/profile/components/AvatarCropDialog";
import { ProfileDetailsForm, type ProfileDetailsValues } from "@/features/profile/components/ProfileDetailsForm";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfilePasswordForm } from "@/features/profile/components/ProfilePasswordForm";
import { ProfileProgressCard } from "@/features/profile/components/ProfileProgressCard";
import { ProfileStudySummary } from "@/features/profile/components/ProfileStudySummary";
import { ProfileSyncCard } from "@/features/profile/components/ProfileSyncCard";
import { ProfileTimerStats } from "@/features/profile/components/ProfileTimerStats";
import { ProfileWcaSection } from "@/features/profile/components/ProfileWcaSection";
import {
  applyCfopCloudState,
  createCfopCloudState,
  mergeCfopCloudStates,
  parseCfopCloudState,
} from "@/lib/cloudSync";
import {
  filterProfileProgress,
  profileProgressByDay,
  type ProfileProgressRange,
} from "@/features/profile/lib/profileProgress";
import { SkeletonCard } from "@/components/ui/StudioUI";
import { trpc } from "@/lib/trpc";
import { readSolveHistory, effectiveTime } from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";
import { DEFAULT_TIMER_EVENT, normalizeTimerEventId } from "@/lib/timerEvents";
import {
  dueMemoRecords,
  readBldProfile,
  reviewStreak,
} from "@/features/bld/lib";
import {
  readLastLayerStudy,
  todayReviewCount,
} from "@/features/last-layer/lib";
import type { WcaProfileData } from "@/features/profile/lib/profilePresentation";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";
import { buttonClass } from "@/components/ui/Button";
import { AlertTriangle, CheckCircleFill } from "@/components/ui/Icon";

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
  const submitProfile = ({ displayName, bio, goalSeconds }: ProfileDetailsValues) => {
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
  const submitPassword = (
    values: { currentPassword: string; newPassword: string },
    clear: () => void
  ) => {
    setError("");
    setMessage("");
    changePassword.mutate(values, { onSuccess: clear });
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
      <ProfileHero account={account} goalLabel={goalLabel} />

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

      <ProfileTimerStats
        solveCount={timerEntries.length}
        best={best}
        ao5={ao5}
        reviewedLastLayer={reviewedLastLayer}
        goalMs={account.goalMs}
        goalLabel={goalLabel}
      />

      <div className="grid grid-cols-12 gap-6 mb-6">
        <ProfileProgressCard
          progressRange={progressRange}
          onProgressRangeChange={setProgressRange}
          data={filteredChart}
        />
        <aside className="col-span-12 xl:col-span-4">
          <ProfileStudySummary
            dueMemoCount={due}
            streakDays={streak.current}
            bldReviewedCount={Object.keys(bld.memoRecords).length}
            lastLayerCount={Object.keys(lastLayer.records).length}
          />
          <ProfileSyncCard
            connected={syncQuery.isSuccess}
            updatedAt={syncQuery.data?.updatedAt}
            pending={manualSync.isPending}
            onSync={() => {
              setError("");
              setMessage("");
              manualSync.mutate({
                ...createCfopCloudState(),
                baseVersion: syncQuery.data?.revision ?? null,
              });
            }}
          />
        </aside>
      </div>

      <ProfileWcaSection
        wcaId={account.wcaId}
        wcaProfile={wcaProfile}
        refreshing={wcaProfileQuery.isFetching && Boolean(wcaProfileQuery.data)}
        loading={wcaProfileQuery.isLoading}
        entries={entries}
        oauthConfigured={wcaOauthStatusQuery.data?.configured}
        oauthPending={startWcaOAuth.isPending}
        onStartOAuth={() => {
          setError("");
          setMessage("");
          startWcaOAuth.mutate();
        }}
        unlinkPending={unlinkWca.isPending}
        onUnlink={() => {
          setError("");
          setMessage("");
          unlinkWca.mutate();
        }}
      />

      <div className="grid grid-cols-12 gap-6">
        <ProfileDetailsForm
          account={account}
          avatarUploadEnabled={storageStatusQuery.data?.enabled ?? true}
          avatarPending={uploadAvatar.isPending}
          onChooseAvatar={chooseAvatar}
          savePending={updateProfile.isPending}
          onSubmit={submitProfile}
        />
        <ProfilePasswordForm
          pending={changePassword.isPending}
          onSubmit={submitPassword}
        />
      </div>
      <AvatarCropDialog
        file={avatarFile}
        onClose={() => setAvatarFile(null)}
        onConfirm={uploadCroppedAvatar}
      />
    </div>
  );
}
