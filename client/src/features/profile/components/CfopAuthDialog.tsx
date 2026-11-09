import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";

export type AuthMode = "login" | "register";

type Props = {
  open: boolean;
  mode: AuthMode;
  email: string;
  password: string;
  displayName: string;
  error: string;
  pending: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

/** The sign-in / sign-up dialog of the native CFOP account. */
export function CfopAuthDialog({
  open,
  mode,
  email,
  password,
  displayName,
  error,
  pending,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onSubmit,
  onClose,
}: Props) {
  const { t } = useLanguage();
  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader className="items-start gap-4">
          <div className="grow">
            <DialogTitle>
              {mode === "login"
                ? t("account.dialog.loginTitle")
                : t("account.dialog.registerTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("account.dialog.description")}
            </DialogDescription>
          </div>
          <button
            type="button"
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full p-0 text-muted transition hover:bg-surface-3 hover:text-ink focus-visible:ring-4 focus-visible:ring-primary/20"
            aria-label={t("account.dialog.close")}
            onClick={onClose}
          />
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div
              className="inline-flex flex-wrap items-center gap-1 w-full mb-4"
              role="group"
              aria-label={t("account.dialog.actionLabel")}
            >
              <button
                type="button"
                className={
                  mode === "login"
                    ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
                    : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
                }
                onClick={() => onModeChange("login")}
              >
                {t("account.signIn")}
              </button>
              <button
                type="button"
                className={
                  mode === "register"
                    ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
                    : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
                }
                onClick={() => onModeChange("register")}
              >
                {t("account.register")}
              </button>
            </div>
            {mode === "register" ? (
              <label className="mb-1.5 block text-sm font-medium text-ink w-full">
                {t("account.dialog.displayName")}
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 mt-1"
                  value={displayName}
                  onChange={event => onDisplayNameChange(event.target.value)}
                />
              </label>
            ) : null}
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-2">
              {t("account.dialog.email")}
              <input
                required
                type="email"
                autoComplete="email"
                className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 mt-1"
                value={email}
                onChange={event => onEmailChange(event.target.value)}
              />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-2">
              {t("account.dialog.password")}
              <input
                required
                type="password"
                minLength={10}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 mt-1"
                value={password}
                onChange={event => onPasswordChange(event.target.value)}
              />
            </label>
            {mode === "register" ? (
              <p className="text-sm text-muted mt-2 mb-0">
                {t("account.dialog.passwordHint")}
              </p>
            ) : null}
            {error ? (
              <div
                className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink mt-4 mb-0"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex-wrap justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              onClick={onClose}
              disabled={pending}
            >
              {t("account.dialog.cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
              disabled={pending}
            >
              {pending
                ? t("account.dialog.pending")
                : mode === "login"
                  ? t("account.signIn")
                  : t("account.dialog.createAccount")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
