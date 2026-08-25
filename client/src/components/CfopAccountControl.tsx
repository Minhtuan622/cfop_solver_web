import { useState } from "react";
import { TRPCClientError } from "@trpc/client";
import { BoxArrowRight, PersonCircle } from "@/components/BootstrapIcon";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/BootstrapDialog";
import { trpc } from "@/lib/trpc";

type AuthMode = "login" | "register";

function messageFrom(error: unknown) {
  return error instanceof TRPCClientError ? error.message : "Không thể hoàn tất. Hãy thử lại.";
}

export function CfopAccountControl() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 60_000, retry: false });
  const complete = async () => { await utils.cfopAccount.me.invalidate(); setOpen(false); setPassword(""); setError(""); };
  const register = trpc.cfopAccount.register.useMutation({ onSuccess: complete, onError: (next) => setError(messageFrom(next)) });
  const login = trpc.cfopAccount.login.useMutation({ onSuccess: complete, onError: (next) => setError(messageFrom(next)) });
  const logout = trpc.cfopAccount.logout.useMutation({ onSuccess: () => void utils.cfopAccount.me.invalidate() });
  const pending = register.isPending || login.isPending;
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (mode === "register") register.mutate({ email, password, displayName }); else login.mutate({ email, password });
  };
  const show = (next: AuthMode) => { setMode(next); setError(""); setOpen(true); };
  const account = accountQuery.data;

  if (account) return <div className="d-flex align-items-center gap-2"><span className="small text-body-secondary d-none d-lg-inline">{account.displayName}</span><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="Đăng xuất tài khoản CFOP"><BoxArrowRight className="fs-6" /></button></div>;

  return <><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => show("login")}><PersonCircle className="fs-6 me-1" />Đăng nhập</button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><div><DialogTitle>{mode === "login" ? "Đăng nhập CFOP Solver" : "Tạo tài khoản CFOP Solver"}</DialogTitle><DialogDescription>Tài khoản này riêng cho CFOP Solver Studio, không liên quan đến tài khoản Manus.</DialogDescription></div><button type="button" className="btn-close" aria-label="Đóng" onClick={() => setOpen(false)} /></DialogHeader><form onSubmit={submit}><div className="modal-body"><div className="btn-group w-100 mb-3" role="group" aria-label="Chọn thao tác tài khoản"><button type="button" className={mode === "login" ? "btn btn-primary" : "btn btn-outline-secondary"} onClick={() => { setMode("login"); setError(""); }}>Đăng nhập</button><button type="button" className={mode === "register" ? "btn btn-primary" : "btn btn-outline-secondary"} onClick={() => { setMode("register"); setError(""); }}>Đăng ký</button></div>{mode === "register" ? <label className="form-label w-100">Tên hiển thị<input required minLength={2} maxLength={80} autoComplete="name" className="form-control mt-1" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label> : null}<label className="form-label w-100 mt-2">Email<input required type="email" autoComplete="email" className="form-control mt-1" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="form-label w-100 mt-2">Mật khẩu<input required type="password" minLength={10} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} className="form-control mt-1" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{mode === "register" ? <p className="small text-body-secondary mt-2 mb-0">Dùng ít nhất 10 ký tự. Mật khẩu được băm trên server; ứng dụng không lưu mật khẩu dạng chữ thường.</p> : null}{error ? <div className="alert alert-danger mt-3 mb-0" role="alert">{error}</div> : null}</div><DialogFooter><button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)} disabled={pending}>Hủy</button><button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button></DialogFooter></form></DialogContent></Dialog></>;
}
