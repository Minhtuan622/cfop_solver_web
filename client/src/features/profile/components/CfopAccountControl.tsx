import { useState } from "react";
import { BoxArrowRight, PersonCircle } from "@/components/ui/BootstrapIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/BootstrapDialog";
import { trpc } from "@/lib/trpc";
import { errorMessage, initials } from "@/features/profile";
import { Link } from "wouter";

type AuthMode = "login" | "register";

export function CfopAccountControl() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const complete = async () => {
    await utils.cfopAccount.me.invalidate();
    setOpen(false);
    setPassword("");
    setError("");
  };
  const register = trpc.cfopAccount.register.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next)),
  });
  const login = trpc.cfopAccount.login.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next)),
  });
  const logout = trpc.cfopAccount.logout.useMutation({
    onSuccess: () => void utils.cfopAccount.me.invalidate(),
  });
  const pending = register.isPending || login.isPending;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "register") register.mutate({ email, password, displayName });
    else login.mutate({ email, password });
  };
  const show = (next: AuthMode) => {
    setMode(next);
    setError("");
    setOpen(true);
  };
  const account = accountQuery.data;

  if (account)
    return (
      <div className="dropdown d-grid d-lg-block">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center justify-content-center"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls="cfop-account-menu"
        >
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={`Ảnh đại diện của ${account.displayName}`}
              width={24}
              height={24}
              className="rounded-circle object-fit-cover flex-shrink-0 me-1"
            />
          ) : (
            <span
              className="rounded-circle bg-body-secondary text-body d-inline-flex align-items-center justify-content-center flex-shrink-0 me-1 small fw-semibold"
              style={{ width: 24, height: 24 }}
              aria-label={`Chữ cái đầu của ${account.displayName}`}
            >
              {initials(account.displayName)}
            </span>
          )}
          <span>{account.displayName}</span>
        </button>
        {menuOpen ? (
          <ul
            id="cfop-account-menu"
            className="dropdown-menu dropdown-menu-end show mt-2"
            role="menu"
          >
            <li>
              <Link
                href="/profile"
                role="menuitem"
                className="dropdown-item py-2"
                onClick={() => setMenuOpen(false)}
              >
                <PersonCircle className="fs-6 me-2" />
                Hồ sơ
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                className="dropdown-item py-2"
                onClick={() => {
                  setMenuOpen(false);
                  logout.mutate();
                }}
                disabled={logout.isPending}
              >
                <BoxArrowRight className="fs-6 me-2" />
                Đăng xuất
              </button>
            </li>
          </ul>
        ) : null}
      </div>
    );

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => show("login")}
      >
        <PersonCircle className="fs-6 me-1" />
        Đăng nhập
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="align-items-start gap-3">
            <div className="flex-grow-1">
              <DialogTitle>
                {mode === "login"
                  ? "Đăng nhập CFOP Solver"
                  : "Tạo tài khoản CFOP Solver"}
              </DialogTitle>
              <DialogDescription>
                Tài khoản này riêng cho CFOP Solver Studio, không liên quan đến
                tài khoản Manus.
              </DialogDescription>
            </div>
            <button
              type="button"
              className="btn-close flex-shrink-0"
              aria-label="Đóng"
              onClick={() => setOpen(false)}
            />
          </DialogHeader>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div
                className="btn-group w-100 mb-3"
                role="group"
                aria-label="Chọn thao tác tài khoản"
              >
                <button
                  type="button"
                  className={
                    mode === "login"
                      ? "btn btn-primary"
                      : "btn btn-outline-secondary"
                  }
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className={
                    mode === "register"
                      ? "btn btn-primary"
                      : "btn btn-outline-secondary"
                  }
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Đăng ký
                </button>
              </div>
              {mode === "register" ? (
                <label className="form-label w-100">
                  Tên hiển thị
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    className="form-control mt-1"
                    value={displayName}
                    onChange={event => setDisplayName(event.target.value)}
                  />
                </label>
              ) : null}
              <label className="form-label w-100 mt-2">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  className="form-control mt-1"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </label>
              <label className="form-label w-100 mt-2">
                Mật khẩu
                <input
                  required
                  type="password"
                  minLength={10}
                  maxLength={128}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="form-control mt-1"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
              </label>
              {mode === "register" ? (
                <p className="small text-body-secondary mt-2 mb-0">
                  Dùng ít nhất 10 ký tự. Mật khẩu được băm trên server; ứng dụng
                  không lưu mật khẩu dạng chữ thường.
                </p>
              ) : null}
              {error ? (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </div>
              ) : null}
            </div>
            <DialogFooter className="flex-wrap justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending}
              >
                {pending
                  ? "Đang xử lý…"
                  : mode === "login"
                    ? "Đăng nhập"
                    : "Tạo tài khoản"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
