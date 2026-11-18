// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SmartCubeHero } from "./SmartCubeHero";
import type { SmartCube } from "../useSmartCube";
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

const SOLVED =
  "U".repeat(9) + "R".repeat(9) + "F".repeat(9) + "D".repeat(9) + "L".repeat(9) + "B".repeat(9);

function makeCube(overrides: Partial<SmartCube> = {}): SmartCube {
  return {
    status: "connected",
    cubeName: "FakeCube 9000",
    batteryPercent: 87,
    errorKey: null,
    phase: "idle",
    state: SOLVED,
    moves: [],
    tps: null,
    movesCount: 0,
    connect: async () => undefined,
    disconnect: () => undefined,
    ...overrides,
  };
}

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

afterEach(() => cleanup());

describe("SmartCubeHero", () => {
  it("renders the net, name, battery and a zeroed readout", () => {
    render(<SmartCubeHero smartCube={makeCube()} onDisconnect={() => undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("00:00.00");
    expect(screen.getByRole("status")).toHaveTextContent("FakeCube 9000");
    expect(screen.getByRole("status")).toHaveTextContent("87%");
    expect(screen.getByRole("button", { name: /ngắt kết nối/i })).toBeInTheDocument();
  });

  it("shows the move counter and TPS while solving", () => {
    render(
      <SmartCubeHero
        smartCube={makeCube({ phase: "solving", moves: ["R", "U"], movesCount: 2, tps: 1.5 })}
        onDisconnect={() => undefined}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/2/);
    expect(screen.getByRole("status")).toHaveTextContent("1.50 TPS");
  });

  it("mirrors the connected GAN Timer's live readout", () => {
    const timer = new FakeGanTimer();
    render(
      <SmartCubeHero
        smartCube={makeCube({ phase: "solving" })}
        onDisconnect={() => undefined}
        externalTimer={{ deviceName: "GAN Timer Fake", timer }}
      />,
    );
    act(() => emit(timer, "update", { currentTime: 12_340 }));
    expect(screen.getByRole("status")).toHaveTextContent("00:12.33");
    expect(screen.getByRole("status")).toHaveTextContent("GAN TIMER · GAN Timer Fake");
  });

  it("disconnect button fires onDisconnect", () => {
    const onDisconnect = vi.fn();
    render(<SmartCubeHero smartCube={makeCube()} onDisconnect={onDisconnect} />);
    fireEvent.click(screen.getByRole("button", { name: /ngắt kết nối/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
