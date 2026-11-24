import { ExternalLink, Link2, ShieldCheck } from "@/components/ui/Icon";
import { SkeletonList, StatTile } from "@/components/ui/StudioUI";
import { useMemo, useState } from "react";
import { Link as RouteLink } from "wouter";
import type { BldResult } from "@/lib/solverRuntime";
import type { BldProfile } from "../lib/bldProfile";
import { flipPairsOf, parityKeyOf, twistKeyOf } from "../lib/bldExecution";
import { useBldRuntimeCatalogs } from "../lib/useBldRuntimeCatalogs";
import { BldAlgorithmRow } from "./BldAlgorithmRow";
import { BldMemoTokens } from "./BldMemoTokens";
import { BldParityPicker } from "./BldParityPicker";

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
  const { catalogs, catalogError, loading } = useBldRuntimeCatalogs();
  const [parityEdges, setParityEdges] = useState<[string, string]>([
    "UF",
    "UR",
  ]);
  const [parityCorners, setParityCorners] = useState<[string, string]>([
    "UFR",
    "UBR",
  ]);
  const plan = result.analysis;
  const special = plan.special;
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
    () => flipPairsOf(special.edge_flips),
    [special.edge_flips]
  );
  const twistKey = useMemo(
    () => twistKeyOf(special.corner_twists),
    [special.corner_twists]
  );
  const parityKey = useMemo(
    () => parityKeyOf(catalogs, parityEdges, parityCorners),
    [catalogs, parityCorners, parityEdges]
  );
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
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success">
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
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent text-primary hover:bg-primary-soft px-3 py-1.5 text-xs mb-4"
        >
          {vi
            ? "Tiếp tục học 3-Style trong Study"
            : "Continue 3-Style learning in Study"}
        </RouteLink>
        <div className="grid grid-cols-12 gap-4">
          <BldMemoTokens
            title="Edge memo"
            memo={plan.edges.memo}
            buffer={plan.buffers.edge.letter}
          />
          <BldMemoTokens
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
                <BldAlgorithmRow
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
                <BldParityPicker
                  vi={vi}
                  parityEdges={parityEdges}
                  parityCorners={parityCorners}
                  onParityEdgesChange={setParityEdges}
                  onParityCornersChange={setParityCorners}
                >
                  {parityKey ? (
                    <BldAlgorithmRow
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
                  ) : null}
                </BldParityPicker>
              )}
              {flipPairs.length > 0 && (
                <div className="overflow-hidden rounded-panel bg-surface">
                  {flipPairs.map(entry => (
                    <BldAlgorithmRow
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
                  <BldAlgorithmRow
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs gap-1"
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
