import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import {
  useCfopAccountSession,
} from "../lib/useCfopAccountSession";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { FacebookSignInButton } from "./FacebookSignInButton";

/**
 * Liên kết nhiều nhà cung cấp vào một tài khoản CFOP: nếu mất Google hoặc
 * Facebook, người dùng vẫn đăng nhập được bằng nhà cung cấp còn lại.
 */
export function AccountIdentitiesCard() {
  const { t } = useLanguage();
  const session = useCfopAccountSession();
  const account = session.account;
  const identities = trpc.cfopAccount.identities.useQuery(undefined, {
    enabled: Boolean(account),
  });
  const googleEnabled = trpc.cfopAccount.googleConfigured.useQuery(undefined);
  const facebookEnabled = trpc.cfopAccount.facebookConfigured.useQuery(undefined);
  const link = trpc.cfopAccount.linkIdentity.useMutation({
    onSuccess: async () => {
      await identities.refetch();
    },
  });
  const unlink = trpc.cfopAccount.unlinkIdentity.useMutation({
    onSuccess: async () => {
      await identities.refetch();
    },
  });

  if (!account) return null;
  const rows = identities.data ?? [];
  const has = (provider: "google" | "facebook") => rows.some(row => row.provider === provider);
  const error = link.error ? errorMessage(link.error, t) : unlink.error ? errorMessage(unlink.error, t) : "";

  return (
    <section className="mt-8 rounded-card bg-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-ink">
        {t("account.identitiesTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("account.identitiesHint")}</p>
      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-muted">{t("account.identitiesNone")}</li>
        ) : (
          rows.map(row => (
            <li key={row.provider} className="flex items-center gap-3 rounded-panel bg-surface-2 px-4 py-2.5">
              <span className="text-sm font-medium text-ink">{row.provider}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted">{row.email}</span>
              <Button
                variant="ghost"
                size="xs"
                disabled={unlink.isPending || rows.length <= 1}
                onClick={() => unlink.mutate({ provider: row.provider as "google" | "facebook" })}
              >
                {t("account.unlink")}
              </Button>
            </li>
          ))
        )}
      </ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {!has("google") ? (
          <GoogleSignInButton
            enabled={Boolean(googleEnabled.data)}
            pending={link.isPending}
            label={t("account.linkGoogle")}
            onCredential={credential => link.mutate({ provider: "google", token: credential })}
          />
        ) : null}
        {!has("facebook") ? (
          <FacebookSignInButton
            enabled={Boolean(facebookEnabled.data)}
            pending={link.isPending}
            label={t("account.linkFacebook")}
            onAccessToken={token => link.mutate({ provider: "facebook", token })}
          />
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-danger mb-0" role="alert">{error}</p>
      ) : null}
    </section>
  );
}
