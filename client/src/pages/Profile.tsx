import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { readSolveHistory, effectiveTime, formatSolveTime } from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";
import { dueMemoRecords, readBldProfile, reviewStreak } from "@/lib/bldProfile";
import { readLastLayerStudy, todayReviewCount } from "@/lib/lastLayerStudy";

function AccountMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="col-6 col-lg-3"><div className="card h-100"><div className="card-body"><p className="small text-body-secondary mb-1">{label}</p><p className="h4 mb-1">{value}</p><p className="small text-body-secondary mb-0">{detail}</p></div></div></article>;
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Không thể hoàn tất. Hãy thử lại."; }

export default function Profile() {
  const utils = trpc.useUtils();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 30_000, retry: false });
  const account = accountQuery.data;
  const [entries] = useState(() => readSolveHistory());
  const [bld] = useState(() => readBldProfile());
  const [lastLayer] = useState(() => readLastLayerStudy());
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const syncQuery = trpc.cfopAccount.cloudState.get.useQuery(undefined, { enabled: Boolean(account), retry: false });
  const updateProfile = trpc.cfopAccount.updateProfile.useMutation({ onSuccess: async () => { await utils.cfopAccount.me.invalidate(); setMessage("Đã cập nhật hồ sơ."); }, onError: (next) => setError(errorMessage(next)) });
  const changePassword = trpc.cfopAccount.changePassword.useMutation({ onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setMessage("Đã đổi mật khẩu và làm mới phiên đăng nhập."); }, onError: (next) => setError(errorMessage(next)) });

  useEffect(() => { if (account) { setDisplayName(account.displayName); setBio(account.bio ?? ""); } }, [account]);

  const valid = entries.map(effectiveTime).filter((value): value is number => value !== null);
  const best = valid.length ? Math.min(...valid) : null;
  const ao5 = entries.length >= 5 ? rollingAverage(entries.slice(0, 5)) : null;
  const due = dueMemoRecords(bld).length;
  const streak = reviewStreak(bld);
  const reviewedLastLayer = todayReviewCount(lastLayer.records);
  const submitProfile = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); updateProfile.mutate({ displayName, bio }); };
  const submitPassword = (event: React.FormEvent) => { event.preventDefault(); setError(""); setMessage(""); changePassword.mutate({ currentPassword, newPassword }); };

  if (accountQuery.isLoading) return <div className="container"><div className="placeholder-glow"><span className="placeholder col-5" /></div></div>;
  if (!account) return <div className="container"><div className="alert alert-secondary mb-0"><h1 className="h4">Hồ sơ CFOP</h1><p className="mb-3">Đăng nhập tài khoản CFOP riêng để xem hồ sơ và đồng bộ dữ liệu Timer/Study giữa thiết bị.</p><Link href="/" className="btn btn-primary">Về trang Giải Rubik</Link></div></div>;

  return <div className="container"><div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4"><div><p className="text-body-secondary small mb-1">Tài khoản CFOP</p><h1 className="h2 mb-1">Hồ sơ của {account.displayName}</h1><p className="text-body-secondary mb-0">Timer và Study tự đồng bộ sau khi bạn đăng nhập.</p></div><Link href="/history" className="btn btn-outline-secondary">Xem toàn bộ kết quả</Link></div>
    <section className="row g-3 mb-4" aria-label="Thống kê Timer"><AccountMetric label="Lượt giải" value={String(entries.length)} detail="đang có trong lịch sử" /><AccountMetric label="Tốt nhất" value={best === null ? "—" : formatSolveTime(best)} detail="single hợp lệ" /><AccountMetric label="Ao5 gần nhất" value={ao5 === null ? "—" : formatSolveTime(ao5)} detail="5 lượt mới nhất" /><AccountMetric label="Ôn hôm nay" value={String(reviewedLastLayer)} detail="case Last Layer" /></section>
    <div className="row g-4"><section className="col-12 col-lg-6"><div className="card h-100"><div className="card-body"><h2 className="h5">Tiến độ Study</h2><div className="row g-3 mt-1"><div className="col-6"><p className="small text-body-secondary mb-1">Case BLD đến hạn</p><p className="h4 mb-0">{due}</p></div><div className="col-6"><p className="small text-body-secondary mb-1">Chuỗi ôn BLD</p><p className="h4 mb-0">{streak.current} ngày</p></div><div className="col-6"><p className="small text-body-secondary mb-1">Đã đánh giá BLD</p><p className="h4 mb-0">{Object.keys(bld.memoRecords).length}</p></div><div className="col-6"><p className="small text-body-secondary mb-1">Case Last Layer</p><p className="h4 mb-0">{Object.keys(lastLayer.records).length}</p></div></div><Link href="/study" className="btn btn-outline-secondary mt-4">Mở Study</Link></div></div></section>
      <section className="col-12 col-lg-6"><div className="card h-100"><div className="card-body"><h2 className="h5">Đồng bộ dữ liệu</h2><p className="text-body-secondary mb-2">Tự lưu lịch sử Timer, tiến độ BLD và Last Layer khi bạn thay đổi dữ liệu.</p><p className="small mb-0"><span className={syncQuery.isSuccess ? "text-success" : "text-body-secondary"}>{syncQuery.isSuccess ? "Đã kết nối cloud" : "Đang kiểm tra cloud"}</span>{syncQuery.data?.updatedAt ? ` · Lần lưu gần nhất: ${new Date(syncQuery.data.updatedAt).toLocaleString()}` : " · Chưa có bản lưu cloud"}</p></div></div></section>
      <section className="col-12 col-lg-6"><div className="card"><div className="card-body"><h2 className="h5">Thông tin cá nhân</h2><form onSubmit={submitProfile}><label className="form-label w-100">Tên hiển thị<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="form-control mt-1" /></label><label className="form-label w-100 mt-3">Giới thiệu ngắn<textarea maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)} className="form-control mt-1" rows={3} placeholder="Ví dụ: 3×3 speedcuber, đang học CFOP" /></label><button disabled={updateProfile.isPending} className="btn btn-primary mt-3">{updateProfile.isPending ? "Đang lưu…" : "Lưu hồ sơ"}</button></form></div></div></section>
      <section className="col-12 col-lg-6"><div className="card"><div className="card-body"><h2 className="h5">Đổi mật khẩu</h2><p className="small text-body-secondary">Dùng ít nhất 10 ký tự. Đổi mật khẩu sẽ làm mới phiên đăng nhập của bạn.</p><form onSubmit={submitPassword}><label className="form-label w-100">Mật khẩu hiện tại<input required type="password" autoComplete="current-password" minLength={10} maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-control mt-1" /></label><label className="form-label w-100 mt-3">Mật khẩu mới<input required type="password" autoComplete="new-password" minLength={10} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="form-control mt-1" /></label><button disabled={changePassword.isPending} className="btn btn-outline-secondary mt-3">{changePassword.isPending ? "Đang đổi…" : "Đổi mật khẩu"}</button></form></div></div></section>
    </div>{message ? <div className="alert alert-success mt-4" role="status">{message}</div> : null}{error ? <div className="alert alert-danger mt-4" role="alert">{error}</div> : null}</div>;
}
