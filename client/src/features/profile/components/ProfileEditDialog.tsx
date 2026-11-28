import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormControls";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { initials } from "../lib/profilePresentation";

export type ProfileDetailsValues = { displayName: string; bio: string; goalSeconds: string };

export function ProfileEditDialog({
  open,
  onOpenChange,
  account,
  avatarUploadEnabled,
  avatarPending,
  onChooseAvatar,
  savePending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: { displayName: string; bio?: string | null; avatarUrl?: string | null; goalMs?: number | null };
  avatarUploadEnabled: boolean;
  avatarPending: boolean;
  onChooseAvatar: (event: ChangeEvent<HTMLInputElement>) => void;
  savePending: boolean;
  error: string;
  onSubmit: (values: ProfileDetailsValues) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ProfileDetailsValues>({ displayName: "", bio: "", goalSeconds: "" });
  // Every time the dialog opens it starts from the saved values.
  useEffect(() => {
    if (!open) return;
    setForm({
      displayName: account.displayName,
      bio: account.bio ?? "",
      goalSeconds: account.goalMs ? String(Math.round(account.goalMs / 1000)) : "",
    });
  }, [open, account]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} dialogClassName="sm:max-w-md">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
          <DialogDescription>{t("profile.editProfileHint")}</DialogDescription>
        </DialogHeader>
        <form id="profile-edit-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-2">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-3 text-lg font-semibold text-ink">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={t("profile.avatarAlt")} className="h-full w-full object-cover" />
              ) : (
                initials(account.displayName)
              )}
            </div>
            {avatarUploadEnabled ? (
              <div className="flex flex-col items-start gap-1.5">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-transparent px-3 py-1.5 text-xs font-semibold leading-none text-primary transition focus-within:ring-4 focus-within:ring-primary/20 hover:bg-primary-soft">
                  {avatarPending ? t("profile.avatarUploadPending") : t("profile.avatarUpload")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={onChooseAvatar}
                    disabled={avatarPending}
                  />
                </label>
                <span className="text-xs text-muted">{t("profile.avatarHint")}</span>
              </div>
            ) : null}
          </div>
          <label className="block text-sm font-medium text-ink">
            {t("profile.displayName")}
            <Input
              className="mt-1.5"
              required
              minLength={2}
              maxLength={80}
              value={form.displayName}
              onChange={event => setForm(current => ({ ...current, displayName: event.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            {t("profile.bio")}
            <Textarea
              className="mt-1.5"
              maxLength={280}
              rows={3}
              value={form.bio}
              onChange={event => setForm(current => ({ ...current, bio: event.target.value }))}
              placeholder={t("profile.bioPlaceholder")}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            {t("profile.goal")}
            <Input
              className="mt-1.5"
              type="number"
              inputMode="numeric"
              min={1}
              max={3600}
              value={form.goalSeconds}
              onChange={event => setForm(current => ({ ...current, goalSeconds: event.target.value }))}
              placeholder={t("profile.goalPlaceholder")}
            />
            <span className="mt-1.5 block text-xs font-normal text-muted">{t("profile.goalHelp")}</span>
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
          <Button variant="primary" type="submit" form="profile-edit-form" disabled={savePending}>
            {savePending ? t("profile.saveProfilePending") : t("profile.saveProfile")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
