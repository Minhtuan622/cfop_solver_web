export const CFOP_CLOUD_SYNC_EVENT = "cfop-cloud-state-changed";
const CHANGE_TIME_KEY = "cfop-account-cloud-state-change-v1";

export function readCfopCloudChangeAt() {
  const value = Number(localStorage.getItem(CHANGE_TIME_KEY) ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function notifyCfopCloudStateChanged() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHANGE_TIME_KEY, String(Date.now()));
  window.dispatchEvent(new Event(CFOP_CLOUD_SYNC_EVENT));
}
