import { useEffect, useRef, useState, type FormEvent } from "react";
import { BoxArrowRight, PersonCircle } from "@/components/ui/BootstrapIcon";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccountDropdown } from "./AccountDropdown";
import { CfopAuthDialog, type AuthMode } from "./CfopAuthDialog";
import { errorMessage } from "@/lib/apiError";
import { initials } from "../lib/profilePresentation";

export function CfopAccountControl() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
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
    onError: next => setError(errorMessage(next, t)),
  });
  const login = trpc.cfopAccount.login.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next, t)),
  });
  const logout = trpc.cfopAccount.logout.useMutation({
    onSuccess: () => void utils.cfopAccount.me.invalidate(),
  });
  const pending = register.isPending || login.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "register") register.mutate({ email, password, displayName });
    else login.mutate({ email, password });
  };
  const changeMode = (next: AuthMode) => {
    setMode(next);
    setError("");
  };
  const show = (next: AuthMode) => {
    changeMode(next);
    setOpen(true);
  };
  const closeMenu = () => setMenuOpen(false);
  const account = accountQuery.data;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  if (account)
    return (
      <div ref={menuRef} className="dropdown d-grid d-xl-block">
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
              alt={t("account.avatarAlt", { name: account.displayName })}
              width={24}
              height={24}
              className="rounded-circle object-fit-cover flex-shrink-0 me-1"
            />
          ) : (
            <span
              className="rounded-circle bg-body-secondary text-body d-inline-flex align-items-center justify-content-center flex-shrink-0 me-1 small fw-semibold"
              style={{ width: 24, height: 24 }}
              aria-label={t("account.initialsLabel", { name: account.displayName })}
            >
              {initials(account.displayName)}
            </span>
          )}
          <span>{account.displayName}</span>
        </button>
        {menuOpen ? (
          <AccountDropdown>
            <li>
              <Link
                href="/profile"
                role="menuitem"
                className="dropdown-item py-2"
                onClick={closeMenu}
              >
                <PersonCircle className="fs-6 me-2" />
                {t("account.profile")}
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
                  closeMenu();
                  logout.mutate();
                }}
                disabled={logout.isPending}
              >
                <BoxArrowRight className="fs-6 me-2" />
                {t("account.logout")}
              </button>
            </li>
          </AccountDropdown>
        ) : null}
      </div>
    );

  return (
    <>
      <div ref={menuRef} className="dropdown d-grid d-xl-block">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm dropdown-toggle"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls="cfop-account-menu"
        >
          <PersonCircle className="fs-6 me-1" />
          {t("account.signIn")}
        </button>
        {menuOpen ? (
          <AccountDropdown>
            <li>
              <button
                type="button"
                role="menuitem"
                className="dropdown-item py-2"
                onClick={() => {
                  closeMenu();
                  show("login");
                }}
              >
                {t("account.signIn")}
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                className="dropdown-item py-2"
                onClick={() => {
                  closeMenu();
                  show("register");
                }}
              >
                {t("account.register")}
              </button>
            </li>
          </AccountDropdown>
        ) : null}
      </div>
      <CfopAuthDialog
        open={open}
        mode={mode}
        email={email}
        password={password}
        displayName={displayName}
        error={error}
        pending={pending}
        onModeChange={changeMode}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onDisplayNameChange={setDisplayName}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
