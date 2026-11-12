import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./services/cfopAccountAuth", async () => {
  const actual = await vi.importActual<
    typeof import("./services/cfopAccountAuth")
  >("./services/cfopAccountAuth");
  return {
    ...actual,
    verifyPassword: vi.fn(
      async (password: string, hash: string) =>
        hash === "valid" && password === "correct-horse-battery"
    ),
    createCfopAccountBrowserSession: vi.fn(async () => undefined),
    clearCfopAccountBrowserSession: vi.fn(async () => undefined),
  };
});

vi.mock("./db", () => ({
  findCfopAccountByEmail: vi.fn(),
  createCfopAccount: vi.fn(),
  findCfopAccountPublicById: vi.fn(),
  markCfopAccountSignedIn: vi.fn(),
  createCfopPasswordResetToken: vi.fn(),
  consumeCfopPasswordResetToken: vi.fn(),
  getCfopAccountCloudState: vi.fn(),
  saveCfopAccountCloudState: vi.fn(),
  updateCfopAccountAvatar: vi.fn(),
  updateCfopAccountPassword: vi.fn(),
  updateCfopAccountProfile: vi.fn(),
}));

vi.mock("./services/cfopPasswordResetMail", () => ({
  passwordResetEmailConfigured: vi.fn(() => false),
  sendCfopPasswordResetEmail: vi.fn(async () => undefined),
}));

import { appRouter } from "./routers";
import { authRateLimiter } from "./_core/trpc";
import {
  findCfopAccountByEmail,
  findCfopAccountPublicById,
  markCfopAccountSignedIn,
} from "./db";

function makeContext(address = "203.0.113.7") {
  const headers: Record<string, string> = { "x-forwarded-for": address };
  return {
    cfopAccount: null,
    user: null,
    // The proxy sits on a private address, so the forwarded header is trusted.
    req: { headers, socket: { remoteAddress: "10.0.0.1" } },
    res: { setHeader: vi.fn() },
  } as unknown as TrpcContext;
}

/** Reads the last value a header was set to, since the middleware may set it twice. */
function headerOf(context: TrpcContext, name: string) {
  const setHeader = (
    context.res as unknown as { setHeader: ReturnType<typeof vi.fn> }
  ).setHeader;
  const calls = setHeader.mock.calls.filter(([key]) => key === name);
  return calls.length ? calls[calls.length - 1][1] : undefined;
}

const credentials = {
  email: "cuber@example.com",
  password: "correct-horse-battery",
};

