/* Tailwind-first full BLD library: fetches only when the learner opens the full catalog. */
import { ChevronLeftIcon, ChevronRight, Search } from "@/components/ui/Icon";
import { IconButton, SkeletonList } from "@/components/ui/StudioUI";
import {
  loadFullBldCatalog,
  type BldCatalogCase,
  type BldCatalogGroup,
} from "@/features/bld";
import type { StarterFormula } from "@/features/bld";
import { useEffect, useMemo, useState } from "react";
import { CubeNet } from "@/components/common/CubeNet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";
import { applyFastMoves, SOLVED_FAST_STATE } from "@/lib/fastCube";

/** Memoized 3×3 net of the algorithm applied to a solved cube (for the "net" preview). */
const previewCache = new Map<string, string>();
function previewStateOf(algorithm: string) {
  const cached = previewCache.get(algorithm);
  if (cached) return cached;
  let state = SOLVED_FAST_STATE;
  try {
    state = applyFastMoves(SOLVED_FAST_STATE, algorithm);
  } catch {
    /* keep solved on parse failure */
  }
  previewCache.set(algorithm, state);
  return state;
}

const PAGE_SIZE = 24;
const groupLabel = (group: BldCatalogGroup, vi: boolean) =>
  group === "edge"
    ? vi
      ? "Cạnh"
      : "Edges"
    : group === "corner"
      ? vi
        ? "Góc"
        : "Corners"
      : vi
        ? "Đặc biệt"
        : "Special";
const kindLabel = (kind: BldCatalogCase["kind"], vi: boolean) =>
  ({
    edge: vi ? "Cạnh" : "Edge",
    corner: vi ? "Góc" : "Corner",
    parity: "Parity",
    flip: vi ? "Lật cạnh" : "Edge flip",
    twist: vi ? "Xoay góc" : "Corner twist",
  })[kind];
function toFormula(entry: BldCatalogCase, algorithm: string): StarterFormula {
  return {
    group: entry.group,
    kind: entry.kind,
    key: entry.key,
    titleVi: `${kindLabel(entry.kind, true)} · ${entry.key}`,
    titleEn: `${kindLabel(entry.kind, false)} · ${entry.key}`,
    algorithm,
    noteVi:
      "Biến thể từ catalog 3-Style đầy đủ. Hãy chọn một biến thể, sau đó dùng target scramble để tự kiểm.",
    noteEn:
      "A full 3-Style catalog variant. Choose one variant, then use target scramble self-check.",
  };
}

