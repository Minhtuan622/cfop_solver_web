import { serverMessageKeys } from "@shared/serverMessages";
import type { Translate } from "@/lib/i18n";

function httpStatus(error: unknown): number | undefined {
  const status = (error as { data?: { httpStatus?: unknown } } | null)?.data?.httpStatus;
  return typeof status === "number" ? status : undefined;
}

function trpcCode(error: unknown): string | undefined {
  const code = (error as { data?: { code?: unknown } } | null)?.data?.code;
  return typeof code === "string" ? code : undefined;
}

function validationMessage(message: string): string | null {
  try {
    const payload: unknown = JSON.parse(message);
    const issues = Array.isArray(payload) ? payload : [];
    const first = issues.find(
      (issue): issue is { message?: unknown } =>
        typeof issue === "object" && issue !== null,
    );
    const wording = first?.message;
    return typeof wording === "string" && wording.trim() ? wording : null;
  } catch {
    return null;
  }
}

export function translateServerText(text: string, t: Translate): string | null {
  const exact = serverMessageKeys[text];
  if (exact) return t(exact);
  let prefix = "";
  let key = "";
  for (const [known, knownKey] of Object.entries(serverMessageKeys)) {
    if (text.startsWith(known) && known.length > prefix.length) {
      prefix = known;
      key = knownKey;
    }
  }
  if (!key) return null;
  const tail = text.slice(prefix.length).trim();
  if (!tail) return t(key);
  return `${t(key)} ${translateServerText(tail, t) ?? tail}`;
}

export function errorMessage(error: unknown, t: Translate, known?: Record<string, string>) {
  if (!(error instanceof Error)) return t("common.error.unknown");
  const status = httpStatus(error);
  if (status !== undefined && status >= 500) return t("common.error.server");
  const code = trpcCode(error);
  if (code && known?.[code]) return t(known[code]);
  const validation = validationMessage(error.message);
  const wording = translateServerText(validation ?? error.message, t);
  return wording ?? t("common.error.unknown");
}
