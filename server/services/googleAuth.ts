/**
 * Xác thực ID token Google (Google Identity Services) bằng endpoint tokeninfo
 * công khai. Chỉ cần CLIENT_ID, không cần client secret phía server.
 */
export const GOOGLE_CLIENT_ID_ENV = "VITE_GOOGLE_CLIENT_ID";

export type GoogleIdentity = {
  subject: string;
  email: string;
  name: string;
  picture?: string;
};

export function configuredGoogleClientId() {
  return process.env[GOOGLE_CLIENT_ID_ENV]?.trim() ?? "";
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity | null> {
  const clientId = configuredGoogleClientId();
  if (!clientId || !idToken || idToken.length > 4096 || /[^A-Za-z0-9._-]/.test(idToken)) return null;

  let response: Response;
  try {
    response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  } catch {
    return null;
  }
  if (!response.ok) return null;

  try {
    const info = (await response.json()) as Record<string, unknown>;
    if (info.aud !== clientId || info.email_verified !== "true") return null;
    const email = typeof info.email === "string" ? info.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return null;
    const subject = typeof info.sub === "string" ? info.sub : "";
    if (!subject) return null;
    return {
      subject,
      email,
      name: typeof info.name === "string" && info.name.trim() ? info.name.trim() : email.split("@")[0],
      picture: typeof info.picture === "string" ? info.picture : undefined,
    };
  } catch {
    return null;
  }
}
