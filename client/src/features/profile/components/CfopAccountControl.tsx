import { useEffect, useRef, useState, type FormEvent } from "react";
import { BoxArrowRight, PersonCircle } from "@/components/ui/Icon";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccountDropdown } from "./AccountDropdown";
import { CfopAuthDialog, type AuthMode } from "./CfopAuthDialog";
import { errorMessage } from "@/lib/apiError";
import { initials } from "../lib/profilePresentation";
import { Button } from "@/components/ui/Button";

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
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  if (account)
    return (
      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="outlined"
          size="plain"
          className="w-full px-3 py-2 text-sm shadow-sm xl:w-auto"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls="cfop-account-menu"
          aria-label={account.displayName}
        >
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={t("account.avatarAlt", { name: account.displayName })}
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-ink"
              aria-label={t("account.initialsLabel", {
                name: account.displayName,
              })}
            >
              {initials(account.displayName)}
            </span>
          )}
          <span className="hidden max-w-[10ch] truncate xl:inline">
            {account.displayName}
          </span>
        </Button>
        {menuOpen ? (
          <AccountDropdown>
            <li>
              <Link
                href="/profile"
                role="menuitem"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-surface-2"
                onClick={closeMenu}
              >
                <PersonCircle className="text-base" />
                {t("account.profile")}
              </Link>
            </li>
            <li>
              <hr className="my-1 h-px border-0 bg-line" />
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-2 disabled:opacity-50"
                onClick={() => {
                  closeMenu();
                  logout.mutate();
                }}
                disabled={logout.isPending}
              >
                <BoxArrowRight className="text-base" />
                {t("account.logout")}
              </button>
            </li>
          </AccountDropdown>
        ) : null}
      </div>
    );

  return (
    <>
      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="outlined"
          size="plain"
          className="w-full px-3 py-2 text-sm shadow-sm xl:w-auto"
          onClick={() => setMenuOpen(value => !value)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls="cfop-account-menu"
        >
          <PersonCircle className="text-base" />
          {t("account.signIn")}
        </Button>
        {menuOpen ? (
          <AccountDropdown>
            <li>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-2"
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
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-2"
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
