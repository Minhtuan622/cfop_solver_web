/**
 * BluetoothTimerBar — a slim strip above the timer: connect/disconnect a
 * GAN Timer, show pairing state, and surface why connecting is unavailable
 * (no Web Bluetooth / insecure context) instead of hiding it.
 */
import { Bluetooth, Info } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { BluetoothTimerStatus } from "../useBluetoothTimer";
import type { BluetoothTimerErrorKey } from "../lib/bluetoothTimer";

export function BluetoothTimerBar({
  status,
  deviceName,
  errorKey,
  lostConnection,
  onConnect,
  onDisconnect,
}: {
  status: BluetoothTimerStatus;
  deviceName: string | null;
  errorKey: BluetoothTimerErrorKey | null;
  lostConnection: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { t } = useLanguage();

  if (status === "unsupported") {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-card bg-surface-2 px-4 py-2.5 text-xs text-muted">
        <Info className="text-base text-muted" aria-hidden="true" />
        <span>{t("timer.ble.unsupported")}</span>
      </div>
    );
  }

  const errorMessage =
    status === "error" && errorKey
      ? t(
          {
            cancelled: "timer.ble.cancelled",
            denied: "timer.ble.denied",
            unavailable: "timer.ble.unsupported",
            unsupportedDevice: "timer.ble.unsupportedDevice",
            failed: "timer.ble.error",
          }[errorKey] ?? "timer.ble.error",
        )
      : lostConnection
        ? t("timer.ble.lost")
        : null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {status === "connected" ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
            <span
              className="h-2 w-2 rounded-full bg-success"
              aria-hidden="true"
            />
            {t("timer.ble.connected")}
            {deviceName ? (
              <span className="text-ink/70">· {deviceName}</span>
            ) : null}
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={onDisconnect}>
            {t("timer.ble.disconnect")}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={status === "connecting"}
          onClick={onConnect}
        >
          <Bluetooth className="mr-1 text-base" aria-hidden="true" />
          {status === "connecting"
            ? t("timer.ble.connecting")
            : errorMessage
              ? t("timer.ble.reconnect")
              : t("timer.ble.connect")}
        </Button>
      )}
      {errorMessage ? (
        <p
          role="alert"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            status === "error" ? "text-danger" : "text-warning",
          )}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
