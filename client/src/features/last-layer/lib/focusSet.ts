/**
 * "Bộ tập trung" per study lane: the user picks which case groups the
 * catalog should narrow down to (e.g. "COLL T" or "F2L 01"). Stored
 * locally per lane; empty array means "all groups".
 */
import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";

const KEY_PREFIX = "cfop-focus-set:";
const MAX_GROUPS = 200;

export function focusSetStorageKey(lane: string): string {
  return `${KEY_PREFIX}${lane}`;
}

export function readFocusSet(lane: string): string[] {
  const parsed = readStoredJson<unknown>(focusSetStorageKey(lane), []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, MAX_GROUPS);
}

export function writeFocusSet(lane: string, groups: readonly string[]): void {
  const clean = groups.filter(group => group.length > 0).slice(0, MAX_GROUPS);
  writeStoredValue(focusSetStorageKey(lane), JSON.stringify(clean));
}

export function toggleFocusGroup(lane: string, group: string): string[] {
  const current = readFocusSet(lane);
  const next = current.includes(group)
    ? current.filter(value => value !== group)
    : [...current, group];
  writeFocusSet(lane, next);
  return next;
}

export function clearFocusSet(lane: string): void {
  writeFocusSet(lane, []);
}
