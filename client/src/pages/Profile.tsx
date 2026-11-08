import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { ProfileProgressChart } from "@/features/profile/components/ProfileProgressChart";
import { createCfopCloudState } from "@/lib/cloudSync";
import { filterProfileProgress, meetsAo5Goal, profileProgressByDay, type ProfileProgressRange } from "@/features/profile/lib/profileProgress";
import { Eyebrow, LoadingTransition, RefreshIndicator, SkeletonCard, StatTile } from "@/components/ui/BootstrapUI";
import { trpc } from "@/lib/trpc";
import { readSolveHistory, effectiveTime, formatSolveTime } from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";
import { DEFAULT_TIMER_EVENT, normalizeTimerEventId } from "@/lib/timerEvents";
import { wcaTimerComparison } from "@/lib/wcaTimerComparison";
import { dueMemoRecords, readBldProfile, reviewStreak } from "@/features/bld/lib";
import { readLastLayerStudy, todayReviewCount } from "@/features/last-layer/lib";
import { comparisonMessage, formatWcaTime, initials, rankSummary, wcaEventName, type WcaProfileData, type WcaRecordRow } from "@/features/profile/lib/profilePresentation";
import { errorMessage } from "@/lib/apiError";
import { useLanguage } from "@/contexts/LanguageContext";

