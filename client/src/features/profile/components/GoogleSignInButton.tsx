import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

type Gis = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      prompt: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: Gis;
  }
}

const SCRIPT_URL = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google script failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function GoogleSignInButton({
  enabled,
  pending,
  onCredential,
  label,
}: {
  enabled: boolean;
  pending: boolean;
  onCredential: (credential: string) => void;
  label?: string;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
  const ready = enabled && Boolean(clientId);

  const start = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      await loadGoogleScript();
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: response => {
          if (response.credential) onCredential(response.credential);
          setLoading(false);
        },
      });
      window.google!.accounts.id.prompt();
    } catch {
      setLoading(false);
    }
  }, [clientId, onCredential, ready]);

  return (
    <div className="mt-5">
      <div className="mb-4 h-px w-full bg-surface-3" aria-hidden="true" />
      <Button
        type="button"
        variant="soft"
        size="md"
        disabled={!ready || pending || loading}
        className="w-full"
        onClick={() => void start()}
      >
        {label ?? t("account.googleSignIn")}
      </Button>
      {!ready ? (
        <p className="mt-2 mb-0 text-xs text-muted">{t("account.googleUnconfigured")}</p>
      ) : null}
    </div>
  );
}
