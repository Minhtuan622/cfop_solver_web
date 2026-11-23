import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Đổi mật khẩu. `onSubmit` trả về Promise đạt khi đổi thành công; lúc đó hai
 * ô mật khẩu được xoá trắng.
 */
export function ProfilePasswordForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (values: { currentPassword: string; newPassword: string }, clear: () => void) => void;
}) {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ currentPassword, newPassword }, () => {
      setCurrentPassword("");
      setNewPassword("");
    });
  };
  return (
    <section className="col-span-12 lg:col-span-5">
      <div className="rounded-card bg-surface h-full">
        <div className="p-5 sm:p-6">
          <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-1">
            {t("profile.sectionSecurity")}
          </p>
          <h2 className="text-lg font-semibold tracking-tight mb-2">
            {t("profile.passwordTitle")}
          </h2>
          <p className="text-sm text-muted mb-6">
            {t("profile.passwordHint")}
          </p>
          <form onSubmit={submit}>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full">
              {t("profile.currentPassword")}
              <Input
                className="mt-1"
                required
                type="password"
                autoComplete="current-password"
                minLength={10}
                maxLength={128}
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
              />
            </label>
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-4">
              {t("profile.newPassword")}
              <Input
                className="mt-1"
                required
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
              />
            </label>
            <Button
              variant="secondary"
              size="md"
              className="mt-4"
              disabled={pending}
            >
              {pending
                ? t("profile.changePasswordPending")
                : t("profile.changePassword")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