export function BldFullAlgorithmCatalog({
  language,
  onChoose,
}: {
  language: "vi" | "en";
  onChoose: (formula: StarterFormula) => void;
}) {
  const vi = language === "vi";
  const [cases, setCases] = useState<BldCatalogCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [group, setGroup] = useState<BldCatalogGroup>("edge");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<BldCatalogCase | null>(null);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    loadFullBldCatalog()
      .then(next => {
        if (live) {
          setCases(next);
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
  }, [reloadKey]);
  const filtered = useMemo(
    () =>
      cases.filter(
        entry =>
          entry.group === group &&
          (entry.key.toLowerCase().includes(query.trim().toLowerCase()) ||
            entry.algorithms.some(algorithm =>
              algorithm.toLowerCase().includes(query.trim().toLowerCase())
            ))
      ),
    [cases, group, query]
  );
  const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const shown = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selectGroup = (next: BldCatalogGroup) => {
    setGroup(next);
    setPage(0);
    setActive(null);
  };
  return (
    <section className="rounded-card bg-surface mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            {vi ? "THƯ VIỆN ĐẦY ĐỦ" : "FULL LIBRARY"}
          </p>
          <h4 className="text-sm font-semibold tracking-tight mb-0">
            {vi
              ? "Toàn bộ case 3-Style và các biến thể algorithm"
              : "All 3-Style cases and algorithm variants"}
          </h4>
        </div>
        <span className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
          {vi
            ? "Ngoại tuyến sẵn sàng sau lần nạp đầu"
            : "Ready offline after first load"}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        {loading ? (
          <SkeletonList
            rows={6}
            label={
              vi
                ? "Đang nạp catalog 3-Style đầy đủ"
                : "Loading full 3-Style catalog"
            }
          />
        ) : failed ? (
          <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mb-0 flex flex-wrap items-center justify-between gap-3">
            <span>
              {vi
                ? "Không tải được catalog khi đang ngoại tuyến. Hãy thử lại khi có mạng."
                : "The catalog could not load while offline. Try again online."}
            </span>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setReloadKey(key => key + 1)}
            >
              {vi ? "Thử lại" : "Retry"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
              <div
                className="inline-flex flex-wrap items-center gap-1"
                role="group"
                aria-label={
                  vi ? "Nhóm thư viện 3-Style" : "3-Style library group"
                }
              >
                {(["edge", "corner", "special"] as BldCatalogGroup[]).map(
                  item => (
                    <Button
                      variant={group === item ? "primary" : "secondary"}
                      size="md"
                      key={item}
                      type="button"
                      onClick={() => selectGroup(item)}
                    >
                      {groupLabel(item, vi)}
                    </Button>
                  )
                )}
              </div>
              <div
                className="flex w-full items-stretch"
                style={{ maxWidth: "19rem" }}
              >
                <span className="inline-flex items-center bg-surface-2 px-3 text-sm text-muted first:rounded-l-field last:rounded-r-field">
                  <Search className="text-base" />
                </span>
                <Input
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value);
                    setPage(0);
                  }}

                  placeholder={
                    vi
                      ? "Tìm key hoặc thuật toán, ví dụ ACE"
                      : "Find key or algorithm, e.g. ACE"
                  }
                  aria-label={
                    vi
                      ? "Tìm case hoặc thuật toán 3-Style"
                      : "Search 3-Style cases or algorithms"
                  }
                />
              </div>
            </div>
            <p className="text-sm text-muted">
              {filtered.length.toLocaleString()}{" "}
              {vi
                ? "case phù hợp; mỗi case có toàn bộ biến thể từ catalog."
                : "matching cases; each case retains every catalog variant."}
            </p>
            <div className="grid grid-cols-12 gap-2">
              {shown.map(entry => (
                <div
                  className="col-span-12 md:col-span-6"
                  key={`${entry.kind}-${entry.key}`}
                >
                  <article
                    className={
                      active?.kind === entry.kind && active.key === entry.key
                        ? "rounded-card bg-surface h-full"
                        : "rounded-card bg-surface h-full"
                    }
                  >
                    <div className="p-5 sm:p-6 flex items-center justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                          {kindLabel(entry.kind, vi)}
                        </span>
                        <strong className="block mt-1">{entry.key}</strong>
                        <small className="text-muted">
                          {entry.algorithms.length.toLocaleString()}{" "}
                          {vi ? "biến thể" : "variants"}
                        </small>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => setActive(entry)}
                      >
                        {vi ? "Xem biến thể" : "View variants"}
                      </Button>
                    </div>
                  </article>
                </div>
              ))}
            </div>
            {!shown.length && (
              <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
                {vi
                  ? "Không có case khớp với bộ lọc."
                  : "No case matches this filter."}
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <IconButton
                label={vi ? "Trang case trước" : "Previous case page"}
                icon={<ChevronLeftIcon className="text-base" />}
                onClick={() => setPage(current => Math.max(0, current - 1))}
                disabled={!page}
                className={`${buttonClass("secondary", "md")}`}
              />
              <span className="text-sm text-muted">
                {page + 1}/{maxPage + 1}
              </span>
              <IconButton
                label={vi ? "Trang case kế" : "Next case page"}
                icon={<ChevronRight className="text-base" />}
                onClick={() =>
                  setPage(current => Math.min(maxPage, current + 1))
                }
                disabled={page >= maxPage}
                className={`${buttonClass("secondary", "md")}`}
              />
            </div>
            {active && (
              <div className="rounded-card bg-surface mt-6">
                <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
                  <CubeNet
                    state={previewStateOf(active.algorithms[0]!)}
                    compact
                  />
                  <div>
                    <strong>
                      {kindLabel(active.kind, vi)} · {active.key}
                    </strong>
                    <span className="block text-sm text-muted mt-1">
                      {active.algorithms.length.toLocaleString()}{" "}
                      {vi ? "biến thể" : "variants"}
                    </span>
                    <span className="block text-xs text-muted mt-1">
                      {vi
                        ? "Net = áp dụng công thức vào cube đã giải."
                        : "Net = the algorithm applied to a solved cube."}
                    </span>
                  </div>
                </div>
                <div className="bg-transparent">
                  {active.algorithms.map((algorithm, index) => (
                    <div
                      className="block px-4 py-3 text-sm"
                      key={`${active.key}-${index}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <code className="text-sm break-words">{algorithm}</code>
                        <Button
                          variant="primary"
                          size="sm"
                          className="md:self-start"
                          type="button"
                          onClick={() => onChoose(toFormula(active, algorithm))}
                        >
                          {vi ? "Dùng biến thể này" : "Use this variant"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
