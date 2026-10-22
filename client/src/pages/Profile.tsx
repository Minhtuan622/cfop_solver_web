import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { ProfileProgressChart } from "@/features/profile";
import { createCfopCloudState } from "@/lib/cloudSync";
import { filterProfileProgress, meetsAo5Goal, profileProgressByDay, type ProfileProgressRange } from "@/features/profile";
import { Eyebrow, LoadingTransition, RefreshIndicator, SkeletonCard, StatTile } from "@/components/ui/BootstrapUI";
import { trpc } from "@/lib/trpc";
import { readSolveHistory, effectiveTime, formatSolveTime } from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";
import { DEFAULT_TIMER_EVENT, normalizeTimerEventId } from "@/lib/timerEvents";
import { wcaTimerComparison } from "@/lib/wcaTimerComparison";
import { dueMemoRecords, readBldProfile, reviewStreak } from "@/features/bld";
import { readLastLayerStudy, todayReviewCount } from "@/features/last-layer";
import { comparisonMessage, errorMessage, formatWcaTime, initials, rankSummary, wcaEventName, type WcaProfileData, type WcaRecordRow } from "@/features/profile";

function WcaTimerComparison({ entries, record }: { entries: ReturnType<typeof readSolveHistory>; record: Pick<WcaRecordRow, "singleCentiseconds" | "averageCentiseconds"> }) {
  const rows = wcaTimerComparison(entries, record);
  return <div className="border-top mt-3 pt-3"><h3 className="h6 mb-1">So sánh WCA và Timer</h3><p className="small text-body-secondary mb-2">Đối chiếu personal best 3×3: dữ liệu WCA chính thức và lịch sử Timer lưu trên ứng dụng.</p><div className="table-responsive"><table className="table table-sm align-middle mb-0"><thead><tr><th scope="col">Chỉ số</th><th scope="col">Timer</th><th scope="col">WCA</th><th scope="col">Chênh lệch</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><th scope="row">{row.label}</th><td>{row.timerMs === null ? "—" : formatSolveTime(row.timerMs)}</td><td>{row.wcaMs === null ? "—" : formatSolveTime(row.wcaMs)}</td><td className={row.deltaMs === null ? "text-body-secondary" : row.deltaMs < 0 ? "text-success" : row.deltaMs > 0 ? "text-primary" : "text-body-secondary"}>{comparisonMessage(row.deltaMs)}</td></tr>)}</tbody></table></div><p className="small text-body-secondary mb-0 mt-2">Ao5 Timer dùng PB Ao5 trong lịch sử hiện có, loại lượt tốt nhất và chậm nhất. Đây là so sánh tham khảo; chỉ thành tích WCA là kết quả thi đấu chính thức.</p></div>;
}

function WcaProfileDetails({ profile, entries }: { profile: WcaProfileData; entries: ReturnType<typeof readSolveHistory> }) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const threeByThree = profile.personalRecords.find((record) => record.eventId === "333");
  return <LoadingTransition className="mt-3">
    <div className="d-flex flex-wrap align-items-center gap-3">
      <div className="rounded-circle bg-body-secondary overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 58, height: 58 }}>
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`Ảnh WCA của ${profile.name}`} className="w-100 h-100 object-fit-cover" referrerPolicy="no-referrer" /> : <i className="bi bi-person fs-3" aria-hidden="true" />}
      </div>
      <div><p className="fw-semibold mb-0">{profile.name}</p><p className="small text-body-secondary mb-0">{profile.wcaId} · {profile.countryName || profile.countryIso2 || "Quốc gia chưa rõ"}</p></div>
    </div>
    <div className="row g-2 small mt-2">
      <div className="col-6"><p className="text-body-secondary mb-0">3×3 single</p><p className="mb-0 fw-semibold">{formatWcaTime(threeByThree?.singleCentiseconds)}</p></div>
      <div className="col-6"><p className="text-body-secondary mb-0">3×3 average</p><p className="mb-0 fw-semibold">{formatWcaTime(threeByThree?.averageCentiseconds)}</p></div>
      <div className="col-6"><p className="text-body-secondary mb-0">Số giải / tổng solve</p><p className="mb-0 fw-semibold">{profile.competitionCount.toLocaleString("vi-VN")} / {profile.totalSolves.toLocaleString("vi-VN")}</p></div>
      <div className="col-6"><p className="text-body-secondary mb-0">Huy chương</p><p className="mb-0 fw-semibold">{profile.medals.total.toLocaleString("vi-VN")} <span className="text-body-secondary fw-normal">({profile.medals.gold} V · {profile.medals.silver} B · {profile.medals.bronze} Đ)</span></p></div>
      <div className="col-6"><p className="text-body-secondary mb-0">Kỷ lục WCA</p><p className="mb-0 fw-semibold">{profile.records.total.toLocaleString("vi-VN")} <span className="text-body-secondary fw-normal">({profile.records.world} TG · {profile.records.continental} CL · {profile.records.national} QG)</span></p></div>
      <div className="col-6"><p className="text-body-secondary mb-0">Rank 3×3 average</p><p className="mb-0 fw-semibold">{rankSummary(threeByThree?.averageRanks ?? { world: null, continental: null, country: null })}</p></div>
    </div>
    <WcaTimerComparison entries={entries} record={threeByThree ?? { singleCentiseconds: null, averageCentiseconds: null }} />
    <button type="button" className="btn btn-outline-secondary btn-sm mt-3" aria-expanded={showAllRecords} onClick={() => setShowAllRecords((value) => !value)}>{showAllRecords ? "Ẩn thành tích theo event" : `Xem ${profile.personalRecords.length} event`}</button>
    {showAllRecords ? <div className="table-responsive mt-3"><table className="table table-sm align-middle mb-0"><thead><tr><th scope="col">Event</th><th scope="col">Single</th><th scope="col">Average</th><th scope="col">Rank single</th><th scope="col">Rank average</th></tr></thead><tbody>{profile.personalRecords.map((record) => <tr key={record.eventId}><th scope="row">{wcaEventName(record.eventId)}</th><td>{formatWcaTime(record.singleCentiseconds)}</td><td>{formatWcaTime(record.averageCentiseconds)}</td><td className="small">{rankSummary(record.singleRanks)}</td><td className="small">{rankSummary(record.averageRanks)}</td></tr>)}</tbody></table></div> : null}
  </LoadingTransition>;
}

