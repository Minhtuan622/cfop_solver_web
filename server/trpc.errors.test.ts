import { describe, expect, it, vi, afterEach } from "vitest";
import { getErrorShape, getTRPCErrorFromUnknown, TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import { router as buildRouter, publicProcedure, UNEXPECTED_ERROR_MESSAGE, VALIDATION_ERROR_PREFIX } from "./_core/trpc";
import { credentialsInput } from "./routers/inputs";
import { serverMessageKeys } from "../shared/serverMessages";

/**
 * What the HTTP layer of tRPC hands out for a failed call.
 *
 * A resolver that throws becomes `getTRPCErrorFromUnknown(cause)`, and that
 * error is shaped by the router's own config — the exact pair of hooks tRPC
 * runs on every request. Feeding them here exercises the formatter configured
 * in `server/_core/trpc.ts`.
 */
function shapeOf(path: string, cause: unknown) {
  return getErrorShape({
    path,
    error: getTRPCErrorFromUnknown(cause),
    config: appRouter._def._config,
  });
}

/** A database failure exactly as drizzle reports it, SQL and values included. */
const SQL_LEAK = "Failed query: select `id`, `email` from `cfop_accounts` where `email` = ?; params: victim@example.com,1";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the tRPC error formatter", () => {
  it("hides the SQL and the values of an unplanned failure", () => {
    const shape = shapeOf("cfopAccount.me", new Error(SQL_LEAK));
    const body = JSON.stringify(shape);

    expect(shape.message).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(body).not.toContain("Failed query");
    expect(body).not.toContain("params");
    expect(body).not.toContain("cfop_accounts");
    expect(body).not.toContain("victim@example.com");
  });

  it("keeps no stack in the body but logs the detail on the server", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const shape = shapeOf("cfopAccount.me", new Error(SQL_LEAK));

    expect(shape.data.stack).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.map((call) => call.join(" ")).join("\n")).toContain("Failed query");
  });

  it("writes a short line for a failed schema check instead of a raw array", () => {
    const schema = credentialsInput.safeParse({ email: "not-an-email", password: "x".repeat(12) });
    expect(schema.success).toBe(false);
    // The parser middleware of tRPC wraps the failed check in a BAD_REQUEST
    // whose cause is the zod error — this is how it travels to the formatter.
    const shape = shapeOf("cfopAccount.login", new TRPCError({ code: "BAD_REQUEST", cause: schema.success ? undefined : schema.error }));

    expect(shape.message.startsWith(VALIDATION_ERROR_PREFIX)).toBe(true);
    expect(shape.message).toContain("Email không hợp lệ.");
    expect(() => JSON.parse(shape.message)).toThrow();
  });

  it("keeps a planned sentence of the server as it was written", () => {
    const unauthorized = shapeOf("cfopAccount.login", new TRPCError({ code: "UNAUTHORIZED", message: "Email hoặc mật khẩu không đúng." }));
    expect(unauthorized.message).toBe("Email hoặc mật khẩu không đúng.");

    const plannedInternal = shapeOf("wca.competitions", new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xử lý dữ liệu WCA." }));
    expect(plannedInternal.message).toBe("Không thể xử lý dữ liệu WCA.");
  });

  it("lists every sentence the formatter writes in the catalogue", () => {
    expect(serverMessageKeys[UNEXPECTED_ERROR_MESSAGE]).toBe("common.error.internal");
    expect(serverMessageKeys[VALIDATION_ERROR_PREFIX]).toBe("common.error.invalidData");
  });
});
