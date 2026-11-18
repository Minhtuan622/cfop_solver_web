/**
 * Bluetooth timer support — the GAN Timer, over Web Bluetooth.
 *
 * cubing.js ships `cubing/bluetooth` with `connectSmartTimer()`, which pairs
 * a GAN smart timer (service `0000fff0-…`, time characteristic `0000fff2-…`)
 * and polls it for the current time. Speed Stacks / Stackmat mats use a
 * wired 3.5mm audio connection and are NOT supported here.
 *
 * This module is the thin, testable seam between the app and cubing.js:
 * feature detection, error mapping, and a minimal handle type so the rest of
 * the app never imports cubing directly. cubing.js is loaded lazily on first
 * connect so browsers without Web Bluetooth never pay for it.
 */
export type BluetoothTimerErrorKey =
  | "cancelled" // the user dismissed the device chooser
  | "denied" // permission/security policy rejected the request
  | "unavailable" // no Web Bluetooth (or not a secure context / no adapter)
  | "unsupportedDevice" // paired, but the GAN timer service was not found
  | "failed"; // anything else

export class BluetoothTimerError extends Error {
  readonly key: BluetoothTimerErrorKey;
  constructor(key: BluetoothTimerErrorKey, message?: string) {
    super(message ?? key);
    this.name = "BluetoothTimerError";
    this.key = key;
  }
}

/** What the rest of the app needs from a GAN timer. */
export type GanTimerHandle = {
  name(): string | undefined;
  getTime(): Promise<number>;
  startPolling(): void;
  stopPolling(): void;
  disconnect(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
};

export function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean((navigator as Navigator).bluetooth?.requestDevice)
  );
}

export function mapBluetoothError(error: unknown): BluetoothTimerError {
  const name =
    (error as { name?: string } | null | undefined)?.name ?? "";
  switch (name) {
    case "NotFoundError":
    case "AbortError":
      // The user cancelled the chooser, or (rarely) the device turned out to
      // lack the GAN timer service. The chooser path is far more common.
      return new BluetoothTimerError("cancelled");
    case "NotAllowedError":
    case "SecurityError":
      return new BluetoothTimerError("denied");
    case "NotSupportedError":
    case "TypeError":
      // Insecure context, missing adapter, or an unsupported environment —
      // these surface as TypeError/NotSupportedError depending on the browser.
      return new BluetoothTimerError("unavailable");
    case "NetworkError":
    case "NotReadableError":
    case "InvalidStateError":
      return new BluetoothTimerError("unsupportedDevice");
    default:
      return new BluetoothTimerError(
        "failed",
        error instanceof Error ? error.message : String(error),
      );
  }
}

/**
 * Pairs a GAN Timer and starts polling it. Throws `BluetoothTimerError`
 * with a stable `key` the UI can map onto i18n messages.
 */
export async function connectGanTimer(): Promise<GanTimerHandle> {
  if (!isWebBluetoothSupported())
    throw new BluetoothTimerError("unavailable");
  let mod: typeof import("cubing/bluetooth");
  try {
    mod = await import("cubing/bluetooth");
  } catch {
    throw new BluetoothTimerError("failed", "cubing/bluetooth failed to load");
  }
  try {
    const timer = await mod.connectSmartTimer();
    return timer as unknown as GanTimerHandle;
  } catch (error) {
    throw error instanceof BluetoothTimerError
      ? error
      : mapBluetoothError(error);
  }
}
