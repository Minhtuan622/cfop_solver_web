/**
 * The wording shown when a call to the server fails.
 *
 * The server writes in Vietnamese, so a failed action used to show a sentence
 * the visitor could not read. Every sentence the server can send is listed in
 * `shared/serverMessages.ts` and points at the bilingual dictionary, which lets
 * the interface speak the language of the visitor.
 */
import { serverMessageKeys } from "@shared/serverMessages";
import type { Translate } from "@/lib/i18n";

/** The HTTP status a tRPC call failed with, when the failure came from the server. */
function httpStatus(error: unknown): number | undefined {
  const status = (error as { data?: { httpStatus?: unknown } } | null)?.data?.httpStatus;
  return typeof status === "number" ? status : undefined;
}

/** The tRPC error code a failed call came back with, such as `CONFLICT`. */
function trpcCode(error: unknown): string | undefined {
  const code = (error as { data?: { code?: unknown } } | null)?.data?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * The wording of a schema validation failure.
 *
 * The server answers with the whole zod payload as a JSON string, which is
 * never meant for a reader. The first field message is the one the visitor
 * needs, and the generic wording is the fallback when the payload carries
 * none.
 */
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

/**
 * A sentence the server wrote, in the language of the interface.
 *
 * The message is looked up in the shared catalogue. A sentence that carries a
 * dynamic tail — a reason typed by a moderator — matches the longest known
 * prefix, and the tail keeps its own wording because it is text a person
 * wrote. `null` means the sentence is not one the server sends.
 */
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

/**
 * The message shown under a failed action.
 *
 * A 4xx keeps the wording of the server, translated into the language of the
 * interface. A 5xx is a server-side failure whose message can carry SQL or
 * stack details, so it never reaches the interface, and neither does a raw
 * validation payload.
 */
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
