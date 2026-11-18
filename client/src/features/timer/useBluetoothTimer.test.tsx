// @vitest-environment jsdom
import { cleanup, renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBluetoothTimer } from "./useBluetoothTimer";

afterEach(() => cleanup());

vi.mock("cubing/bluetooth", () => ({
  connectSmartTimer: vi.fn(async () => makeFakeTimer()),
}));

function makeFakeTimer() {
  const target = new EventTarget();
  return Object.assign(target, {
    name: () => "GAN Timer Fake",
    getTime: async () => 0,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    disconnect: vi.fn(),
  });
}

const setBluetooth = (value?: { requestDevice: () => unknown }) => {
  if (value) {
    Object.defineProperty(window.navigator, "bluetooth", {
      value,
      configurable: true,
    });
  } else {
    delete (window.navigator as { bluetooth?: unknown }).bluetooth;
  }
};

beforeEach(() => {
  setBluetooth(undefined);
  vi.clearAllMocks();
});

describe("useBluetoothTimer", () => {
  it("starts as unsupported when Web Bluetooth is unavailable", () => {
    const { result } = renderHook(() => useBluetoothTimer());
    expect(result.current.status).toBe("unsupported");
    expect(result.current.timer).toBeNull();
  });

  it("connects, reports the device, disconnects cleanly", async () => {
    setBluetooth({ requestDevice: vi.fn() });
    const { result } = renderHook(() => useBluetoothTimer());
    expect(result.current.status).toBe("idle");

    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status).toBe("connected");
    expect(result.current.timer).not.toBeNull();
    expect(result.current.deviceName).toBe("GAN Timer Fake");

    act(() => result.current.disconnect());
    expect(result.current.status).toBe("idle");
    expect(result.current.timer).toBeNull();
    expect(result.current.deviceName).toBeNull();
  });

  it("surfaces a chooser cancellation as a stable error key", async () => {
    setBluetooth({ requestDevice: vi.fn() });
    const mod = await import("cubing/bluetooth");
    vi.mocked(mod.connectSmartTimer).mockRejectedValueOnce({
      name: "NotFoundError",
    });
    const { result } = renderHook(() => useBluetoothTimer());
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status).toBe("error");
    expect(result.current.errorKey).toBe("cancelled");
    expect(result.current.timer).toBeNull();
  });

  it("tears down a timer that finishes pairing after unmount", async () => {
    setBluetooth({ requestDevice: vi.fn() });
    const mod = await import("cubing/bluetooth");
    const fake = makeFakeTimer();
    let resolveConnect!: (value: unknown) => void;
    vi.mocked(mod.connectSmartTimer).mockReturnValueOnce(
      new Promise(resolve => {
        resolveConnect = resolve;
      }) as unknown as ReturnType<typeof mod.connectSmartTimer>,
    );
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useBluetoothTimer());

    let connectPromise!: Promise<void>;
    act(() => {
      connectPromise = result.current.connect();
    });
    unmount();
    await act(async () => {
      resolveConnect(fake);
      await connectPromise;
    });
    expect(fake.stopPolling).toHaveBeenCalledTimes(1);
    expect(fake.disconnect).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("reacts to a device-initiated disconnect", async () => {
    setBluetooth({ requestDevice: vi.fn() });
    const { result } = renderHook(() => useBluetoothTimer());
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.status).toBe("connected");

    const timer = result.current.timer;
    act(() => {
      (timer as unknown as EventTarget | null)?.dispatchEvent(
        new CustomEvent("disconnect"),
      );
    });
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.lostConnection).toBe(true);
    expect(result.current.timer).toBeNull();
  });
});
