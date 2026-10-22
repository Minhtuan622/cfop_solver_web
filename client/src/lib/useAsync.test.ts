import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsync } from "./useAsync";

describe("useAsync", () => {
  it("bật pending trong lúc promise đang chạy và trả về kết quả", async () => {
    let resolve: (value: string) => void = () => {};
    const promise = new Promise<string>(r => {
      resolve = r;
    });
    const { result } = renderHook(() => useAsync(async () => promise));

    expect(result.current.pending).toBe(false);

    let runPromise: Promise<string | undefined> = Promise.resolve(undefined);
    act(() => {
      runPromise = result.current.run();
    });

    await waitFor(() => expect(result.current.pending).toBe(true));
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolve("xong");
      await runPromise;
    });

    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it("ghi lại error khi action bị reject", async () => {
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw new Error("hỏng rồi");
      }),
    );

    await act(async () => {
      await result.current.run();
    });

    await waitFor(() => expect(result.current.error).toBe("hỏng rồi"));
    expect(result.current.pending).toBe(false);
  });

  it("trả về undefined khi action thất bại", async () => {
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw new Error("x");
      }),
    );

    let outcome: string | undefined = "chưa chạy";
    await act(async () => {
      outcome = await result.current.run();
    });

    expect(outcome).toBeUndefined();
  });
});
