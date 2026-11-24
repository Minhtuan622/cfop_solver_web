export type BluetoothTimerErrorKey =
  | "cancelled"
  | "denied"
  | "unavailable"
  | "unsupportedDevice"
  | "failed";

export class BluetoothTimerError extends Error {
  readonly key: BluetoothTimerErrorKey;
  constructor(key: BluetoothTimerErrorKey, message?: string) {
    super(message ?? key);
    this.name = "BluetoothTimerError";
    this.key = key;
  }
}

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
      return new BluetoothTimerError("cancelled");
    case "NotAllowedError":
    case "SecurityError":
      return new BluetoothTimerError("denied");
    case "NotSupportedError":
    case "TypeError":
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
