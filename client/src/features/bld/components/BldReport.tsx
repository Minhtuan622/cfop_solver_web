/** Tailwind-native BLD report; specialized logic is retained while presentation uses cards and standard forms. */
import { ExternalLink, Link2, ShieldCheck, X } from "@/components/ui/Icon";
import { IconButton, SkeletonList, StatTile } from "@/components/ui/StudioUI";
import { useEffect, useMemo, useState } from "react";
import { Link as RouteLink } from "wouter";
import {
  firstCatalogAlgorithm,
  preferenceKey,
  setPreferredAlgorithm,
  type BldProfile,
} from "@/features/bld";
import {
  fetchBldCatalogFile,
  type BldCatalogFile,
} from "@/features/bld/lib/bldCatalogSource";
import type { BldResult } from "@/lib/solverRuntime";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";

type Catalog = Record<string, string>;
type RuntimeCatalogs = {
  edge: Catalog;
  corner: Catalog;
  parity: Catalog;
  flip: Catalog;
  twist: Catalog;
  parityEdge: Record<string, string>;
  parityCorner: Record<string, string>;
  edgeCode: Record<string, string>;
  cornerCode: Record<string, string>;
};
const POSITIONS = [
  "UBL",
  "UB",
  "UBR",
  "UR",
  "U",
  "UF",
  "UFR",
  "UL",
  "UFL",
  "LUB",
  "LU",
  "LUF",
  "LF",
  "L",
  "LD",
  "LDF",
  "LB",
  "LDB",
  "FUL",
  "FU",
  "FUR",
  "FR",
  "F",
  "FD",
  "FDR",
  "FL",
  "FDL",
  "RUF",
  "RU",
  "RUB",
  "RB",
  "R",
  "RD",
  "RDB",
  "RF",
  "RDF",
  "BUR",
  "BU",
  "BUL",
  "BL",
  "B",
  "BD",
  "BDL",
  "BR",
  "BDR",
  "DFL",
  "DF",
  "DFR",
  "DR",
  "D",
  "DB",
  "DBR",
  "DL",
  "DBL",
];
const CHICHU = "DEGC GAAJEDCX TQLMBBLS QNJYKHIR ZZPSHFFY WTNPWIXK OOMR";
const SPEFFZ = "AABD BDCCEEFH FHGGIIJL JLKKMMNP NPOOQQRT RTSSUUVX VXWW";
const EDGE_POSITIONS = [
  "UF",
  "UL",
  "UB",
  "UR",
  "DF",
  "DL",
  "DB",
  "DR",
  "FR",
  "FL",
  "BL",
  "BR",
];
const CORNER_POSITIONS = [
  "UFR",
  "UBR",
  "UFL",
  "UBL",
  "DFR",
  "DBR",
  "DFL",
  "DBL",
];
const FLIP_CODE: Record<string, string> = {
  UR: "H",
  UF: "B",
  UL: "D",
  UB: "F",
  DR: "P",
  DL: "L",
  FR: "R",
  FL: "T",
  BR: "Z",
  DF: "J",
  BL: "X",
  DB: "N",
};
const FLIP_ORDER = [
  "UF",
  "UL",
  "UB",
  "UR",
  "DF",
  "DL",
  "DB",
  "DR",
  "FR",
  "FL",
  "BL",
  "BR",
];
const TWIST_ORDER = ["UFL", "UBL", "UBR", "UFR", "DFL", "DBL", "DBR", "DFR"];
const TWIST_CODE: Record<string, Record<"cw" | "ccw", string>> = {
  UFR: { cw: "L", ccw: "K" },
  UBR: { cw: "I", ccw: "H" },
  UFL: { cw: "C", ccw: "B" },
  UBL: { cw: "F", ccw: "E" },
  DFR: { cw: "Z", ccw: "Y" },
  DBR: { cw: "T", ccw: "S" },
  DFL: { cw: "N", ccw: "M" },
  DBL: { cw: "Q", ccw: "P" },
};

function sourceToSpeffz(kind: "edge" | "corner") {
  const map = new Map<string, string>();
  POSITIONS.forEach((position, index) => {
    if (position.length === (kind === "edge" ? 2 : 3) && CHICHU[index] !== " ")
      map.set(CHICHU[index], SPEFFZ[index]);
  });
  return (key: string) =>
    Array.from(key, letter => map.get(letter) ?? letter).join("");
}
function parseCatalog(
  raw: Record<string, unknown>,
  convert?: (key: string) => string
): Catalog {
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, variants]) => [
        convert ? convert(key) : key,
        firstCatalogAlgorithm(variants),
      ])
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
  );
}
function algorithmText(
  algorithm: string | undefined,
  loading: boolean,
  failed: boolean,
  vi: boolean
) {
  return (
    algorithm ??
    (failed
      ? vi
        ? "Không tải được catalog runtime."
        : "Runtime catalog unavailable."
      : loading
        ? vi
          ? "Đang đối chiếu catalog…"
          : "Matching catalog…"
        : vi
          ? "Chưa có exact match trong catalog."
          : "No exact catalog match.")
  );
}

