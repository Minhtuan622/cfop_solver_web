import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configuredGoogleClientId,
  verifyGoogleIdToken,
} from "./services/googleAuth";

const ENV = "VITE_GOOGLE_CLIENT_ID";
const original = process.env[ENV];

afterEach(() => {
  vi.unstubAllGlobals();
  if (original === undefined) delete process.env[ENV];
  else process.env[ENV] = original;
});

const response = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

describe("verifyGoogleIdToken", () => {
  it("không xác thực được nếu chưa cấu hình client id", async () => {
    delete process.env[ENV];
    expect(configuredGoogleClientId()).toBe("");
    expect(await verifyGoogleIdToken("abc")).toBeNull();
  });

  it("từ chối token sai audience hoặc email chưa xác thực", async () => {
    process.env[ENV] = "client-123";
    vi.stubGlobal("fetch", vi.fn(async () => response({
      aud: "another-client",
      email_verified: "true",
      email: "user@gmail.com",
      name: "User",
    })));
    expect(await verifyGoogleIdToken("abc.def-ghi")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => response({
      aud: "client-123",
      email_verified: "false",
      email: "user@gmail.com",
    })));
    expect(await verifyGoogleIdToken("abc.def-ghi")).toBeNull();
  });

  it("trả về danh tính khi token hợp lệ", async () => {
    process.env[ENV] = "client-123";
    vi.stubGlobal("fetch", vi.fn(async () => response({
      aud: "client-123",
      email_verified: "true",
      email: "USER@GMAIL.COM",
      sub: "google-123",
      name: "Minh Tuan",
      picture: "https://example.com/avatar.png",
    })));
    expect(await verifyGoogleIdToken("abc.def-ghi")).toEqual({
      subject: "google-123",
      email: "user@gmail.com",
      name: "Minh Tuan",
      picture: "https://example.com/avatar.png",
    });
  });
});
