import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/BootstrapDialog";
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
    <Dialog open={open} onOpenChange={next => {
      if (!next) onClose();
    }}>
      <DialogContent>
        <DialogHeader className="align-items-start gap-3">
          <div className="flex-grow-1">
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
            className="btn-close flex-shrink-0"
            aria-label={t("account.dialog.close")}
            onClick={onClose}
          />
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div
              className="btn-group w-100 mb-3"
              role="group"
              aria-label={t("account.dialog.actionLabel")}
            >
              <button
                type="button"
                className={
                  mode === "login"
                    ? "btn btn-primary"
                    : "btn btn-outline-secondary"
                }
                onClick={() => onModeChange("login")}
              >
                {t("account.signIn")}
              </button>
              <button
                type="button"
                className={
                  mode === "register"
                    ? "btn btn-primary"
                    : "btn btn-outline-secondary"
                }
                onClick={() => onModeChange("register")}
              >
                {t("account.register")}
              </button>
            </div>
            {mode === "register" ? (
              <label className="form-label w-100">
                {t("account.dialog.displayName")}
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  className="form-control mt-1"
                  value={displayName}
                  onChange={event => onDisplayNameChange(event.target.value)}
                />
              </label>
            ) : null}
            <label className="form-label w-100 mt-2">
              {t("account.dialog.email")}
              <input
                required
                type="email"
                autoComplete="email"
                className="form-control mt-1"
                value={email}
                onChange={event => onEmailChange(event.target.value)}
              />
            </label>
            <label className="form-label w-100 mt-2">
              {t("account.dialog.password")}
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
                onChange={event => onPasswordChange(event.target.value)}
              />
            </label>
            {mode === "register" ? (
              <p className="small text-body-secondary mt-2 mb-0">
                {t("account.dialog.passwordHint")}
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
              onClick={onClose}
              disabled={pending}
            >
              {t("account.dialog.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
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
