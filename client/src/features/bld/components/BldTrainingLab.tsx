/**
 * Soft Focus Workspace — the first BLD practice is intentionally one calm recall task.
 * Advanced labels remain secondary; grading continues to feed the existing BLD SRS profile.
 */
import { Eye, EyeOff, RefreshCw } from "@/components/ui/BootstrapIcon";
import { IconButton, SkeletonCard } from "@/components/ui/BootstrapUI";
import { useEffect, useMemo, useState } from "react";
import { firstCatalogAlgorithm, gradeMemo, preferenceKey, recordDrillAttempt, type BldDrillKind, type BldProfile } from "@/features/bld";
import type { BldResult } from "@/lib/solverRuntime";

type CatalogEntry = { key: string; algorithm: string; kind: BldDrillKind };
type RawCatalog = Record<string, unknown>;
const MAIN = "https://raw.githubusercontent.com/nbwzx/blddb/main/assets/json/";
const labels: Record<BldDrillKind, { vi: string; en: string; noteVi: string; noteEn: string }> = {
  parity: { vi: "Một mảnh bị lẻ", en: "One odd piece", noteVi: "Đây là tình huống có một lần đổi chỗ lẻ; bạn sẽ gặp nó trong một số lượt giải bịt mắt.", noteEn: "This is an odd swap situation that appears in some blindfolded solves." },
  flip: { vi: "Hai cạnh bị lật", en: "Two flipped edges", noteVi: "Đây là tình huống hai cạnh quay sai hướng cùng lúc.", noteEn: "This is when two edges are flipped at the same time." },
  twist: { vi: "Một góc bị xoay", en: "One twisted corner", noteVi: "Đây là tình huống một góc quay sai hướng.", noteEn: "This is when one corner is twisted the wrong way." },
};
function entries(raw: RawCatalog, kind: BldDrillKind): CatalogEntry[] { return Object.entries(raw).map(([key, value]) => ({ key, algorithm: firstCatalogAlgorithm(value) ?? "", kind })).filter((item) => item.algorithm).slice(0, 360); }

export function BldTrainingLab({ result, profile, onProfile, language }: { result: BldResult | null; profile: BldProfile; onProfile: (profile: BldProfile) => void; language: "vi" | "en" }) {
  const vi = language === "vi";
  const [kind, setKind] = useState<BldDrillKind>("parity");
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { let live = true; const request = (url: string) => fetch(url).then((response) => response.ok ? response.json() : Promise.reject(new Error(url))); Promise.all([request(`${MAIN}parityAlgToInfoManmade.json`), request(`${MAIN}twoFlipsAlgToInfo.json`), request(`${MAIN}twistsAlgToInfo.json`)]).then(([parity, flip, twist]) => { if (live) { setCatalog([...entries(parity, "parity"), ...entries(flip, "flip"), ...entries(twist, "twist")]); setLoading(false); } }).catch(() => { if (live) { setFailed(true); setLoading(false); } }); return () => { live = false; }; }, []);
  const matches = useMemo(() => catalog.filter((item) => item.kind === kind), [catalog, kind]);
  const active = matches[cursor % Math.max(1, matches.length)];
  const memoCount = (result?.analysis.edges.memo.length ?? 0) + (result?.analysis.corners.memo.length ?? 0);
  const choose = (next: BldDrillKind) => { setKind(next); setCursor(0); setRevealed(false); };
  const next = () => { setCursor((current) => current + 1); setRevealed(false); };
  const grade = (remembered: boolean) => { if (!active) return; const key = `guided:${active.kind}:${active.key}`; let nextProfile = gradeMemo(profile, { key, memo: `${active.kind}:${active.key}`, kind: "formula" }, remembered ? "good" : "again"); nextProfile = recordDrillAttempt(nextProfile, { kind: active.kind, key: active.key, grade: remembered ? "good" : "again", durationMs: 0 }); onProfile(nextProfile); next(); };
  const preferred = active ? profile.preferredAlgorithms[preferenceKey(active.kind, active.key)]?.algorithm : undefined;
  const copy = labels[kind];
  return <section className="card"><div className="card-header"><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "Bài tập công thức" : "Algorithm practice"}</p><h4 className="h5 mb-1">{vi ? "Một tình huống, một đáp án." : "One situation, one answer."}</h4><p className="small text-body-secondary mb-0">{memoCount ? (vi ? `Memo vừa tạo có ${memoCount} vị trí cần nhớ. Bài này bổ sung cho các tình huống đặc biệt.` : `Your memo has ${memoCount} locations. This lesson covers occasional special situations.`) : (vi ? "Bạn có thể học bài này trước; tạo memo ở bước 3 khi muốn thử trên khối thật." : "You can learn this first; build a memo in step 3 when ready to try a real cube.")}</p></div><div className="card-body"><div className="btn-group mb-3" role="group" aria-label={vi ? "Đổi loại tình huống" : "Change situation"}>{(Object.keys(labels) as BldDrillKind[]).map((item) => <button key={item} type="button" onClick={() => choose(item)} className={kind === item ? "btn btn-primary" : "btn btn-outline-secondary"}>{vi ? labels[item].vi : labels[item].en}</button>)}</div>{loading ? <SkeletonCard lines={4} className="border-0 p-0 shadow-none" label={vi ? "Đang nạp catalog bài tập BLD" : "Loading BLD drill catalog"} /> : failed ? <div className="alert alert-warning mb-0">{vi ? "Không tải được bài tập khi đang ngoại tuyến. Hãy thử lại khi có mạng." : "The practice could not load while offline. Try again online."}</div> : active ? <div className="vstack gap-3"><div><span className="badge text-bg-secondary">{vi ? copy.vi : copy.en}</span><h5 className="h3 mt-2 mb-1">{active.key}</h5><p className="text-body-secondary mb-0">{vi ? copy.noteVi : copy.noteEn}</p></div><IconButton label={revealed ? (vi ? "Ẩn đáp án" : "Hide answer") : (vi ? "Xem đáp án" : "Show answer")} icon={revealed ? <EyeOff className="fs-6" /> : <Eye className="fs-6" />} className="btn btn-outline-secondary align-self-start" onClick={() => setRevealed((current) => !current)} />{revealed && <div className="card bg-body-tertiary"><div className="card-body"><p className="small text-body-secondary mb-2">{vi ? "Công thức để thực hiện" : "Algorithm to execute"}</p><pre className="mb-3 text-wrap font-monospace">{preferred ?? active.algorithm}</pre><div className="btn-group w-100"><button type="button" onClick={() => grade(false)} className="btn btn-outline-danger">{vi ? "Chưa nhớ" : "Not yet"}</button><button type="button" onClick={() => grade(true)} className="btn btn-primary">{vi ? "Đã nhớ" : "I remembered"}</button></div></div></div>}<IconButton label={vi ? "Đổi tình huống" : "Next situation"} icon={<RefreshCw className="fs-6" />} className="btn btn-outline-secondary align-self-start" onClick={next} /></div> : <div className="alert alert-secondary mb-0">{vi ? "Chưa có bài tập cho tình huống này." : "No exercise is available for this situation."}</div>}</div></section>;
}
