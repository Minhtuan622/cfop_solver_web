import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

type FbLoginResult = {
  authResponse?: { accessToken?: string } | null;
};

type FacebookSdk = {
  init: (options: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (result: FbLoginResult) => void,
    options: { scope: string },
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const SDK_URL = "https://connect.facebook.net/en_US/sdk.js";
let scriptPromise: Promise<void> | null = null;

function loadFacebookScript(): Promise<void> {
  if (window.FB) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    window.fbAsyncInit = () => resolve();
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => reject(new Error("facebook sdk failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function FacebookSignInButton({
  enabled,
  pending,
  onAccessToken,
  label,
}: {
  enabled: boolean;
  pending: boolean;
  onAccessToken: (accessToken: string) => void;
  label?: string;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID ?? "";
  const ready = enabled && Boolean(appId);

  const start = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      await loadFacebookScript();
      window.FB!.init({ appId, cookie: false, xfbml: false, version: "v19.0" });
      window.FB!.login(result => {
        const token = result.authResponse?.accessToken;
        if (token) onAccessToken(token);
        else setLoading(false);
      }, { scope: "email" });
    } catch {
      setLoading(false);
    }
  }, [appId, onAccessToken, ready]);

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="soft"
        size="md"
        disabled={!ready || pending || loading}
        className="w-full"
        onClick={() => void start()}
      >
        {label ?? t("account.facebookSignIn")}
      </Button>
      {!ready ? (
        <p className="mt-2 mb-0 text-xs text-muted">{t("account.facebookUnconfigured")}</p>
      ) : null}
    </div>
  );
}
