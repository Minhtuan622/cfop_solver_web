/**
 * Bảng bộ phím (giống csTimer) trình bày theo nhóm. Danh sách lượt được dựng
 * bằng chính `playActionForKey`, nên luôn khớp với cách trang xử lý phím.
 */
import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_LAYER_SELECTION, playActionForKey } from "@/lib/playCube";

type GroupId = "faces" | "wide" | "slice" | "rotate";
type Row = { move: string; keys: string[] };

const KEYS = "abcdefghijklmnopqrstuvwxyz0123456789,./;".split("");
const FACE_ORDER = "RUFLDB";

function groupOf(move: string, rotation: boolean): GroupId {
  if (rotation) return "rotate";
  if (/^[MES]/.test(move)) return "slice";
  if (/^[a-z]/.test(move)) return "wide";
  return "faces";
}

/** Thứ tự đọc: theo mặt (R U F L D B / M E S / x y z), lượt thuận trước lượt ngược. */
function moveRank(move: string) {
  const base = move.replace(/['2]/g, "");
  const order = `${FACE_ORDER}${FACE_ORDER.toLowerCase()}MESxyz`;
  const index = order.indexOf(base[0]);
  return (index < 0 ? 99 : index) * 2 + (move.includes("'") ? 1 : 0);
}

/** Các nhóm lượt xoay → phím, tính một lần từ bảng phím thật. */
export function buildPlayKeyGroups(): Record<GroupId, Row[]> {
  const groups: Record<GroupId, Map<string, string[]>> = {
    faces: new Map(),
    wide: new Map(),
    slice: new Map(),
    rotate: new Map(),
  };
  for (const key of KEYS) {
    const action = playActionForKey(key, DEFAULT_LAYER_SELECTION);
    if (action?.kind !== "move") continue;
    const group = groups[groupOf(action.move, action.rotation)];
    group.set(action.move, [...(group.get(action.move) ?? []), key]);
  }
  const toRows = (map: Map<string, string[]>) =>
    Array.from(map, ([move, keys]) => ({ move, keys })).sort(
      (a, b) => moveRank(a.move) - moveRank(b.move)
    );
  return {
    faces: toRows(groups.faces),
    wide: toRows(groups.wide),
    slice: toRows(groups.slice),
    rotate: toRows(groups.rotate),
  };
}

function KeyChip({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-3 px-1.5 font-mono text-[11px] font-semibold uppercase text-ink">
      {children}
    </kbd>
  );
}

export function PlayKeyMap() {
  const { t } = useLanguage();
  const groups = useMemo(buildPlayKeyGroups, []);
  const sections: { id: GroupId; titleKey: string }[] = [
    { id: "faces", titleKey: "play.keyGroupFaces" },
    { id: "wide", titleKey: "play.keyGroupWide" },
    { id: "slice", titleKey: "play.keyGroupSlice" },
    { id: "rotate", titleKey: "play.keyGroupRotate" },
  ];
  const controls: { keys: string[]; labelKey: string }[] = [
    { keys: ["Space"], labelKey: "play.keyControlSpace" },
    { keys: ["Esc"], labelKey: "play.keyControlEscape" },
    { keys: ["3", "4"], labelKey: "play.keyControlLeftLayer" },
    { keys: ["7", "8"], labelKey: "play.keyControlRightLayer" },
    { keys: ["←", "→", "↑", "↓"], labelKey: "play.keyControlCamera" },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
      {sections.map(section => (
        <section key={section.id}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t(section.titleKey)}
          </h3>
          <ul className="space-y-1.5">
            {groups[section.id].map(row => (
              <li key={row.move} className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-ink">{row.move}</span>
                <span className="flex flex-wrap justify-end gap-1">
                  {row.keys.map(key => (
                    <KeyChip key={key}>{key}</KeyChip>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="col-span-2">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("play.keyGroupControl")}
        </h3>
        <ul className="space-y-1.5">
          {controls.map(control => (
            <li key={control.labelKey} className="flex items-center justify-between gap-2">
              <span className="text-sm text-ink">{t(control.labelKey)}</span>
              <span className="flex flex-wrap justify-end gap-1">
                {control.keys.map(key => (
                  <KeyChip key={key}>{key}</KeyChip>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
