/**
 * Soft Focus Workspace — the first BLD practice is intentionally one calm recall task.
 * Advanced labels remain secondary; grading continues to feed the existing BLD SRS profile.
 */
import { Eye, EyeOff, RefreshCw } from "@/components/ui/Icon";
import { IconButton, SkeletonCard } from "@/components/ui/StudioUI";
import { useEffect, useMemo, useState } from "react";
import {
  firstCatalogAlgorithm,
  gradeMemo,
  preferenceKey,
  recordDrillAttempt,
  type BldDrillKind,
  type BldProfile,
} from "@/features/bld";
import { fetchBldCatalogFile } from "@/features/bld/lib/bldCatalogSource";
import type { BldResult } from "@/lib/solverRuntime";
import { Button } from "@/components/ui/Button";

type CatalogEntry = { key: string; algorithm: string; kind: BldDrillKind };
type RawCatalog = Record<string, unknown>;
const labels: Record<
  BldDrillKind,
  { vi: string; en: string; noteVi: string; noteEn: string }
> = {
  parity: {
    vi: "Một mảnh bị lẻ",
    en: "One odd piece",
    noteVi:
      "Đây là tình huống có một lần đổi chỗ lẻ; bạn sẽ gặp nó trong một số lượt giải bịt mắt.",
    noteEn:
      "This is an odd swap situation that appears in some blindfolded solves.",
  },
  flip: {
    vi: "Hai cạnh bị lật",
    en: "Two flipped edges",
    noteVi: "Đây là tình huống hai cạnh quay sai hướng cùng lúc.",
    noteEn: "This is when two edges are flipped at the same time.",
  },
  twist: {
    vi: "Một góc bị xoay",
    en: "One twisted corner",
    noteVi: "Đây là tình huống một góc quay sai hướng.",
    noteEn: "This is when one corner is twisted the wrong way.",
  },
};
function entries(raw: RawCatalog, kind: BldDrillKind): CatalogEntry[] {
  return Object.entries(raw)
    .map(([key, value]) => ({
      key,
      algorithm: firstCatalogAlgorithm(value) ?? "",
      kind,
    }))
    .filter(item => item.algorithm)
    .slice(0, 360);
}

