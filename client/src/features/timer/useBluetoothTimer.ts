/**
 * useBluetoothTimer — pairs a GAN Timer and tracks the connection lifecycle.
 *
 * Deliberately separate from the per-tick display state: `update` events
 * (which arrive many times per second) never re-render the host page. The
 * live readout is owned by `BluetoothTimerHero`, which subscribes to the
 * timer directly. This hook only manages: unsupported → idle → connecting →
 * connected / error, device-initiated disconnects, and teardown on unmount.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BluetoothTimerError,
  connectGanTimer,
  isWebBluetoothSupported,
  type BluetoothTimerErrorKey,
  type GanTimerHandle,
} from "./lib/bluetoothTimer";

export type BluetoothTimerStatus =
  | "unsupported" // browser cannot use Web Bluetooth at all
  | "idle" // supported, not connected
  | "connecting" // pairing in progress
  | "connected" // polling a timer
  | "error"; // pairing failed — see errorKey

export type BluetoothTimer = {
  status: BluetoothTimerStatus;
  deviceName: string | null;
  errorKey: BluetoothTimerErrorKey | null;
  /** The device dropped the connection on its own since the last connect. */
  lostConnection: boolean;
  /** The live timer handle, or null when not connected. */
  timer: GanTimerHandle | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

function teardown(timer: GanTimerHandle | null) {
  if (!timer) return;
  try {
    timer.stopPolling();
    timer.disconnect();
  } catch {
    /* The device may already be gone — nothing to tear down. */
  }
}

export function useBluetoothTimer(): BluetoothTimer {
  const [status, setStatus] = useState<BluetoothTimerStatus>(() =>
    isWebBluetoothSupported() ? "idle" : "unsupported",
  );
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<BluetoothTimerErrorKey | null>(
    null,
  );
  const [lostConnection, setLostConnection] = useState(false);
  const timerRef = useRef<GanTimerHandle | null>(null);

  const disconnect = useCallback(() => {
    teardown(timerRef.current);
    timerRef.current = null;
    setDeviceName(null);
    setStatus(current =>
      current === "unsupported" ? current : "idle",
    );
  }, []);

  // Tear the timer down when the host page unmounts.
  useEffect(
    () => () => {
      teardown(timerRef.current);
      timerRef.current = null;
    },
    [],
  );

  // Device-initiated disconnects: surface them as "lost connection".
  useEffect(() => {
    if (status !== "connected") return;
    const timer = timerRef.current;
    if (!timer) return;
    const onDisconnect = () => {
      teardown(timerRef.current);
      timerRef.current = null;
      setDeviceName(null);
      setLostConnection(true);
      setStatus("idle");
    };
    timer.addEventListener("disconnect", onDisconnect);
    return () => timer.removeEventListener("disconnect", onDisconnect);
  }, [status]);

  const connect = useCallback(async () => {
    if (!isWebBluetoothSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("connecting");
    setErrorKey(null);
    setLostConnection(false);
    try {
      const timer = await connectGanTimer();
      timerRef.current = timer;
      setDeviceName(timer.name() ?? "GAN Timer");
      setStatus("connected");
    } catch (error) {
      timerRef.current = null;
      setDeviceName(null);
      setErrorKey(
        error instanceof BluetoothTimerError ? error.key : "failed",
      );
      setStatus("error");
    }
  }, []);

  return {
    status,
    deviceName,
    errorKey,
    lostConnection,
    timer: status === "connected" ? timerRef.current : null,
    connect,
    disconnect,
  };
}
