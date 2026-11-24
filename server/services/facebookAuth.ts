/**
 * Xác thực access token Facebook Login bằng Graph API debug_token. Cần APP_ID
 * (public, gửi cho client) và APP_SECRET (chỉ dùng ở server) để chặn token từ
 * ứng dụng khác.
 */
export const FACEBOOK_APP_ID_ENV = "VITE_FACEBOOK_APP_ID";
export const FACEBOOK_APP_SECRET_ENV = "FACEBOOK_APP_SECRET";

export type FacebookIdentity = {
  email: string;
  name: string;
  picture?: string;
};

export function configuredFacebookApp() {
  return {
    appId: process.env[FACEBOOK_APP_ID_ENV]?.trim() ?? "",
    appSecret: process.env[FACEBOOK_APP_SECRET_ENV]?.trim() ?? "",
  };
}

export async function verifyFacebookAccessToken(accessToken: string): Promise<FacebookIdentity | null> {
  const { appId, appSecret } = configuredFacebookApp();
  if (!appId || !appSecret || !accessToken || accessToken.length > 2048 || /[^A-Za-z0-9._~-]/.test(accessToken)) return null;

  try {
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
    const debugResponse = await fetch(debugUrl);
    if (!debugResponse.ok) return null;
    const debug = (await debugResponse.json()) as { data?: { is_valid?: boolean; app_id?: string; user_id?: string } };
    if (!debug.data?.is_valid || debug.data.app_id !== appId || !debug.data.user_id) return null;

    const meUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`;
    const meResponse = await fetch(meUrl);
    if (!meResponse.ok) return null;
    const me = (await meResponse.json()) as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };
    const email = typeof me.email === "string" ? me.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return null;
    const picture = me.picture?.data?.url;
    return {
      email,
      name: typeof me.name === "string" && me.name.trim() ? me.name.trim() : email.split("@")[0],
      picture: typeof picture === "string" ? picture : undefined,
    };
  } catch {
    return null;
  }
}
