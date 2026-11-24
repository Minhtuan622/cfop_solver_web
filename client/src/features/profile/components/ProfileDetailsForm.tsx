import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { initials } from "../lib/profilePresentation";

export type ProfileDetailsValues = { displayName: string; bio: string; goalSeconds: string };

export function ProfileDetailsForm({
  account,
  avatarUploadEnabled,
  avatarPending,
  onChooseAvatar,
  savePending,
  onSubmit,
}: {
  account: { displayName: string; bio?: string | null; avatarUrl?: string | null; goalMs?: number | null };
  avatarUploadEnabled: boolean;
  avatarPending: boolean;
  onChooseAvatar: (event: ChangeEvent<HTMLInputElement>) => void;
  savePending: boolean;
  onSubmit: (values: ProfileDetailsValues) => void;
}) {
  const { t } = useLanguage();
  const { avatarUrl, displayName } = account;
  const [form, setForm] = useState<ProfileDetailsValues>({ displayName: "", bio: "", goalSeconds: "" });
  useEffect(() => {
    setForm({
      displayName: account.displayName,
      bio: account.bio ?? "",
      goalSeconds: account.goalMs ? String(Math.round(account.goalMs / 1000)) : "",
    });
  }, [account]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };
  return (
    <section className="col-span-12 lg:col-span-7">
      <div className="rounded-card bg-surface h-full">
        <div className="p-5 sm:p-6">
          <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-1">
            {t("profile.sectionAccount")}
          </p>
          <h2 className="text-lg font-semibold tracking-tight mb-4">
            {t("profile.sectionPersonal")}
          </h2>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="rounded-full bg-surface-2 flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 54, height: 54 }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={t("profile.avatarAlt")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {initials(displayName)}
                </span>
              )}
            </div>
            {avatarUploadEnabled && (
              <label className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs mb-0">
                {avatarPending
                  ? t("profile.avatarUploadPending")
                  : t("profile.avatarUpload")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={onChooseAvatar}
                  disabled={avatarPending}
                />
              </label>
            )}
          </div>
          <form onSubmit={submit}>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full">
              {t("profile.displayName")}
              <Input
                className="mt-1"
                required
                minLength={2}
                maxLength={80}
                value={form.displayName}
                onChange={event => setForm(current => ({ ...current, displayName: event.target.value }))}
              />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-4">
              {t("profile.bio")}
              <Textarea
                className="mt-1"
                maxLength={280}
                value={form.bio}
                onChange={event => setForm(current => ({ ...current, bio: event.target.value }))}

                rows={3}
                placeholder={t("profile.bioPlaceholder")}
              />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-4">
              {t("profile.goal")}
              <Input
                className="mt-1"
                type="number"
                inputMode="numeric"
                min={1}
                max={3600}
                value={form.goalSeconds}
                onChange={event => setForm(current => ({ ...current, goalSeconds: event.target.value }))}

                placeholder={t("profile.goalPlaceholder")}
              />
              <span className="mt-1.5 text-xs text-muted">
                {t("profile.goalHelp")}
              </span>
            </label>
            <Button
              variant="primary"
              size="md"
              className="mt-4"
              disabled={savePending}
            >
              {savePending
                ? t("profile.saveProfilePending")
                : t("profile.saveProfile")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
