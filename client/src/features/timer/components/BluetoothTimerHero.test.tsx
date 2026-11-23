// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BluetoothTimerHero } from "./BluetoothTimerHero";
import type { GanTimerHandle } from "../lib/bluetoothTimer";

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) =>
        translate("vi", key, params),
    }),
  };
});

afterEach(() => cleanup());

class FakeGanTimer extends EventTarget implements GanTimerHandle {
  name() {
    return "GAN Timer Fake";
  }
  async getTime() {
    return 0;
  }
  startPolling() {}
  stopPolling() {}
  disconnect() {}
}

const emit = (timer: FakeGanTimer, type: string, detail?: unknown) =>
  timer.dispatchEvent(new CustomEvent(type, { detail }));

describe("BluetoothTimerHero", () => {
  it("follows start → update → stop and reports the solve exactly once", () => {
    const timer = new FakeGanTimer();
    const onSolveComplete = vi.fn();
    render(
      <BluetoothTimerHero
        timer={timer}
        deviceName="GAN Timer Fake"
        onDisconnect={() => undefined}
        onSolveComplete={onSolveComplete}
      />,
    );

    // idle: ready text and zero readout
    expect(screen.getByRole("status")).toHaveTextContent("00:00.00");

    act(() => emit(timer, "start"));
    expect(screen.getByRole("status")).toHaveTextContent(/đang tính giờ/i);

    act(() => emit(timer, "update", { currentTime: 12_340 }));
    // The app's readout truncates to hundredths (12340ms → 00:12.34).
    expect(screen.getByRole("status")).toHaveTextContent("00:12.34");

    act(() => emit(timer, "update", { currentTime: 20_000 }));
    expect(screen.getByRole("status")).toHaveTextContent("00:20.00");

    act(() => emit(timer, "stop", { currentTime: 20_000 }));
    expect(onSolveComplete).toHaveBeenCalledTimes(1);
    expect(onSolveComplete).toHaveBeenCalledWith(20_000);
    expect(screen.getByRole("status")).toHaveTextContent("00:20.00");
    expect(screen.getByRole("status")).toHaveTextContent(/đã xong/i);

    // A reset returns to the idle readout.
    act(() => emit(timer, "reset"));
    expect(screen.getByRole("status")).toHaveTextContent("00:00.00");
    expect(onSolveComplete).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed events instead of crashing", () => {
    const timer = new FakeGanTimer();
    const onSolveComplete = vi.fn();
    render(
      <BluetoothTimerHero
        timer={timer}
        deviceName="GAN Timer Fake"
        onDisconnect={() => undefined}
        onSolveComplete={onSolveComplete}
      />,
    );
    act(() => emit(timer, "stop", undefined));
    act(() => emit(timer, "update", { currentTime: Number.NaN }));
    expect(onSolveComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("00:00.00");
  });

  it("disconnect button fires onDisconnect", () => {
    const timer = new FakeGanTimer();
    const onDisconnect = vi.fn();
    render(
      <BluetoothTimerHero
        timer={timer}
        deviceName="GAN Timer Fake"
        onDisconnect={onDisconnect}
        onSolveComplete={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /ngắt kết nối/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
