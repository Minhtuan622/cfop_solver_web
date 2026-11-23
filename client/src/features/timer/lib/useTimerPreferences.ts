/**
 * Tuỳ chọn của trang Bấm giờ (âm thanh/giọng đếm inspection, metronome, ẩn
 * thời gian khi chạy, cỡ chữ scramble). Đặt ở trang Cài đặt; đọc một lần khi
 * mở trang.
 */
import { useState } from "react";
import { readStoredValue } from "@/lib/browserStorage";
import { HIDE_RUNNING_TIME_KEY } from "@/lib/appSettings";

export function useTimerPreferences() {
  const [inspectionSound] = useState(
    () => readStoredValue("cfop-inspection-sound") !== "off"
  );
  const [inspectionVoice] = useState(
    () => readStoredValue("cfop-inspection-voice") !== "off"
  );
  const [metronomeEnabled] = useState(
    () => readStoredValue("cfop-metronome") === "on"
  );
  const [metronomeBpm] = useState(() => {
    const stored = Number(readStoredValue("cfop-metronome-bpm"));
    return Number.isFinite(stored) && stored >= 30 && stored <= 240
      ? Math.round(stored)
      : 60;
  });
  // Cài đặt → Timer: chỉ hiện "Đang giải…" trong lúc đồng hồ chạy.
  const [hideRunningTime] = useState(
    () => readStoredValue(HIDE_RUNNING_TIME_KEY) === "on"
  );
  const [scrambleSize] = useState<"sm" | "md" | "lg">(() => {
    const stored = readStoredValue("cfop-scramble-size");
    return stored === "sm" || stored === "lg" ? stored : "md";
  });
  return {
    inspectionSound,
    inspectionVoice,
    metronomeEnabled,
    metronomeBpm,
    hideRunningTime,
    scrambleSize,
  };
}
