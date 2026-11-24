import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configuredFacebookApp,
  verifyFacebookAccessToken,
} from "./services/facebookAuth";

const APP_ID = "VITE_FACEBOOK_APP_ID";
const SECRET = "FACEBOOK_APP_SECRET";
const saved = { [APP_ID]: process.env[APP_ID], [SECRET]: process.env[SECRET] };

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of [APP_ID, SECRET]) {
    const value = saved[key as typeof APP_ID | typeof SECRET];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const response = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

describe("verifyFacebookAccessToken", () => {
  it("từ chối khi chưa cấu hình app id hoặc secret", async () => {
    delete process.env[APP_ID];
    delete process.env[SECRET];
    expect(configuredFacebookApp()).toEqual({ appId: "", appSecret: "" });
    expect(await verifyFacebookAccessToken("token")).toBeNull();
  });

  it("từ chối token không hợp lệ hoặc sai ứng dụng", async () => {
    process.env[APP_ID] = "app-123";
    process.env[SECRET] = "secret";
    vi.stubGlobal("fetch", vi.fn(async () => response({ data: { is_valid: false } })));
    expect(await verifyFacebookAccessToken("token")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => response({
      data: { is_valid: true, app_id: "other-app", user_id: "1" },
    })));
    expect(await verifyFacebookAccessToken("token")).toBeNull();
  });

  it("trả về danh tính khi token hợp lệ", async () => {
    process.env[APP_ID] = "app-123";
    process.env[SECRET] = "secret";
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      String(url).includes("debug_token")
        ? response({ data: { is_valid: true, app_id: "app-123", user_id: "1" } })
        : response({
            id: "1",
            name: "Minh Tuan",
            email: "USER@FACEBOOK.COM",
            picture: { data: { url: "https://example.com/avatar.png" } },
          })
    ));
    expect(await verifyFacebookAccessToken("token")).toEqual({
      email: "user@facebook.com",
      name: "Minh Tuan",
      picture: "https://example.com/avatar.png",
    });
  });
});