describe("auth rate limiting", () => {
  // Kịch bản deploy thật: máy chủ đứng sau reverse proxy nên tin
  // X-Forwarded-For (TRUST_PROXY=1). Khi chưa bật, header do client tự viết
  // không được tách hạn mức.
  const originalTrustProxy = process.env.TRUST_PROXY;

  beforeAll(() => {
    process.env.TRUST_PROXY = "1";
  });

  afterAll(() => {
    if (originalTrustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = originalTrustProxy;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authRateLimiter.reset();
    vi.mocked(findCfopAccountByEmail).mockResolvedValue(null);
    vi.mocked(findCfopAccountPublicById).mockResolvedValue({
      id: 1,
      email: credentials.email,
      displayName: "Cuber",
      bio: "",
      avatarUrl: "",
      goalMs: null,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    });
    vi.mocked(markCfopAccountSignedIn).mockResolvedValue(undefined as never);
  });

  it("chặn đăng nhập quá số lần cho cùng một email", async () => {
    const caller = appRouter.createCaller(makeContext());
    const input = { email: credentials.email, password: "wrong-password-x" };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(caller.cfopAccount.login(input)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }

    await expect(caller.cfopAccount.login(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("không chặn tài khoản khác chỉ vì chung một địa chỉ", async () => {
    const caller = appRouter.createCaller(makeContext());
    const input = { email: credentials.email, password: "wrong-password-x" };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(caller.cfopAccount.login(input)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
    await expect(caller.cfopAccount.login(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

    const other = appRouter.createCaller(makeContext());
    await expect(
      other.cfopAccount.login({
        email: "other@example.com",
        password: "wrong-password-x",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("đếm giới hạn đăng ký riêng cho từng email", async () => {
    vi.mocked(findCfopAccountByEmail).mockResolvedValue({
      id: 1,
      email: credentials.email,
      displayName: "Cuber",
      bio: "",
      avatarUrl: "",
      goalMs: null,
      passwordHash: "valid",
      createdAt: new Date(),
      lastSignedIn: new Date(),
    } as never);

    const caller = appRouter.createCaller(makeContext());
    const input = {
      email: credentials.email,
      password: "correct-horse-battery",
      displayName: "Cuber",
    };

    // The account bucket allows 5 registrations for this email.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(caller.cfopAccount.register(input)).rejects.toMatchObject({
        code: "CONFLICT",
      });
    }

    await expect(caller.cfopAccount.register(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("giới hạn yêu cầu quên mật khẩu để chặn spam email", async () => {
    const caller = appRouter.createCaller(makeContext());

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        caller.cfopAccount.requestPasswordReset({ email: credentials.email })
      ).resolves.toMatchObject({ success: true });
    }

    await expect(
      caller.cfopAccount.requestPasswordReset({ email: credentials.email })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("đặt lại mật khẩu cũng bị giới hạn", async () => {
    const caller = appRouter.createCaller(makeContext());
    const input = {
      token: "a".repeat(40),
      newPassword: "correct-horse-battery",
    };

    // A reset carries no email, so only the address bucket applies: 20 attempts.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await expect(
        caller.cfopAccount.resetPassword(input)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }

    await expect(caller.cfopAccount.resetPassword(input)).rejects.toMatchObject(
      { code: "TOO_MANY_REQUESTS" }
    );
  });

  it("vẫn chặn khi kẻ tấn công đổi địa chỉ nhưng nhắm cùng một email", async () => {
    const input = { email: credentials.email, password: "wrong-password-x" };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const caller = appRouter.createCaller(
        makeContext(`198.51.100.${attempt}`)
      );
      await expect(caller.cfopAccount.login(input)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }

    const caller = appRouter.createCaller(makeContext("198.51.100.99"));
    await expect(caller.cfopAccount.login(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("cho phép nhiều tài khoản khác nhau từ cùng một địa chỉ", async () => {
    const caller = appRouter.createCaller(makeContext());

    for (let account = 0; account < 15; account += 1) {
      const email = `cuber-${account}@example.com`;
      vi.mocked(findCfopAccountByEmail).mockResolvedValue({
        id: account + 1,
        email,
        displayName: "Cuber",
        bio: "",
        avatarUrl: "",
        goalMs: null,
        passwordHash: "valid",
        createdAt: new Date(),
        lastSignedIn: new Date(),
      } as never);
      vi.mocked(findCfopAccountPublicById).mockImplementation(
        async id =>
          ({
            id,
            email,
            displayName: "Cuber",
            bio: "",
            avatarUrl: "",
            goalMs: null,
            createdAt: new Date(),
            lastSignedIn: new Date(),
          }) as never
      );

      await expect(
        caller.cfopAccount.login({ email, password: "correct-horse-battery" })
      ).resolves.toMatchObject({ id: account + 1 });
    }
  });

  it("báo header theo bucket chặt nhất chứ không phải bucket địa chỉ", async () => {
    const context = makeContext();
    const caller = appRouter.createCaller(context);

    await expect(
      caller.cfopAccount.login({
        email: credentials.email,
        password: "wrong-password-x",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    // The account bucket allows 10 attempts, the address bucket 60, so the
    // account budget is the one a caller runs out of first.
    expect(headerOf(context, "X-RateLimit-Limit")).toBe("10");
    expect(headerOf(context, "X-RateLimit-Remaining")).toBe("9");
  });

  it("không tính đăng nhập thành công vào ngân sách đăng ký", async () => {
    vi.mocked(findCfopAccountByEmail).mockResolvedValue({
      id: 1,
      email: credentials.email,
      displayName: "Cuber",
      bio: "",
      avatarUrl: "",
      goalMs: null,
      passwordHash: "valid",
      createdAt: new Date(),
      lastSignedIn: new Date(),
    } as never);
    vi.mocked(findCfopAccountPublicById).mockResolvedValue({
      id: 1,
      email: credentials.email,
      displayName: "Cuber",
      bio: "",
      avatarUrl: "",
      goalMs: null,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(makeContext());
    await expect(caller.cfopAccount.login(credentials)).resolves.toMatchObject({
      email: credentials.email,
    });
  });
});
