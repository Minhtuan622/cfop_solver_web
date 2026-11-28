import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProfilePasswordDialog({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string;
  onSubmit: (values: { currentPassword: string; newPassword: string }, clear: () => void) => void;
}) {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  useEffect(() => {
    if (open) return;
    setCurrentPassword("");
    setNewPassword("");
  }, [open]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ currentPassword, newPassword }, () => onOpenChange(false));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} dialogClassName="sm:max-w-md">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("profile.passwordTitle")}</DialogTitle>
          <DialogDescription>{t("profile.passwordHint")}</DialogDescription>
        </DialogHeader>
        <form id="profile-password-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-2">
          <label className="block text-sm font-medium text-ink">
            {t("profile.currentPassword")}
            <Input
              className="mt-1.5"
              required
              type="password"
              autoComplete="current-password"
              minLength={10}
              maxLength={128}
              value={currentPassword}
              onChange={event => setCurrentPassword(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            {t("profile.newPassword")}
            <Input
              className="mt-1.5"
              required
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
            />
          </label>
          {error ? (
            <p role="alert" className="m-0 rounded-panel bg-danger-soft px-4 py-3 text-sm text-ink">
              {error}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            {t("profile.cancel")}
          </Button>
          <Button variant="primary" type="submit" form="profile-password-form" disabled={pending}>
            {pending ? t("profile.changePasswordPending") : t("profile.changePassword")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