export function BldTrainingLab({
  result,
  profile,
  onProfile,
  language,
}: {
  result: BldResult | null;
  profile: BldProfile;
  onProfile: (profile: BldProfile) => void;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const [kind, setKind] = useState<BldDrillKind>("parity");
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    let live = true;
    const request = (file: "parity" | "flip" | "twist") =>
      fetchBldCatalogFile<RawCatalog>(file);
    Promise.all([request("parity"), request("flip"), request("twist")])
      .then(([parity, flip, twist]) => {
        if (live) {
          setCatalog([
            ...entries(parity, "parity"),
            ...entries(flip, "flip"),
            ...entries(twist, "twist"),
          ]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, []);
  const matches = useMemo(
    () => catalog.filter(item => item.kind === kind),
    [catalog, kind]
  );
  const active = matches[cursor % Math.max(1, matches.length)];
  const memoCount =
    (result?.analysis.edges.memo.length ?? 0) +
    (result?.analysis.corners.memo.length ?? 0);
  const choose = (next: BldDrillKind) => {
    setKind(next);
    setCursor(0);
    setRevealed(false);
  };
  const next = () => {
    setCursor(current => current + 1);
    setRevealed(false);
  };
  const grade = (remembered: boolean) => {
    if (!active) return;
    const key = `guided:${active.kind}:${active.key}`;
    let nextProfile = gradeMemo(
      profile,
      { key, memo: `${active.kind}:${active.key}`, kind: "formula" },
      remembered ? "good" : "again"
    );
    nextProfile = recordDrillAttempt(nextProfile, {
      kind: active.kind,
      key: active.key,
      grade: remembered ? "good" : "again",
      durationMs: 0,
    });
    onProfile(nextProfile);
    next();
  };
  const preferred = active
    ? profile.preferredAlgorithms[preferenceKey(active.kind, active.key)]
        ?.algorithm
    : undefined;
  const copy = labels[kind];
  return (
    <section className="rounded-card bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
          {vi ? "Bài tập công thức" : "Algorithm practice"}
        </p>
        <h4 className="text-base font-semibold tracking-tight mb-1">
          {vi ? "Một tình huống, một đáp án." : "One situation, one answer."}
        </h4>
        <p className="text-sm text-muted mb-0">
          {memoCount
            ? vi
              ? `Memo vừa tạo có ${memoCount} vị trí cần nhớ. Bài này bổ sung cho các tình huống đặc biệt.`
              : `Your memo has ${memoCount} locations. This lesson covers occasional special situations.`
            : vi
              ? "Bạn có thể học bài này trước; tạo memo ở bước 3 khi muốn thử trên khối thật."
              : "You can learn this first; build a memo in step 3 when ready to try a real cube."}
        </p>
      </div>
      <div className="p-5 sm:p-6">
        <div
          className="inline-flex flex-wrap items-center gap-1 mb-4"
          role="group"
          aria-label={vi ? "Đổi loại tình huống" : "Change situation"}
        >
          {(Object.keys(labels) as BldDrillKind[]).map(item => (
            <Button
              variant={kind === item ? "primary" : "secondary"}
              size="md"
              key={item}
              type="button"
              onClick={() => choose(item)}
            >
              {vi ? labels[item].vi : labels[item].en}
            </Button>
          ))}
        </div>
        {loading ? (
          <SkeletonCard
            lines={4}
            className="p-0"
            label={
              vi ? "Đang nạp catalog bài tập BLD" : "Loading BLD drill catalog"
            }
          />
        ) : failed ? (
          <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mb-0">
            {vi
              ? "Không tải được bài tập khi đang ngoại tuyến. Hãy thử lại khi có mạng."
              : "The practice could not load while offline. Try again online."}
          </div>
        ) : active ? (
          <div className="flex flex-col gap-4">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                {vi ? copy.vi : copy.en}
              </span>
              <h5 className="text-xl font-semibold tracking-tight mt-2 mb-1">
                {active.key}
              </h5>
              <p className="text-muted mb-0">
                {vi ? copy.noteVi : copy.noteEn}
              </p>
            </div>
            <IconButton
              label={
                revealed
                  ? vi
                    ? "Ẩn đáp án"
                    : "Hide answer"
                  : vi
                    ? "Xem đáp án"
                    : "Show answer"
              }
              icon={
                revealed ? (
                  <EyeOff className="text-base" />
                ) : (
                  <Eye className="text-base" />
                )
              }
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 self-start"
              onClick={() => setRevealed(current => !current)}
            />
            {revealed && (
              <div className="rounded-card bg-surface bg-surface-2">
                <div className="p-5 sm:p-6">
                  <p className="text-sm text-muted mb-2">
                    {vi ? "Công thức để thực hiện" : "Algorithm to execute"}
                  </p>
                  <pre className="mb-4 text-wrap font-mono">
                    {preferred ?? active.algorithm}
                  </pre>
                  <div className="inline-flex flex-wrap items-center gap-1 w-full">
                    <Button
                      variant="danger"
                      size="md"
                      type="button"
                      onClick={() => grade(false)}
                    >
                      {vi ? "Chưa nhớ" : "Not yet"}
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      type="button"
                      onClick={() => grade(true)}
                    >
                      {vi ? "Đã nhớ" : "I remembered"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <IconButton
              label={vi ? "Đổi tình huống" : "Next situation"}
              icon={<RefreshCw className="text-base" />}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 self-start"
              onClick={next}
            />
          </div>
        ) : (
          <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mb-0">
            {vi
              ? "Chưa có bài tập cho tình huống này."
              : "No exercise is available for this situation."}
          </div>
        )}
      </div>
    </section>
  );
}
