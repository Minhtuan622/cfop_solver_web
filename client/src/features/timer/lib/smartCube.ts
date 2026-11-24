import {
  BluetoothTimerError,
  isWebBluetoothSupported,
  mapBluetoothError,
} from "./bluetoothTimer";
import type { KPattern } from "cubing/kpuzzle";
import type { MoveEvent as SmartCubeEvent } from "cubing/bluetooth";

export type { SmartCubeEvent };

export type SmartCubeStatus =
  | "unsupported"
  | "idle"
  | "connecting"
  | "connected"
  | "error";

export type SmartCubeHandle = {
  name(): string | undefined;
  getPattern(): Promise<KPattern>;
  getBattery?(): Promise<number>;
  addAlgLeafListener(listener: (e: SmartCubeEvent) => void): void;
  stopTrackingMoves?(): void;
  disconnect(): void;
};

export function isSmartCubeSupported(): boolean {
  return isWebBluetoothSupported();
}

export function connectSmartCubeUnsupportedReason(): SmartCubeStatus {
  return isSmartCubeSupported() ? "idle" : "unsupported";
}

export async function connectSmartCube(): Promise<SmartCubeHandle> {
  if (!isWebBluetoothSupported())
    throw new BluetoothTimerError("unavailable");
  let mod: typeof import("cubing/bluetooth");
  try {
    mod = await import("cubing/bluetooth");
  } catch {
    throw new BluetoothTimerError("failed", "cubing/bluetooth failed to load");
  }
  try {
    return (await mod.connectSmartPuzzle()) as unknown as SmartCubeHandle;
  } catch (error) {
    throw error instanceof BluetoothTimerError
      ? error
      : mapBluetoothError(error);
  }
}
