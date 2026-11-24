/**
 * Đọc trạng thái khối đang cầm trên tay từ smart cube (Bluetooth) rồi trả về
 * chuỗi 54 sticker để trang Giải giải ngay. Chỉ đọc một lần: kết nối, lấy
 * trạng thái, ngắt; không giữ kết nối với Timer.
 */
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { BluetoothTimerErrorKey } from "../lib/bluetoothTimer";

const ERROR_KEYS: Record<BluetoothTimerErrorKey, string> = {
  cancelled: "timer.ble.cancelled",
  denied: "timer.ble.denied",
  unavailable: "timer.smartCube.unsupported",
  unsupportedDevice: "timer.ble.unsupportedDevice",
  failed: "timer.ble.error",
};

export function SmartCubeStateButton({
  onState,
  disabled = false,
}: {
  onState: (facelets: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const read = async () => {
    setBusy(true);
    setError("");
    try {
      const [{ connectSmartCube, isSmartCubeSupported }, { kpatternToFacelets }] =
        await Promise.all([
          import("../lib/smartCube"),
          import("../lib/kpatternFacelets"),
        ]);
      if (!isSmartCubeSupported()) {
        setError(t("timer.smartCube.unsupported"));
        return;
      }
      const cube = await connectSmartCube();
      try {
        const pattern = await cube.getPattern();
        onState(kpatternToFacelets(pattern));
      } finally {
        try {
          cube.stopTrackingMoves?.();
          cube.disconnect();
        } catch {
          /* đã ngắt */
        }
      }
    } catch (reason) {
      const key = (reason as { key?: BluetoothTimerErrorKey } | null)?.key;
      setError(t(key ? ERROR_KEYS[key] : "timer.ble.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="link"
        size="sm"
        className="p-0 no-underline"
        type="button"
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        onClick={() => void read()}
      >
        {busy ? t("timer.ble.connecting") : t("home.smartCubeRead")}
      </Button>
      {error ? (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </>
  );
}
