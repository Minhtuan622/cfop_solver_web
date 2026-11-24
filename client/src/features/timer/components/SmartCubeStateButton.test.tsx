// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";
import { BluetoothTimerError } from "../lib/bluetoothTimer";

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) => translate("vi", key, params),
    }),
  };
});
const h = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock("../lib/smartCube", () => ({
  connectSmartCube: () => h.connect(),
  isSmartCubeSupported: () => true,
}));

import { SmartCubeStateButton } from "./SmartCubeStateButton";

afterEach(() => {
  cleanup();
  h.connect.mockReset();
});

describe("SmartCubeStateButton", () => {
  it("đọc trạng thái đang cầm rồi ngắt kết nối", async () => {
    const kpuzzle = await puzzles["3x3x3"].kpuzzle();
    const pattern = kpuzzle.defaultPattern().applyAlg(new Alg("R U R' U'"));
    const cube = { getPattern: async () => pattern, stopTrackingMoves: vi.fn(), disconnect: vi.fn() };
    h.connect.mockResolvedValue(cube);
    const onState = vi.fn();
    render(<SmartCubeStateButton onState={onState} />);
    fireEvent.click(screen.getByRole("button", { name: "Đọc từ smart cube" }));
    await waitFor(() => expect(onState).toHaveBeenCalledTimes(1));
    const facelets: string = onState.mock.calls[0][0];
    expect(facelets).toHaveLength(54);
    expect(facelets).not.toBe("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB");
    expect(cube.disconnect).toHaveBeenCalled();
  });

  it("báo lỗi dễ hiểu khi người dùng huỷ chọn thiết bị", async () => {
    h.connect.mockRejectedValue(new BluetoothTimerError("cancelled"));
    const onState = vi.fn();
    render(<SmartCubeStateButton onState={onState} />);
    fireEvent.click(screen.getByRole("button", { name: "Đọc từ smart cube" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onState).not.toHaveBeenCalled();
  });

  it("vẫn ngắt kết nối khi không đọc được trạng thái", async () => {
    const cube = {
      getPattern: async () => {
        throw new Error("ble");
      },
      stopTrackingMoves: vi.fn(),
      disconnect: vi.fn(),
    };
    h.connect.mockResolvedValue(cube);
    render(<SmartCubeStateButton onState={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Đọc từ smart cube" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(cube.disconnect).toHaveBeenCalled();
  });
});
