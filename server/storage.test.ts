import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { accountRouter } from "./routers/account";
import type { TrpcContext } from "./_core/context";

vi.mock("./services/storage", () => ({
  storagePut: vi.fn(),
  isStorageEnabled: vi.fn(() => false),
}));

import { storagePut, isStorageEnabled } from "./services/storage";

const baseCtx = {
  cfopAccount: {
    id: 1,
    email: "a@b.com",
    displayName: "A",
    bio: "",
    avatarUrl: "",
    goalMs: null,
    createdAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
} as unknown as TrpcContext;

describe("B5: avatar storage friendly errors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("real storagePut throws PRECONDITION_FAILED without env var names", async () => {
    const { storagePut: realStoragePut } = await vi.importActual("./services/storage");

    await expect(
      realStoragePut("cfop-accounts/1/avatar.png", Buffer.from("test"), "image/png"),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });

    try {
      await realStoragePut("cfop-accounts/1/avatar.png", Buffer.from("test"), "image/png");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain("BUILT_IN_FORGE_API_URL");
      expect(message).not.toContain("BUILT_IN_FORGE_API_KEY");
      expect(message).not.toContain("Storage config missing");
      expect(message).toContain("chưa được cấu hình");
    }
  });

  it("uploadAvatar returns PRECONDITION_FAILED with friendly message when storage not configured", async () => {
    vi.mocked(storagePut).mockRejectedValueOnce(
      Object.assign(
        new Error("Tính năng tải ảnh chưa được cấu hình trên máy chủ."),
        { code: "PRECONDITION_FAILED" },
      ),
    );

    const caller = accountRouter.createCaller(baseCtx);

    try {
      await caller.uploadAvatar({
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        contentType: "image/png",
      });
      expect(true).toBe(false); // should not reach here
    } catch (error) {
      const trpcErr = error as TRPCError;
      expect(trpcErr.code).toBe("PRECONDITION_FAILED");
      const message = trpcErr.message as string;
      expect(message).not.toContain("BUILT_IN_FORGE_API_URL");
      expect(message).not.toContain("BUILT_IN_FORGE_API_KEY");
      expect(message).not.toContain("Storage config missing");
    }
  });

  it("storageStatus query returns enabled flag", async () => {
    vi.mocked(isStorageEnabled).mockReturnValue(false);
    const caller = accountRouter.createCaller({
      ...baseCtx,
      cfopAccount: null,
    } as unknown as TrpcContext);

    const result = await caller.storageStatus();
    expect(result).toEqual({ enabled: false });
  });

  it("storageStatus returns enabled true when storage configured", async () => {
    vi.mocked(isStorageEnabled).mockReturnValue(true);
    const caller = accountRouter.createCaller({
      ...baseCtx,
      cfopAccount: null,
    } as unknown as TrpcContext);

    const result = await caller.storageStatus();
    expect(result).toEqual({ enabled: true });
  });
});
