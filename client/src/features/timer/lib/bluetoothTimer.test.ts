import { describe, expect, it, vi } from "vitest";
import {
  BluetoothTimerError,
  connectGanTimer,
  isWebBluetoothSupported,
  mapBluetoothError,
} from "./bluetoothTimer";

vi.mock("cubing/bluetooth", () => ({
  connectSmartTimer: vi.fn(async () => makeFakeTimer()),
}));

function makeFakeTimer() {
  return {
    name: () => "GAN Timer",
    getTime: async () => 12_340,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe("isWebBluetoothSupported", () => {
  it("is false when navigator.bluetooth is missing", () => {
    const original = Object.getOwnPropertyDescriptor(
      window.navigator,
      "bluetooth",
    );
    // jsdom has no bluetooth by default
    expect(isWebBluetoothSupported()).toBe(false);
    if (original) Object.defineProperty(window.navigator, "bluetooth", original);
  });

  it("is true when bluetooth.requestDevice exists", () => {
    Object.defineProperty(window.navigator, "bluetooth", {
      value: { requestDevice: vi.fn() },
      configurable: true,
    });
    expect(isWebBluetoothSupported()).toBe(true);
    delete (window.navigator as { bluetooth?: unknown }).bluetooth;
  });
});

describe("mapBluetoothError", () => {
  it("maps known DOMException names to stable keys", () => {
    expect(mapBluetoothError({ name: "NotFoundError" }).key).toBe("cancelled");
    expect(mapBluetoothError({ name: "AbortError" }).key).toBe("cancelled");
    expect(mapBluetoothError({ name: "NotAllowedError" }).key).toBe("denied");
    expect(mapBluetoothError({ name: "SecurityError" }).key).toBe("denied");
    expect(mapBluetoothError({ name: "NotSupportedError" }).key).toBe(
      "unavailable",
    );
    expect(mapBluetoothError({ name: "TypeError" }).key).toBe("unavailable");
    expect(mapBluetoothError({ name: "NetworkError" }).key).toBe(
      "unsupportedDevice",
    );
    expect(mapBluetoothError({ name: "SomethingElse" }).key).toBe("failed");
    expect(mapBluetoothError(null).key).toBe("failed");
  });
});

describe("connectGanTimer", () => {
  it("throws 'unavailable' without Web Bluetooth", async () => {
    delete (window.navigator as { bluetooth?: unknown }).bluetooth;
    await expect(connectGanTimer()).rejects.toMatchObject({
      key: "unavailable",
    });
  });

  it("returns a timer handle when pairing succeeds", async () => {
    Object.defineProperty(window.navigator, "bluetooth", {
      value: { requestDevice: vi.fn() },
      configurable: true,
    });
    const timer = await connectGanTimer();
    expect(timer.name()).toBe("GAN Timer");
    expect(await timer.getTime()).toBe(12_340);
    delete (window.navigator as { bluetooth?: unknown }).bluetooth;
  });

  it("maps a cancellation from cubing to the 'cancelled' key", async () => {
    Object.defineProperty(window.navigator, "bluetooth", {
      value: { requestDevice: vi.fn() },
      configurable: true,
    });
    const mod = await import("cubing/bluetooth");
    vi.mocked(mod.connectSmartTimer).mockRejectedValueOnce({
      name: "NotFoundError",
    });
    await expect(connectGanTimer()).rejects.toMatchObject({
      key: "cancelled",
    });
    delete (window.navigator as { bluetooth?: unknown }).bluetooth;
  });

  it("exposes the BluetoothTimerError type for the UI", () => {
    expect(new BluetoothTimerError("denied").key).toBe("denied");
    expect(new BluetoothTimerError("denied").name).toBe("BluetoothTimerError");
  });
});
