import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

/**
 * Regression test cho A1: máy chủ phải so sánh revision do CLIENT gửi lên.
 *
 * Lỗi thật: router tự đọc `current?.version` rồi truyền lại làm phiên bản
 * mong đợi, nên phép so sánh luôn bằng nhau và client đang giữ bản cũ không
 * bao giờ bị phát hiện. Bản sửa: client gửi `baseVersion` (revision của dòng nó
 * đã đọc) và máy chủ so với revision hiện tại.
 */

vi.mock("./db", () => ({
  findCfopAccountByEmail: vi.fn(),
  findCfopAccountPublicById: vi.fn(),
  markCfopAccountSignedIn: vi.fn(),
  createCfopAccount: vi.fn(),
  createCfopPasswordResetToken: vi.fn(),
  consumeCfopPasswordResetToken: vi.fn(),
  getCfopAccountCloudState: vi.fn(),
  saveCfopAccountCloudState: vi.fn(),
  updateCfopAccountAvatar: vi.fn(),
  updateCfopAccountPassword: vi.fn(),
  updateCfopAccountProfile: vi.fn(),
}));

import { appRouter } from "./routers";
import { getCfopAccountCloudState, saveCfopAccountCloudState } from "./db";

function makeContext() {
  return {
    cfopAccount: { id: 42, email: "cuber@example.com", displayName: "Cuber" },
    user: null,
    req: { headers: {}, socket: { remoteAddress: "203.0.113.9" } },
    res: { setHeader: vi.fn() },
  } as unknown as TrpcContext;
}

const payload = {
  schema: "cfop-account-cloud-state" as const,
  schemaVersion: 2 as const,
  baseVersion: null,
  capturedAt: Date.now(),
  timer: [],
  lastLayer: { study: { records: {}, dailyGoal: 0 }, masteredCaseKeys: [] },
  bldProfile: {} as never,
  bldLearningPath: {} as never,
};

describe("A1: cloud state dùng revision của dòng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("truyền baseVersion của client xuống tầng db", async () => {
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({
      version: 7,
    } as never);
    vi.mocked(saveCfopAccountCloudState).mockResolvedValue({
      version: 8,
    } as never);

    const caller = appRouter.createCaller(makeContext());
    await caller.cfopAccount.cloudState.save({ ...payload, baseVersion: 7 });

    // Quan trọng: số 7 là do CLIENT gửi lên, không phải số máy chủ tự đọc.
    expect(saveCfopAccountCloudState).toHaveBeenCalledWith(
      42,
      expect.anything(),
      7
    );
  });

  it("không tự dùng revision của máy chủ làm phiên bản mong đợi", async () => {
    // Máy chủ đang ở revision 9, client gửi baseVersion 4 (cũ) → máy chủ phải
    // truyền 4 xuống db để db phát hiện xung đột.
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({
      version: 9,
    } as never);
    vi.mocked(saveCfopAccountCloudState).mockResolvedValue({
      version: 10,
    } as never);

    const caller = appRouter.createCaller(makeContext());
    await caller.cfopAccount.cloudState.save({ ...payload, baseVersion: 4 });

    expect(saveCfopAccountCloudState).toHaveBeenCalledWith(
      42,
      expect.anything(),
      4
    );
  });

  it("trả về revision mới sau khi ghi thành công", async () => {
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({
      version: 3,
    } as never);
    vi.mocked(saveCfopAccountCloudState).mockResolvedValue({
      version: 4,
      updatedAt: new Date(1000),
    } as never);

    const caller = appRouter.createCaller(makeContext());
    const result = await caller.cfopAccount.cloudState.save({
      ...payload,
      baseVersion: 3,
    });

    expect(result.revision).toBe(4);
  });

  it("đổi lỗi xung đột của db thành TRPCError CONFLICT", async () => {
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({
      version: 5,
    } as never);
    vi.mocked(saveCfopAccountCloudState).mockRejectedValue(
      Object.assign(new Error("Cloud state revision conflict"), {
        code: "CONFLICT",
        status: 409,
      })
    );

    const caller = appRouter.createCaller(makeContext());
    await expect(
      caller.cfopAccount.cloudState.save({ ...payload, baseVersion: 3 })
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("cloudState.get trả về revision của dòng", async () => {
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({
      version: 11,
      payload: { schema: "cfop-account-cloud-state" },
      updatedAt: new Date(0),
    } as never);

    const caller = appRouter.createCaller(makeContext());
    const result = await caller.cfopAccount.cloudState.get();

    expect(result?.revision).toBe(11);
  });

  it("tab cũ (thiếu baseVersion) nhận thông báo yêu cầu tải lại, không phải lỗi kỹ thuật", async () => {
    // Một tab đã mở từ trước khi triển khai gửi payload không có
    // baseVersion. Nếu coi như revision 0 thì sẽ ghi đè mất dữ liệu của
    // thiết bị khác, nên máy chủ phải từ chối bằng thông báo dễ hiểu.
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({ version: 7 } as never);
    const caller = appRouter.createCaller(makeContext());
    const { baseVersion: _ignored, ...legacy } = payload;

    await expect(
      caller.cfopAccount.cloudState.save(legacy as never)
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message:
        "Ứng dụng đã được cập nhật. Hãy tải lại trang để đồng bộ dữ liệu.",
    });
    // Không được ghi gì cả.
    expect(saveCfopAccountCloudState).not.toHaveBeenCalled();
  });

  it("chấp nhận payload của tab cũ (dùng `version` thay `schemaVersion`)", async () => {
    vi.mocked(getCfopAccountCloudState).mockResolvedValue({ version: 7 } as never);
    vi.mocked(saveCfopAccountCloudState).mockResolvedValue({ version: 8 } as never);
    const caller = appRouter.createCaller(makeContext());

    await caller.cfopAccount.cloudState.save({
      ...payload,
      schemaVersion: undefined,
      version: 2,
    } as never);

    // Payload lưu xuống chỉ dùng tên mới.
    const stored = vi.mocked(saveCfopAccountCloudState).mock.calls[0]?.[1] as
      | Record<string, unknown>
      | undefined;
    expect(stored?.schemaVersion).toBe(2);
    expect(stored?.version).toBeUndefined();
  });
});