export default function Profile() {
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
  const updateProfile = trpc.cfopAccount.updateProfile.useMutation({ onSuccess: async () => { await utils.cfopAccount.me.invalidate(); setMessage("Đã cập nhật hồ sơ và mục tiêu."); }, onError: (next) => setError(errorMessage(next)) });
  const uploadAvatar = trpc.cfopAccount.uploadAvatar.useMutation({ onSuccess: async () => { await utils.cfopAccount.me.invalidate(); setMessage("Đã cập nhật ảnh đại diện."); }, onError: (next) => setError(errorMessage(next)) });
  const changePassword = trpc.cfopAccount.changePassword.useMutation({ onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setMessage("Đã đổi mật khẩu và làm mới phiên đăng nhập."); }, onError: (next) => setError(errorMessage(next)) });
  const manualSync = trpc.cfopAccount.cloudState.save.useMutation({ onSuccess: async (result) => { await utils.cfopAccount.cloudState.get.invalidate(); setMessage(`Đã đồng bộ thủ công lúc ${new Date(result.updatedAt).toLocaleTimeString()}.`); }, onError: (next) => setError(errorMessage(next)) });
  const saveWcaId = trpc.cfopAccount.wca.setId.useMutation({ onSuccess: async () => { await Promise.all([utils.cfopAccount.me.invalidate(), utils.cfopAccount.wca.profile.invalidate()]); setMessage("Đã liên kết WCA ID và tải thành tích mới nhất."); }, onError: (next) => setError(errorMessage(next)) });
  const startWcaOAuth = trpc.cfopAccount.wca.startOAuth.useMutation({ onSuccess: (result) => window.location.assign(result.url), onError: (next) => setError(errorMessage(next)) });
  const unlinkWca = trpc.cfopAccount.wca.unlink.useMutation({ onSuccess: async () => { await Promise.all([utils.cfopAccount.me.invalidate(), utils.cfopAccount.wca.profile.invalidate()]); setWcaIdInput(""); setMessage("Đã gỡ liên kết WCA khỏi Hồ sơ CFOP."); }, onError: (next) => setError(errorMessage(next)) });

  useEffect(() => { if (account) { setDisplayName(account.displayName); setBio(account.bio ?? ""); setGoalSeconds(account.goalMs ? String(Math.round(account.goalMs / 1000)) : ""); setWcaIdInput(account.wcaId ?? ""); } }, [account]);
  useEffect(() => {
    const state = new URLSearchParams(location.split("?")[1] ?? "").get("wca");
    if (state === "linked") { void Promise.all([utils.cfopAccount.me.invalidate(), utils.cfopAccount.wca.profile.invalidate()]); setMessage("Đã xác minh và liên kết tài khoản WCA."); }
    if (state === "error") setError("Không thể liên kết WCA. Hãy thử lại hoặc nhập WCA ID thủ công.");
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
  const submitProfile = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); const parsed = goalSeconds.trim() ? Number(goalSeconds) : null; if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1 || parsed > 3600)) { setError("Mục tiêu nhập theo giây, từ 1 đến 3600."); return; } updateProfile.mutate({ displayName, bio, goalMs: parsed === null ? null : parsed * 1000 }); };
  const submitPassword = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); changePassword.mutate({ currentPassword, newPassword }); };
  const submitWcaId = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); saveWcaId.mutate({ wcaId: wcaIdInput.trim() || null }); };
  const chooseAvatar = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (!file) return; if (!( ["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Chọn ảnh JPG, PNG hoặc WebP nhỏ hơn 2 MB."); return; } setError(""); setAvatarFile(file); };
  const uploadCroppedAvatar = (blob: Blob, contentType: "image/jpeg" | "image/png" | "image/webp") => { const reader = new FileReader(); reader.onerror = () => setError("Không đọc được ảnh đại diện đã cắt."); reader.onload = () => { const base64 = typeof reader.result === "string" ? reader.result.split(",")[1] : ""; if (base64) { setAvatarFile(null); uploadAvatar.mutate({ data: base64, contentType }); } }; reader.readAsDataURL(blob); };

  if (accountQuery.isLoading) return <div className="container"><SkeletonCard lines={6} label="Đang tải hồ sơ tài khoản" /></div>;
  if (!account) return <div className="container"><div className="alert alert-secondary mb-0"><h1 className="h4">Hồ sơ CFOP</h1><p className="mb-3">Đăng nhập tài khoản CFOP riêng để xem hồ sơ và đồng bộ dữ liệu Timer/Study giữa thiết bị.</p><Link href="/" className="btn btn-primary">Về trang Giải Rubik</Link></div></div>;
  const goalLabel = account.goalMs ? `sub-${Math.round(account.goalMs / 1000)}` : "Chưa đặt";
  const wcaProfile = wcaProfileQuery.data as WcaProfileData | undefined;

  return <div className="container py-4">
    <section className="card border-0 shadow-sm mb-4 overflow-hidden">
      <div className="card-body p-4">
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 88, height: 88 }} aria-label="Ảnh đại diện">
                {account.avatarUrl ? <img src={account.avatarUrl} alt="Ảnh đại diện" className="w-100 h-100 object-fit-cover" /> : <span className="fs-2 fw-semibold">{initials(account.displayName)}</span>}
              </div>
              <div>
                <Eyebrow>Tài khoản CFOP</Eyebrow>
                <h1 className="display-6 fw-semibold mb-2">{account.displayName}</h1>
                <p className="text-body-secondary mb-0">{account.bio || "Theo dõi tiến bộ Timer, Study và thành tích WCA của bạn."}</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-auto">
            <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
              <Link href="/timer" className="btn btn-primary"><i className="bi bi-stopwatch me-2" aria-hidden="true" />Bấm giờ</Link>
              <Link href="/history" className="btn btn-outline-secondary"><i className="bi bi-clock-history me-2" aria-hidden="true" />Xem kết quả</Link>
            </div>
            <p className="small text-body-secondary text-lg-end mb-0 mt-2">Mục tiêu: <strong>{goalLabel}</strong></p>
          </div>
        </div>
      </div>
    </section>

    {message ? <div className="alert alert-success d-flex align-items-start gap-2" role="status"><i className="bi bi-check-circle-fill mt-1" aria-hidden="true" /><span>{message}</span></div> : null}
    {error ? <div className="alert alert-danger d-flex align-items-start gap-2" role="alert"><i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true" /><span>{error}</span></div> : null}

    <section className="row g-3 mb-4" aria-label="Thống kê Timer">
      <div className="col-6 col-lg-3"><StatTile label="Lượt 3×3" value={String(timerEntries.length)} detail="đang có trong lịch sử" /></div>
      <div className="col-6 col-lg-3"><StatTile label="Tốt nhất 3×3" value={best === null ? "—" : formatSolveTime(best)} detail="single hợp lệ" /></div>
      <div className="col-6 col-lg-3"><StatTile label="Ao5 gần nhất" value={ao5 === null ? "—" : formatSolveTime(ao5)} detail="5 lượt mới nhất" /></div>
      <div className="col-6 col-lg-3"><StatTile label="Ôn hôm nay" value={String(reviewedLastLayer)} detail="case Last Layer" /></div>
    </section>

    {meetsAo5Goal(ao5, account.goalMs) ? <section className="alert alert-success d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4" role="status"><div><h2 className="h5 mb-1"><i className="bi bi-trophy-fill me-2" aria-hidden="true" />Đã đạt mục tiêu {goalLabel}</h2><p className="mb-0">Ao5 gần nhất là <strong>{formatSolveTime(ao5 ?? 0)}</strong>. Giữ nhịp solve này để ổn định thành tích.</p></div><span className="badge text-bg-success fs-6">Ao5 đạt mục tiêu</span></section> : null}

    <div className="row g-4 mb-4">
      <section className="col-12 col-xl-8">
        <div className="card h-100">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
              <div><Eyebrow>Phân tích tiến bộ</Eyebrow><h2 className="h4 mb-1">Nhịp độ theo ngày</h2><p className="text-body-secondary small mb-0">Best và Ao5 tích luỹ từ lịch sử Timer hiện có.</p></div>
              <div className="btn-group" role="group" aria-label="Phạm vi biểu đồ tiến độ">{(["7d", "30d", "all"] as ProfileProgressRange[]).map((range) => <button key={range} type="button" className={progressRange === range ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"} onClick={() => setProgressRange(range)}>{range === "7d" ? "7 ngày" : range === "30d" ? "30 ngày" : "Tất cả"}</button>)}</div>
            </div>
            <ProfileProgressChart data={filteredChart} />
          </div>
        </div>
      </section>
      <aside className="col-12 col-xl-4">
        <div className="card mb-4">
          <div className="card-body p-4">
            <Eyebrow>Study</Eyebrow><h2 className="h4 mb-1">Nhịp học hiện tại</h2><p className="small text-body-secondary mb-3">Các mốc ôn tập của bạn trong ứng dụng.</p>
            <div className="list-group list-group-flush">
              <div className="list-group-item px-0 d-flex justify-content-between"><span>Case BLD đến hạn</span><strong>{due}</strong></div>
              <div className="list-group-item px-0 d-flex justify-content-between"><span>Chuỗi ôn BLD</span><strong>{streak.current} ngày</strong></div>
              <div className="list-group-item px-0 d-flex justify-content-between"><span>Đã đánh giá BLD</span><strong>{Object.keys(bld.memoRecords).length}</strong></div>
              <div className="list-group-item px-0 d-flex justify-content-between"><span>Case Last Layer</span><strong>{Object.keys(lastLayer.records).length}</strong></div>
            </div>
            <Link href="/study" className="btn btn-outline-secondary w-100 mt-3"><i className="bi bi-journal-richtext me-2" aria-hidden="true" />Mở Study</Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3"><div className="bg-success-subtle text-success rounded p-2"><i className="bi bi-cloud-check fs-5" aria-hidden="true" /></div><div><h2 className="h5 mb-1">Đồng bộ dữ liệu</h2><p className="small text-body-secondary mb-2">Timer, BLD và Last Layer.</p></div></div>
            <p className="small mb-3 mt-3"><span className={syncQuery.isSuccess ? "text-success" : "text-body-secondary"}>{syncQuery.isSuccess ? "Đã kết nối cloud" : "Đang kiểm tra cloud"}</span>{syncQuery.data?.updatedAt ? ` · ${new Date(syncQuery.data.updatedAt).toLocaleString()}` : " · Chưa có bản lưu"}</p>
            <button type="button" onClick={() => { setError(""); setMessage(""); manualSync.mutate(createCfopCloudState()); }} disabled={manualSync.isPending} className="btn btn-primary w-100">{manualSync.isPending ? "Đang đồng bộ…" : "Đồng bộ ngay"}</button>
          </div>
        </div>
      </aside>
    </div>

    <section className="card mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3"><div><p className="small text-uppercase fw-semibold text-primary mb-1">Thành tích chính thức</p><h2 className="h4 mb-1">Hồ sơ WCA</h2><p className="small text-body-secondary mb-0">Theo dõi thành tích, huy chương, kỷ lục và personal best theo event.</p></div>{account.wcaId ? <a className="btn btn-outline-secondary btn-sm" href={wcaProfile?.profileUrl ?? `https://www.worldcubeassociation.org/persons/${account.wcaId}`} target="_blank" rel="noreferrer">Mở WCA <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a> : null}</div>
        <form className="row g-2 align-items-end" onSubmit={submitWcaId}><div className="col-12 col-md"><label className="form-label">WCA ID<input className="form-control text-uppercase" value={wcaIdInput} onChange={(event) => setWcaIdInput(event.target.value.toUpperCase())} placeholder="Ví dụ: 2016ABCD01" maxLength={10} /></label></div><div className="col-12 col-md-auto d-flex flex-wrap gap-2"><button className="btn btn-primary" disabled={saveWcaId.isPending}>{saveWcaId.isPending ? "Đang tra cứu…" : account.wcaId ? "Cập nhật WCA ID" : "Tra cứu WCA ID"}</button>{account.wcaId ? <button type="button" className="btn btn-outline-secondary" disabled={unlinkWca.isPending} onClick={() => { setError(""); setMessage(""); unlinkWca.mutate(); }}>{unlinkWca.isPending ? "Đang gỡ…" : "Gỡ liên kết"}</button> : null}</div></form>
        {wcaProfileQuery.isFetching && wcaProfileQuery.data ? <div className="mt-3"><RefreshIndicator label="Đang cập nhật thành tích WCA" /></div> : null}{wcaProfileQuery.isLoading ? <SkeletonCard lines={4} className="mt-3" label="Đang tải thành tích WCA" /> : null}{wcaProfile ? <WcaProfileDetails profile={wcaProfile} entries={entries} /> : null}<div className="border-top mt-4 pt-3"><p className="small mb-2">{wcaOauthStatusQuery.data?.configured ? "Xác minh WCA ID tự động bằng đăng nhập WCA." : "Đăng nhập WCA sẽ khả dụng sau khi web được Publish và máy chủ được cấu hình OAuth."}</p><button type="button" className="btn btn-outline-secondary btn-sm" disabled={!wcaOauthStatusQuery.data?.configured || startWcaOAuth.isPending} onClick={() => { setError(""); setMessage(""); startWcaOAuth.mutate(); }}>{startWcaOAuth.isPending ? "Đang mở WCA…" : "Liên kết bằng WCA OAuth"}</button></div>
      </div>
    </section>

    <div className="row g-4">
      <section className="col-12 col-lg-7"><div className="card h-100"><div className="card-body p-4"><p className="small text-uppercase fw-semibold text-primary mb-1">Tài khoản</p><h2 className="h4 mb-3">Thông tin cá nhân</h2><div className="d-flex align-items-center gap-3 mb-4"><div className="rounded-circle bg-body-secondary d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 54, height: 54 }}>{account.avatarUrl ? <img src={account.avatarUrl} alt="Ảnh đại diện" className="w-100 h-100 object-fit-cover" /> : <span className="small fw-semibold">{initials(account.displayName)}</span>}</div><label className="btn btn-outline-secondary btn-sm mb-0">{uploadAvatar.isPending ? "Đang tải…" : "Cắt và tải ảnh"}<input type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={chooseAvatar} disabled={uploadAvatar.isPending} /></label></div><form onSubmit={submitProfile}><label className="form-label w-100">Tên hiển thị<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="form-control mt-1" /></label><label className="form-label w-100 mt-3">Giới thiệu ngắn<textarea maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)} className="form-control mt-1" rows={3} placeholder="Ví dụ: 3×3 speedcuber, đang học CFOP" /></label><label className="form-label w-100 mt-3">Mục tiêu cá nhân (giây)<input type="number" inputMode="numeric" min={1} max={3600} value={goalSeconds} onChange={(event) => setGoalSeconds(event.target.value)} className="form-control mt-1" placeholder="Ví dụ: 15 cho sub-15" /><span className="form-text">Để trống nếu chưa đặt mục tiêu.</span></label><button disabled={updateProfile.isPending} className="btn btn-primary mt-3">{updateProfile.isPending ? "Đang lưu…" : "Lưu hồ sơ"}</button></form></div></div></section>
      <section className="col-12 col-lg-5"><div className="card h-100"><div className="card-body p-4"><p className="small text-uppercase fw-semibold text-primary mb-1">Bảo mật</p><h2 className="h4 mb-2">Đổi mật khẩu</h2><p className="small text-body-secondary mb-4">Dùng ít nhất 10 ký tự. Đổi mật khẩu sẽ làm mới phiên đăng nhập.</p><form onSubmit={submitPassword}><label className="form-label w-100">Mật khẩu hiện tại<input required type="password" autoComplete="current-password" minLength={10} maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-control mt-1" /></label><label className="form-label w-100 mt-3">Mật khẩu mới<input required type="password" autoComplete="new-password" minLength={10} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="form-control mt-1" /></label><button disabled={changePassword.isPending} className="btn btn-outline-secondary mt-3">{changePassword.isPending ? "Đang đổi…" : "Đổi mật khẩu"}</button></form></div></div></section>
    </div>
    <AvatarCropDialog file={avatarFile} onClose={() => setAvatarFile(null)} onConfirm={uploadCroppedAvatar} />
  </div>;
}