function WcaTimerComparison({ entries, record }: { entries: ReturnType<typeof readSolveHistory>; record: Pick<WcaRecordRow, "singleCentiseconds" | "averageCentiseconds"> }) {
  const { t } = useLanguage();
  const rows = wcaTimerComparison(entries, record);
  return (
    <div className="border-top mt-3 pt-3">
      <h3 className="h6 mb-1">{t("profile.compare.title")}</h3>
      <p className="small text-body-secondary mb-2">{t("profile.compare.hint")}</p>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">{t("profile.compare.metric")}</th>
              <th scope="col">{t("profile.compare.timer")}</th>
              <th scope="col">{t("profile.compare.wca")}</th>
              <th scope="col">{t("profile.compare.delta")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td>{row.timerMs === null ? "—" : formatSolveTime(row.timerMs)}</td>
                <td>{row.wcaMs === null ? "—" : formatSolveTime(row.wcaMs)}</td>
                <td className={row.deltaMs === null ? "text-body-secondary" : row.deltaMs < 0 ? "text-success" : row.deltaMs > 0 ? "text-primary" : "text-body-secondary"}>
                  {comparisonMessage(row.deltaMs, t)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small text-body-secondary mb-0 mt-2">{t("profile.compare.footer")}</p>
    </div>
  );
}

function WcaProfileDetails({ profile, entries }: { profile: WcaProfileData; entries: ReturnType<typeof readSolveHistory> }) {
  const { language, t } = useLanguage();
  const [showAllRecords, setShowAllRecords] = useState(false);
  const threeByThree = profile.personalRecords.find((record) => record.eventId === "333");
  const locale = language === "vi" ? "vi-VN" : "en-US";
  return (
    <LoadingTransition className="mt-3">
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="rounded-circle bg-body-secondary overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 58, height: 58 }}>
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt={t("profile.wcaAvatarAlt", { name: profile.name })} className="w-100 h-100 object-fit-cover" referrerPolicy="no-referrer" /> : <i className="bi bi-person fs-3" aria-hidden="true" />}
        </div>
        <div>
          <p className="fw-semibold mb-0">{profile.name}</p>
          <p className="small text-body-secondary mb-0">{profile.wcaId} · {profile.countryName || profile.countryIso2 || t("profile.wcaCountryUnknown")}</p>
        </div>
      </div>
      <div className="row g-2 small mt-2">
        <div className="col-6"><p className="text-body-secondary mb-0">{t("profile.compare.single")}</p><p className="mb-0 fw-semibold">{formatWcaTime(threeByThree?.singleCentiseconds)}</p></div>
        <div className="col-6"><p className="text-body-secondary mb-0">{t("profile.compare.average")}</p><p className="mb-0 fw-semibold">{formatWcaTime(threeByThree?.averageCentiseconds)}</p></div>
        <div className="col-6"><p className="text-body-secondary mb-0">{t("profile.wcaSolves")}</p><p className="mb-0 fw-semibold">{profile.competitionCount.toLocaleString(locale)} / {profile.totalSolves.toLocaleString(locale)}</p></div>
        <div className="col-6">
          <p className="text-body-secondary mb-0">{t("profile.wcaMedals")}</p>
          <p className="mb-0 fw-semibold">
            {profile.medals.total.toLocaleString(locale)}{" "}
            <span className="text-body-secondary fw-normal">
              {t("profile.wcaMedalsBreakdown", { gold: profile.medals.gold, silver: profile.medals.silver, bronze: profile.medals.bronze })}
            </span>
          </p>
        </div>
        <div className="col-6">
          <p className="text-body-secondary mb-0">{t("profile.wcaRecords")}</p>
          <p className="mb-0 fw-semibold">
            {profile.records.total.toLocaleString(locale)}{" "}
            <span className="text-body-secondary fw-normal">
              {t("profile.wcaRecordsBreakdown", { world: profile.records.world, continental: profile.records.continental, national: profile.records.national })}
            </span>
          </p>
        </div>
        <div className="col-6"><p className="text-body-secondary mb-0">{t("profile.wcaRank")}</p><p className="mb-0 fw-semibold">{rankSummary(threeByThree?.averageRanks ?? { world: null, continental: null, country: null }, language)}</p></div>
      </div>
      <WcaTimerComparison entries={entries} record={threeByThree ?? { singleCentiseconds: null, averageCentiseconds: null }} />
      <button type="button" className="btn btn-outline-secondary btn-sm mt-3" aria-expanded={showAllRecords} onClick={() => setShowAllRecords((value) => !value)}>
        {showAllRecords ? t("profile.wcaRecordsHide") : t("profile.wcaRecordsToggle", { count: profile.personalRecords.length })}
      </button>
      {showAllRecords ? (
        <div className="table-responsive mt-3">
          <table className="table table-sm align-middle mb-0">
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
              {profile.personalRecords.map((record) => (
                <tr key={record.eventId}>
                  <th scope="row">{wcaEventName(record.eventId, language)}</th>
                  <td>{formatWcaTime(record.singleCentiseconds)}</td>
                  <td>{formatWcaTime(record.averageCentiseconds)}</td>
                  <td className="small">{rankSummary(record.singleRanks, language)}</td>
                  <td className="small">{rankSummary(record.averageRanks, language)}</td>
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
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
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
  const [progressRange, setProgressRange] = useState<ProfileProgressRange>("30d");
  const [wcaIdInput, setWcaIdInput] = useState("");
  const [location] = useLocation();
  const syncQuery = trpc.cfopAccount.cloudState.get.useQuery(undefined, { enabled: Boolean(account), retry: false });
  const wcaProfileQuery = trpc.cfopAccount.wca.profile.useQuery(undefined, { enabled: Boolean(account?.wcaId), staleTime: 10 * 60 * 1000, retry: false });
  const wcaOauthStatusQuery = trpc.cfopAccount.wca.oauthStatus.useQuery(undefined, { enabled: Boolean(account), staleTime: 60_000, retry: false });
  const updateProfile = trpc.cfopAccount.updateProfile.useMutation({ onSuccess: async () => { await utils.cfopAccount.me.invalidate(); setMessage(t("profile.profileSaved")); }, onError: (next) => setError(errorMessage(next, t)) });
  const uploadAvatar = trpc.cfopAccount.uploadAvatar.useMutation({ onSuccess: async () => { await utils.cfopAccount.me.invalidate(); setMessage(t("profile.avatarSaved")); }, onError: (next) => setError(errorMessage(next, t)) });
  const changePassword = trpc.cfopAccount.changePassword.useMutation({ onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setMessage(t("profile.passwordChanged")); }, onError: (next) => setError(errorMessage(next, t)) });
  const manualSync = trpc.cfopAccount.cloudState.save.useMutation({ onSuccess: async (result) => { await utils.cfopAccount.cloudState.get.invalidate(); setMessage(t("profile.syncDone", { time: new Date(result.updatedAt).toLocaleTimeString(locale) })); }, onError: (next) => setError(errorMessage(next, t)) });
  const saveWcaId = trpc.cfopAccount.wca.setId.useMutation({ onSuccess: async () => { await Promise.all([utils.cfopAccount.me.invalidate(), utils.cfopAccount.wca.profile.invalidate()]); setMessage(t("profile.wcaLinked")); }, onError: (next) => setError(errorMessage(next, t)) });
  const startWcaOAuth = trpc.cfopAccount.wca.startOAuth.useMutation({ onSuccess: (result) => window.location.assign(result.url), onError: (next) => setError(errorMessage(next, t)) });
  const unlinkWca = trpc.cfopAccount.wca.unlink.useMutation({ onSuccess: async () => { await Promise.all([utils.cfopAccount.me.invalidate(), utils.cfopAccount.wca.profile.invalidate()]); setWcaIdInput(""); setMessage(t("profile.wcaUnlinked")); }, onError: (next) => setError(errorMessage(next, t)) });

  useEffect(() => { if (account) { setDisplayName(account.displayName); setBio(account.bio ?? ""); setGoalSeconds(account.goalMs ? String(Math.round(account.goalMs / 1000)) : ""); setWcaIdInput(account.wcaId ?? ""); } }, [account]);
  useEffect(() => {
    const state = new URLSearchParams(location.split("?")[1] ?? "").get("wca");
    if (state === "linked") { void Promise.all([utils.cfopAccount.me.invalidate(), utils.cfopAccount.wca.profile.invalidate()]); setMessage(t("profile.wcaOauthLinked")); }
    if (state === "error") setError(t("profile.wcaOauthFailed"));
  }, [location, utils]);

  const timerEntries = entries.filter((entry) => normalizeTimerEventId(entry.eventId) === DEFAULT_TIMER_EVENT);
  const valid = timerEntries.map(effectiveTime).filter((value): value is number => value !== null);
  const best = valid.length ? Math.min(...valid) : null;
  const ao5 = timerEntries.length >= 5 ? rollingAverage(timerEntries.slice(0, 5)) : null;
  const due = dueMemoRecords(bld).length;
  const streak = reviewStreak(bld);
  const reviewedLastLayer = todayReviewCount(lastLayer.records);
  const chart = useMemo(() => profileProgressByDay(timerEntries), [timerEntries]);
  const filteredChart = useMemo(() => filterProfileProgress(chart, progressRange), [chart, progressRange]);
  const submitProfile = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); const parsed = goalSeconds.trim() ? Number(goalSeconds) : null; if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1 || parsed > 3600)) { setError(t("profile.goalInvalid")); return; } updateProfile.mutate({ displayName, bio, goalMs: parsed === null ? null : parsed * 1000 }); };
  const submitPassword = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); changePassword.mutate({ currentPassword, newPassword }); };
  const submitWcaId = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); saveWcaId.mutate({ wcaId: wcaIdInput.trim() || null }); };
  const chooseAvatar = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; if (!( ["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type) || file.size > 2 * 1024 * 1024) { setError(t("profile.avatarTypeError")); return; } setError(""); setAvatarFile(file); };
  const uploadCroppedAvatar = (blob: Blob, contentType: "image/jpeg" | "image/png" | "image/webp") => { const reader = new FileReader(); reader.onerror = () => setError(t("profile.avatarReadError")); reader.onload = () => { const base64 = typeof reader.result === "string" ? reader.result.split(",")[1] : ""; if (base64) { setAvatarFile(null); uploadAvatar.mutate({ data: base64, contentType }); } }; reader.readAsDataURL(blob); };

  if (accountQuery.isLoading) return <div className="container"><SkeletonCard lines={6} label={t("profile.loading")} /></div>;
  if (!account) return <div className="container"><div className="alert alert-secondary mb-0"><h1 className="h4">{t("profile.guestTitle")}</h1><p className="mb-3">{t("profile.guestDetail")}</p><Link href="/" className="btn btn-primary">{t("profile.guestCta")}</Link></div></div>;
  const goalLabel = account.goalMs ? t("profile.goalFormat", { seconds: Math.round(account.goalMs / 1000) }) : t("profile.goalUnset");
  const wcaProfile = wcaProfileQuery.data as WcaProfileData | undefined;

  return (
    <div className="container py-4">
      <section className="card cfop-card-surface mb-4 overflow-hidden">
        <div className="card-body p-4">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 88, height: 88 }} aria-label={t("profile.avatarAlt")}>
                  {account.avatarUrl ? <img src={account.avatarUrl} alt={t("profile.avatarAlt")} className="w-100 h-100 object-fit-cover" /> : <span className="fs-2 fw-semibold">{initials(account.displayName)}</span>}
                </div>
                <div>
                  <Eyebrow>{t("profile.eyebrow")}</Eyebrow>
                  <h1 className="display-6 fw-semibold mb-2">{account.displayName}</h1>
                  <p className="text-body-secondary mb-0">{account.bio || t("profile.bioFallback")}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-auto">
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                <Link href="/timer" className="btn btn-primary"><i className="bi bi-stopwatch me-2" aria-hidden="true" />{t("profile.openTimer")}</Link>
                <Link href="/history" className="btn btn-outline-secondary"><i className="bi bi-clock-history me-2" aria-hidden="true" />{t("profile.openHistory")}</Link>
              </div>
              <p className="small text-body-secondary text-lg-end mb-0 mt-2">{t("profile.goalLabelPrefix")} <strong>{goalLabel}</strong></p>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="alert alert-success d-flex align-items-start gap-2" role="status"><i className="bi bi-check-circle-fill mt-1" aria-hidden="true" /><span>{message}</span></div> : null}
      {error ? <div className="alert alert-danger d-flex align-items-start gap-2" role="alert"><i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true" /><span>{error}</span></div> : null}

      <section className="row g-3 mb-4" aria-label={t("profile.statsLabel")}>
        <div className="col-6 col-lg-3"><StatTile label={t("profile.statSolves")} value={String(timerEntries.length)} detail={t("profile.statSolvesDetail")} /></div>
        <div className="col-6 col-lg-3"><StatTile label={t("profile.statBest")} value={best === null ? "—" : formatSolveTime(best)} detail={t("profile.statBestDetail")} /></div>
        <div className="col-6 col-lg-3"><StatTile label={t("profile.statAo5")} value={ao5 === null ? "—" : formatSolveTime(ao5)} detail={t("profile.statAo5Detail")} /></div>
        <div className="col-6 col-lg-3"><StatTile label={t("profile.statReview")} value={String(reviewedLastLayer)} detail={t("profile.statReviewDetail")} /></div>
      </section>

      {meetsAo5Goal(ao5, account.goalMs) ? (
        <section className="alert alert-success d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4" role="status">
          <div>
            <h2 className="h5 mb-1"><i className="bi bi-trophy-fill me-2" aria-hidden="true" />{t("profile.goalReachedTitle", { goal: goalLabel })}</h2>
            <p className="mb-0">{t("profile.goalReachedPrefix")} <strong>{formatSolveTime(ao5 ?? 0)}</strong>{t("profile.goalReachedSuffix")}</p>
          </div>
          <span className="badge text-bg-success fs-6">{t("profile.goalReachedBadge")}</span>
        </section>
      ) : null}

      <div className="row g-4 mb-4">
        <section className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
                <div>
                  <Eyebrow>{t("profile.progressEyebrow")}</Eyebrow>
                  <h2 className="h4 mb-1">{t("profile.progressTitle")}</h2>
                  <p className="text-body-secondary small mb-0">{t("profile.progressHint")}</p>
                </div>
                <div className="btn-group" role="group" aria-label={t("profile.progressRangeLabel")}>
                  {(["7d", "30d", "all"] as ProfileProgressRange[]).map((range) => (
                    <button key={range} type="button" className={progressRange === range ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"} onClick={() => setProgressRange(range)}>
                      {range === "7d" ? t("profile.range7d") : range === "30d" ? t("profile.range30d") : t("profile.rangeAll")}
                    </button>
                  ))}
                </div>
              </div>
              <ProfileProgressChart data={filteredChart} />
            </div>
          </div>
        </section>
        <aside className="col-12 col-xl-4">
          <div className="card mb-4">
            <div className="card-body p-4">
              <Eyebrow>Study</Eyebrow>
              <h2 className="h4 mb-1">{t("profile.studyTitle")}</h2>
              <p className="small text-body-secondary mb-3">{t("profile.studyHint")}</p>
              <div className="list-group list-group-flush">
                <div className="list-group-item px-0 d-flex justify-content-between"><span>{t("profile.studyBldDue")}</span><strong>{due}</strong></div>
                <div className="list-group-item px-0 d-flex justify-content-between"><span>{t("profile.studyBldStreak")}</span><strong>{t("profile.studyBldStreakValue", { count: streak.current })}</strong></div>
                <div className="list-group-item px-0 d-flex justify-content-between"><span>{t("profile.studyBldReviewed")}</span><strong>{Object.keys(bld.memoRecords).length}</strong></div>
                <div className="list-group-item px-0 d-flex justify-content-between"><span>{t("profile.studyLastLayer")}</span><strong>{Object.keys(lastLayer.records).length}</strong></div>
              </div>
              <Link href="/study" className="btn btn-outline-secondary w-100 mt-3"><i className="bi bi-journal-richtext me-2" aria-hidden="true" />{t("profile.openStudy")}</Link>
            </div>
          </div>
          <div className="card">
            <div className="card-body p-4">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-success-subtle text-success rounded p-2"><i className="bi bi-cloud-check fs-5" aria-hidden="true" /></div>
                <div><h2 className="h5 mb-1">{t("profile.syncTitle")}</h2><p className="small text-body-secondary mb-2">{t("profile.syncHint")}</p></div>
              </div>
              <p className="small mb-3 mt-3">
                <span className={syncQuery.isSuccess ? "text-success" : "text-body-secondary"}>{syncQuery.isSuccess ? t("profile.syncConnected") : t("profile.syncChecking")}</span>
                {syncQuery.data?.updatedAt ? ` · ${new Date(syncQuery.data.updatedAt).toLocaleString(locale)}` : ` · ${t("profile.syncNeverSaved")}`}
              </p>
              <button type="button" onClick={() => { setError(""); setMessage(""); manualSync.mutate(createCfopCloudState()); }} disabled={manualSync.isPending} className="btn btn-primary w-100">
                {manualSync.isPending ? t("profile.syncPending") : t("profile.syncNow")}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <section className="card mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
            <div>
              <p className="small text-uppercase fw-semibold text-primary mb-1">{t("profile.wcaEyebrow")}</p>
              <h2 className="h4 mb-1">{t("profile.wcaTitle")}</h2>
              <p className="small text-body-secondary mb-0">{t("profile.wcaHint")}</p>
            </div>
            {account.wcaId ? <a className="btn btn-outline-secondary btn-sm" href={wcaProfile?.profileUrl ?? `https://www.worldcubeassociation.org/persons/${account.wcaId}`} target="_blank" rel="noreferrer">{t("profile.wcaOpen")} <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a> : null}
          </div>
          <form className="row g-2 align-items-end" onSubmit={submitWcaId}>
            <div className="col-12 col-md">
              <label className="form-label">{t("profile.wcaIdLabel")}<input className="form-control text-uppercase" value={wcaIdInput} onChange={(event) => setWcaIdInput(event.target.value.toUpperCase())} placeholder={t("profile.wcaIdPlaceholder")} maxLength={10} /></label>
            </div>
            <div className="col-12 col-md-auto d-flex flex-wrap gap-2">
              <button className="btn btn-primary" disabled={saveWcaId.isPending}>{saveWcaId.isPending ? t("profile.wcaLookupPending") : account.wcaId ? t("profile.wcaUpdate") : t("profile.wcaLookup")}</button>
              {account.wcaId ? <button type="button" className="btn btn-outline-secondary" disabled={unlinkWca.isPending} onClick={() => { setError(""); setMessage(""); unlinkWca.mutate(); }}>{unlinkWca.isPending ? t("profile.wcaUnlinkPending") : t("profile.wcaUnlink")}</button> : null}
            </div>
          </form>
          {wcaProfileQuery.isFetching && wcaProfileQuery.data ? <div className="mt-3"><RefreshIndicator label={t("profile.wcaRefreshing")} /></div> : null}
          {wcaProfileQuery.isLoading ? <SkeletonCard lines={4} className="mt-3" label={t("profile.wcaLoading")} /> : null}
          {wcaProfile ? <WcaProfileDetails profile={wcaProfile} entries={entries} /> : null}
          <div className="border-top mt-4 pt-3">
            <p className="small mb-2">{wcaOauthStatusQuery.data?.configured ? t("profile.wcaOauthReady") : t("profile.wcaOauthPending")}</p>
            <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!wcaOauthStatusQuery.data?.configured || startWcaOAuth.isPending} onClick={() => { setError(""); setMessage(""); startWcaOAuth.mutate(); }}>
              {startWcaOAuth.isPending ? t("profile.wcaOauthLinkPending") : t("profile.wcaOauthLink")}
            </button>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <section className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-body p-4">
              <p className="small text-uppercase fw-semibold text-primary mb-1">{t("profile.sectionAccount")}</p>
              <h2 className="h4 mb-3">{t("profile.sectionPersonal")}</h2>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 54, height: 54 }}>
                  {account.avatarUrl ? <img src={account.avatarUrl} alt={t("profile.avatarAlt")} className="w-100 h-100 object-fit-cover" /> : <span className="small fw-semibold">{initials(account.displayName)}</span>}
                </div>
                <label className="btn btn-outline-secondary btn-sm mb-0">
                  {uploadAvatar.isPending ? t("profile.avatarUploadPending") : t("profile.avatarUpload")}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={chooseAvatar} disabled={uploadAvatar.isPending} />
                </label>
              </div>
              <form onSubmit={submitProfile}>
                <label className="form-label w-100">{t("profile.displayName")}<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="form-control mt-1" /></label>
                <label className="form-label w-100 mt-3">{t("profile.bio")}<textarea maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)} className="form-control mt-1" rows={3} placeholder={t("profile.bioPlaceholder")} /></label>
                <label className="form-label w-100 mt-3">{t("profile.goal")}<input type="number" inputMode="numeric" min={1} max={3600} value={goalSeconds} onChange={(event) => setGoalSeconds(event.target.value)} className="form-control mt-1" placeholder={t("profile.goalPlaceholder")} /><span className="form-text">{t("profile.goalHelp")}</span></label>
                <button disabled={updateProfile.isPending} className="btn btn-primary mt-3">{updateProfile.isPending ? t("profile.saveProfilePending") : t("profile.saveProfile")}</button>
              </form>
            </div>
          </div>
        </section>
        <section className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-body p-4">
              <p className="small text-uppercase fw-semibold text-primary mb-1">{t("profile.sectionSecurity")}</p>
              <h2 className="h4 mb-2">{t("profile.passwordTitle")}</h2>
              <p className="small text-body-secondary mb-4">{t("profile.passwordHint")}</p>
              <form onSubmit={submitPassword}>
                <label className="form-label w-100">{t("profile.currentPassword")}<input required type="password" autoComplete="current-password" minLength={10} maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-control mt-1" /></label>
                <label className="form-label w-100 mt-3">{t("profile.newPassword")}<input required type="password" autoComplete="new-password" minLength={10} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="form-control mt-1" /></label>
                <button disabled={changePassword.isPending} className="btn btn-outline-secondary mt-3">{changePassword.isPending ? t("profile.changePasswordPending") : t("profile.changePassword")}</button>
              </form>
            </div>
          </div>
        </section>
      </div>
      <AvatarCropDialog file={avatarFile} onClose={() => setAvatarFile(null)} onConfirm={uploadCroppedAvatar} />
    </div>
  );
}