function MemoTokens({
  title,
  memo,
  buffer,
}: {
  title: string;
  memo: string[];
  buffer: string;
}) {
  return (
    <section className="col-span-12 lg:col-span-6">
      <div className="rounded-card bg-surface bg-surface-2 h-full">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-tight mb-0">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
              Buffer {buffer}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-4">
            {memo.length ? (
              memo.map((pair, index) => (
                <span
                  key={`${pair}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-2 text-ink font-mono"
                >
                  {pair}
                </span>
              ))
            ) : (
              <span className="text-muted">Solved</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AlgorithmRow({
  type,
  label,
  exactKey,
  catalogAlgorithm,
  profile,
  onProfile,
  loading,
  failed,
  language,
}: {
  type: "edge" | "corner" | "parity" | "flip" | "twist";
  label: string;
  exactKey: string;
  catalogAlgorithm?: string;
  profile: BldProfile;
  onProfile: (profile: BldProfile) => void;
  loading: boolean;
  failed: boolean;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const key = preferenceKey(type, exactKey);
  const preferred = profile.preferredAlgorithms[key]?.algorithm;
  const active = preferred ?? catalogAlgorithm;
  return (
    <article className="block px-4 py-3 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
          {label}
        </span>
        <strong className="font-mono break-words">{exactKey}</strong>
      </div>
      <p className="font-mono break-words text-sm mt-2 mb-2">
        {preferred ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-white mr-1">
              Profile
            </span>
            {preferred}
          </>
        ) : (
          algorithmText(active, loading, failed, vi)
        )}
      </p>
      {catalogAlgorithm && (
        <div className="flex w-full items-stretch text-xs">
          <Input
            aria-label={`${label} preferred algorithm`}
            value={preferred ?? ""}
            onChange={event =>
              onProfile(setPreferredAlgorithm(profile, key, event.target.value))
            }
            placeholder={
              vi
                ? "Ưu tiên cá nhân (tùy chọn)"
                : "Personal preference (optional)"
            }
          />
          {preferred && (
            <IconButton
              label={vi ? "Xóa ưu tiên" : "Clear preference"}
              icon={<X className="text-base" />}
              onClick={() => onProfile(setPreferredAlgorithm(profile, key, ""))}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent text-danger hover:bg-danger-soft"
            />
          )}
        </div>
      )}
    </article>
  );
}

export function BldReport({
  result,
  language,
  profile,
  onProfile,
}: {
  result: BldResult;
  language: "vi" | "en";
  profile: BldProfile;
  onProfile: (profile: BldProfile) => void;
}) {
  const vi = language === "vi";
  const [catalogs, setCatalogs] = useState<RuntimeCatalogs | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [parityEdges, setParityEdges] = useState<[string, string]>([
    "UF",
    "UR",
  ]);
  const [parityCorners, setParityCorners] = useState<[string, string]>([
    "UFR",
    "UBR",
  ]);
  useEffect(() => {
    let live = true;
    setCatalogs(null);
    setCatalogError(false);
    const request = <T,>(file: BldCatalogFile) => fetchBldCatalogFile<T>(file);
    Promise.all([
      request<Record<string, unknown>>("edge"),
      request<Record<string, unknown>>("corner"),
      request<Record<string, unknown>>("parity"),
      request<Record<string, unknown>>("flip"),
      request<Record<string, unknown>>("twist"),
      request<Record<string, string>>("parityEdge"),
      request<Record<string, string>>("parityCorner"),
      request<Record<string, string>>("edgeCode"),
      request<Record<string, string>>("cornerCode"),
    ])
      .then(
        ([
          edge,
          corner,
          parity,
          flip,
          twist,
          parityEdge,
          parityCorner,
          edgeCode,
          cornerCode,
        ]) => {
          if (live)
            setCatalogs({
              edge: parseCatalog(edge, sourceToSpeffz("edge")),
              corner: parseCatalog(corner, sourceToSpeffz("corner")),
              parity: parseCatalog(parity),
              flip: parseCatalog(flip),
              twist: parseCatalog(twist),
              parityEdge,
              parityCorner,
              edgeCode,
              cornerCode,
            });
        }
      )
      .catch(() => {
        if (live) setCatalogError(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const plan = result.analysis;
  const special = plan.special;
  const loading = !catalogs && !catalogError;
  const executions = useMemo(
    () => [
      ...plan.edges.execution_keys.map(key => ({
        type: "edge" as const,
        label: "EDGE",
        key,
        algorithm: catalogs?.edge[key],
      })),
      ...plan.corners.execution_keys.map(key => ({
        type: "corner" as const,
        label: "CORNER",
        key,
        algorithm: catalogs?.corner[key],
      })),
    ],
    [catalogs, plan]
  );
  const flipPairs = useMemo(
    () =>
      [...special.edge_flips]
        .sort(
          (left, right) => FLIP_ORDER.indexOf(left) - FLIP_ORDER.indexOf(right)
        )
        .reduce<{ key: string; positions: string }[]>(
          (pairs, position, index, all) => {
            if (index % 2 === 0 && all[index + 1])
              pairs.push({
                key: `${FLIP_CODE[position]}${FLIP_CODE[all[index + 1]]}`,
                positions: `${position} ↔ ${all[index + 1]}`,
              });
            return pairs;
          },
          []
        ),
    [special.edge_flips]
  );
  const twistKey = useMemo(
    () =>
      TWIST_ORDER.map(position => {
        const twist = special.corner_twists.find(
          item => item.position === position
        );
        return twist ? TWIST_CODE[position][twist.direction] : "";
      }).join(""),
    [special.corner_twists]
  );
  const parityKey = useMemo(() => {
    if (
      !catalogs ||
      parityEdges[0] === parityEdges[1] ||
      parityCorners[0] === parityCorners[1]
    )
      return "";
    const edge =
      catalogs.parityEdge[
        `${catalogs.edgeCode[parityEdges[0]] ?? ""}${catalogs.edgeCode[parityEdges[1]] ?? ""}`
      ];
    const corner =
      catalogs.parityCorner[
        `${catalogs.cornerCode[parityCorners[0]] ?? ""}${catalogs.cornerCode[parityCorners[1]] ?? ""}`
      ];
    return edge && corner ? `${edge}${corner}` : "";
  }, [catalogs, parityCorners, parityEdges]);
  return (
    <section className="rounded-card bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted font-semibold mb-1">
            3-Style BLD · Speffz
          </p>
          <h3 className="text-base font-semibold tracking-tight mb-0">
            {plan.solved
              ? vi
                ? "Cube đã giải"
                : "Cube solved"
              : "Memo và execution"}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-white">
          <ShieldCheck className="text-base" />
          UF / UBL
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-sm text-muted">
          {vi
            ? "Studio chẩn đoán state và đối chiếu execution. Học memo, drill, SRS và hồ sơ nằm tại Study."
            : "Studio diagnoses cube state and matches execution. Memo learning, drills, SRS, and profile live in Study."}
        </p>
        <RouteLink
          href="/study?lane=bld"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent text-primary hover:bg-primary-soft px-3 py-1.5 text-xs mb-4"
        >
          {vi
            ? "Tiếp tục học 3-Style trong Study"
            : "Continue 3-Style learning in Study"}
        </RouteLink>
        <div className="grid grid-cols-12 gap-4">
          <MemoTokens
            title="Edge memo"
            memo={plan.edges.memo}
            buffer={plan.buffers.edge.letter}
          />
          <MemoTokens
            title="Corner memo"
            memo={plan.corners.memo}
            buffer={plan.buffers.corner.letter}
          />
        </div>
        <section className="mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-tight mb-0">
              Execution · 3-cycle
            </h3>
          </div>
          {loading ? (
            <SkeletonList
              rows={Math.max(2, executions.length)}
              label={
                vi ? "Đang nạp catalog execution" : "Loading execution catalog"
              }
            />
          ) : executions.length ? (
            <div className="overflow-hidden rounded-panel bg-surface mt-2">
              {executions.map((entry, index) => (
                <AlgorithmRow
                  key={`${entry.label}-${entry.key}-${index}`}
                  type={entry.type}
                  label={entry.label}
                  exactKey={entry.key}
                  catalogAlgorithm={entry.algorithm}
                  profile={profile}
                  onProfile={onProfile}
                  loading={loading}
                  failed={catalogError}
                  language={language}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-2 mb-0">
              {vi ? "Không có 3-cycle cần execute." : "No 3-cycles to execute."}
            </div>
          )}
        </section>
        <section className="mt-6">
          <h3 className="text-sm font-semibold tracking-tight">
            Special · exact catalog
          </h3>
          {loading ? (
            <SkeletonList
              rows={1}
              label={
                vi
                  ? "Đang nạp catalog tình huống đặc biệt"
                  : "Loading special-case catalog"
              }
            />
          ) : !special.parity &&
            !special.edge_flips.length &&
            !special.corner_twists.length ? (
            <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mb-0">
              {vi
                ? "Không có parity, flip hoặc twist cần xử lý."
                : "No parity, flip, or twist requires handling."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {special.parity && (
                <div className="rounded-card bg-surface">
                  <div className="p-5 sm:p-6">
                    <h4 className="text-sm font-semibold tracking-tight text-warning">
                      Parity ·{" "}
                      {vi ? "chọn cặp tích hợp" : "select integration pairs"}
                    </h4>
                    <div className="grid grid-cols-12 gap-2">
                      {([parityEdges, parityCorners] as const).map(
                        (selection, familyIndex) => (
                          <div
                            key={familyIndex}
                            className="col-span-12 md:col-span-6"
                          >
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                              {familyIndex === 0
                                ? vi
                                  ? "Cạnh"
                                  : "Edges"
                                : vi
                                  ? "Góc"
                                  : "Corners"}
                            </label>
                            <div className="flex w-full items-stretch text-xs">
                              <Select
                                value={selection[0]}
                                onChange={event =>
                                  familyIndex === 0
                                    ? setParityEdges([
                                        event.target.value,
                                        parityEdges[1],
                                      ])
                                    : setParityCorners([
                                        event.target.value,
                                        parityCorners[1],
                                      ])
                                }
                              >
                                {(familyIndex === 0
                                  ? EDGE_POSITIONS
                                  : CORNER_POSITIONS
                                ).map(position => (
                                  <option key={position} value={String(position)}>{position}</option>
                                ))}
                              </Select>
                              <Select
                                value={selection[1]}
                                onChange={event =>
                                  familyIndex === 0
                                    ? setParityEdges([
                                        parityEdges[0],
                                        event.target.value,
                                      ])
                                    : setParityCorners([
                                        parityCorners[0],
                                        event.target.value,
                                      ])
                                }
                              >
                                {(familyIndex === 0
                                  ? EDGE_POSITIONS
                                  : CORNER_POSITIONS
                                ).map(position => (
                                  <option key={position} value={String(position)}>{position}</option>
                                ))}
                              </Select>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    {parityKey ? (
                      <div className="overflow-hidden rounded-panel bg-surface mt-4">
                        <AlgorithmRow
                          type="parity"
                          label="PARITY"
                          exactKey={parityKey}
                          catalogAlgorithm={catalogs?.parity[parityKey]}
                          profile={profile}
                          onProfile={onProfile}
                          loading={loading}
                          failed={catalogError}
                          language={language}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-danger mt-4 mb-0">
                        {vi
                          ? "Cặp đã chọn không tạo được exact standard key."
                          : "Selected pairs do not produce an exact standard key."}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {flipPairs.length > 0 && (
                <div className="overflow-hidden rounded-panel bg-surface">
                  {flipPairs.map(entry => (
                    <AlgorithmRow
                      key={entry.key}
                      type="flip"
                      label={`Flip · ${entry.positions}`}
                      exactKey={entry.key}
                      catalogAlgorithm={catalogs?.flip[entry.key]}
                      profile={profile}
                      onProfile={onProfile}
                      loading={loading}
                      failed={catalogError}
                      language={language}
                    />
                  ))}
                </div>
              )}
              {Boolean(special.corner_twists.length) && (
                <div className="overflow-hidden rounded-panel bg-surface">
                  <AlgorithmRow
                    type="twist"
                    label={`Twist · ${special.corner_twists.map(item => `${item.position} ${item.direction}`).join(" / ")}`}
                    exactKey={twistKey}
                    catalogAlgorithm={catalogs?.twist[twistKey]}
                    profile={profile}
                    onProfile={onProfile}
                    loading={loading}
                    failed={catalogError}
                    language={language}
                  />
                </div>
              )}
            </div>
          )}
        </section>
        <div className="grid grid-cols-12 gap-2 mt-4">
          <div className="col-span-12 md:col-span-4">
            <StatTile
              label="Parity"
              value={special.parity ? "YES" : "—"}
              compact
              tone={special.parity ? "warning" : "default"}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <StatTile
              label="Flip"
              value={
                special.edge_flips.length ? special.edge_flips.join(" ") : "—"
              }
              compact
              tone={special.edge_flips.length > 0 ? "warning" : "default"}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <StatTile
              label="Twist"
              value={
                special.corner_twists.length
                  ? String(special.corner_twists.length)
                  : "—"
              }
              compact
              tone={special.corner_twists.length > 0 ? "warning" : "default"}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
          <p className="text-sm text-muted mb-0">
            {vi
              ? "• = cycle break; cặp special chưa chọn không được tự suy đoán."
              : "• = cycle break; unselected special pairs are never guessed."}
          </p>
          <a
            href="https://blddb.net"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs gap-1"
          >
            <Link2 className="text-base" />
            BLDDB
            <ExternalLink className="text-base" />
          </a>
        </div>
      </div>
    </section>
  );
}
