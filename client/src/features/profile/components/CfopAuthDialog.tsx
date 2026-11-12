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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";
import { IconButton } from "@/components/ui/StudioUI";

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
          <IconButton
            className="ml-auto h-8 w-8 shrink-0 text-muted hover:bg-surface-3 hover:text-ink"
            label={t("account.dialog.close")}
            icon={null}
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
              <Button
                variant={mode === "login" ? "primary" : "secondary"}
                size="md"
                type="button"

                onClick={() => onModeChange("login")}
              >
                {t("account.signIn")}
              </Button>
              <Button
                variant={mode === "register" ? "primary" : "secondary"}
                size="md"
                type="button"

                onClick={() => onModeChange("register")}
              >
                {t("account.register")}
              </Button>
            </div>
            {mode === "register" ? (
              <label className="mb-1.5 block text-sm font-medium text-ink w-full">
                {t("account.dialog.displayName")}
                <Input
                  className="mt-1"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"

                  value={displayName}
                  onChange={event => onDisplayNameChange(event.target.value)}
                />
              </label>
            ) : null}
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-2">
              {t("account.dialog.email")}
              <Input
                className="mt-1"
                required
                type="email"
                autoComplete="email"

                value={email}
                onChange={event => onEmailChange(event.target.value)}
              />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-2">
              {t("account.dialog.password")}
              <Input
                className="mt-1"
                required
                type="password"
                minLength={10}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }

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
                className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mt-4 mb-0"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              type="button"

              onClick={onClose}
              disabled={pending}
            >
              {t("account.dialog.cancel")}
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"

              disabled={pending}
            >
              {pending
                ? t("account.dialog.pending")
                : mode === "login"
                  ? t("account.signIn")
                  : t("account.dialog.createAccount")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
