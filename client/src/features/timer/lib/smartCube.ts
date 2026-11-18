/**
 * Smart cube support — Bluetooth LE cubes (GAN, GoCube, HeyCube, QiYi SC,
 * GiiKER) over Web Bluetooth, via cubing.js `cubing/bluetooth`.
 *
 * Seam between the app and cubing.js, mirroring bluetoothTimer.ts: feature
 * detection, lazy import, stable error keys, and a minimal handle type so
 * the rest of the app never imports cubing directly.
 *
 * What the cube gives us:
 *   - `getPattern()` — the cube's CURRENT state (physical read, works even
 *     when connected mid-scramble)
 *   - AlgLeafEvents — one per move, with `latestAlgLeaf` (Move node)
 *   - solved-state is checked with KPattern.isIdentical against a pattern
 *     built from the app's scramble (see kpatternFacelets.ts)
 */
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

/**
 * Pairs a smart cube and returns the handle. Throws `BluetoothTimerError`
 * with a stable `key` the UI can map onto i18n messages.
 */
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
