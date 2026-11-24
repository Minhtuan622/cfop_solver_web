import { useCallback, useEffect, useRef, useState } from "react";
import {
  BluetoothTimerError,
  connectGanTimer,
  isWebBluetoothSupported,
  type BluetoothTimerErrorKey,
  type GanTimerHandle,
} from "./lib/bluetoothTimer";

export type BluetoothTimerStatus =
  | "unsupported"
  | "idle"
  | "connecting"
  | "connected"
  | "error";

export type BluetoothTimer = {
  status: BluetoothTimerStatus;
  deviceName: string | null;
  errorKey: BluetoothTimerErrorKey | null;
  lostConnection: boolean;
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
  const mountedRef = useRef(true);

  const disconnect = useCallback(() => {
    teardown(timerRef.current);
    timerRef.current = null;
    setDeviceName(null);
    setStatus(current =>
      current === "unsupported" ? current : "idle",
    );
  }, []);

  useEffect(
    () => () => {
      mountedRef.current = false;
      teardown(timerRef.current);
      timerRef.current = null;
    },
    [],
  );

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
      if (!mountedRef.current) {
        teardown(timer);
        return;
      }
      timerRef.current = timer;
      setDeviceName(timer.name() ?? "GAN Timer");
      setStatus("connected");
    } catch (error) {
      if (!mountedRef.current) return;
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
