/**
 * Soft Focus Workspace — 3-Style lives in Study as one deliberate practice desk.
 * Drill is the primary apparatus; memo SRS and profile remain quiet support modes.
 */
import { Dices, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BldMemoLab } from "@/components/BldMemoLab";
import { BldProfilePanel } from "@/components/BldProfilePanel";
import { BldTrainingLab } from "@/components/BldTrainingLab";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { stateFromScramble } from "@/lib/fastCube";
import { readBldProfile, writeBldProfile } from "@/lib/bldProfile";
import { analyzeBldInBrowser, type BldResult } from "@/lib/solverRuntime";

const FACES = ["U", "R", "F", "D", "L", "B"] as const;
const SUFFIXES = ["", "2", "'"] as const;

function randomScramble(length = 20) {
  const moves: string[] = [];
  const sameAxis = (left: string, right: string) => (left === "U" || left === "D") === (right === "U" || right === "D") && (left === "R" || left === "L") === (right === "R" || right === "L");
  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    const previous = moves.at(-1)?.[0];
    const before = moves.at(-2)?.[0];
    if (face === previous || (previous && before && sameAxis(face, previous) && sameAxis(face, before))) continue;
    moves.push(face + SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]);
  }
  return moves.join(" ");
}

export function BldStudyLab({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const [sourceMode, setSourceMode] = useState<"scramble" | "state">("scramble");
  const [value, setValue] = useState(() => randomScramble());
  const [result, setResult] = useState<BldResult | null>(null);
  const [profile, setProfile] = useState(() => readBldProfile());
  const [activeDesk, setActiveDesk] = useState<"drill" | "memo" | "profile">("drill");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewState = useMemo(() => {
    if (sourceMode === "state") return value.trim().length === 54 ? value.trim() : SOLVED_STATE;
    try { return value.trim() ? stateFromScramble(value) : SOLVED_STATE; } catch { return SOLVED_STATE; }
  }, [sourceMode, value]);

  useEffect(() => { writeBldProfile(profile); }, [profile]);

  const buildMemo = async () => {
    const input = value.trim();
    if (!input || (sourceMode === "state" && input.length !== 54)) {
      setError(vi ? "Nhập scramble hợp lệ hoặc đủ 54 sticker trước khi tạo memo." : "Enter a valid scramble or all 54 stickers before building a memo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const next = await analyzeBldInBrowser(sourceMode, input);
      setResult(next);
      setActiveDesk("drill");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (vi ? "Không thể tạo memo 3-Style." : "Could not build the 3-Style memo."));
    } finally {
      setLoading(false);
    }
  };

  const memoSummary = result ? `${result.analysis.edges.memo.length} EDGE · ${result.analysis.corners.memo.length} CORNER` : (vi ? "CHƯA CÓ MEMO" : "NO MEMO YET");
  const deskLabel = activeDesk === "drill" ? "DRILL" : activeDesk === "memo" ? "MEMO SRS" : (vi ? "HỒ SƠ" : "PROFILE");

  return <section className="bld-study-lab space-y-5">
    <section className="bld-study-source"><div className="bld-study-source-copy"><p>3-STYLE BLD · {deskLabel}</p><h3>{vi ? "Luyện memo, special case và execution." : "Practice memo, special cases, and execution."}</h3><span>{vi ? "Tạo memo ngay tại Study; Drill, SRS và hồ sơ dùng cùng tiến độ đã lưu." : "Build a memo inside Study; Drill, SRS, and profile use the same saved progress."}</span></div><div className="bld-study-source-controls"><div className="bld-study-source-modes" role="tablist" aria-label={vi ? "Nguồn 3-Style" : "3-Style source"}><button type="button" role="tab" aria-selected={sourceMode === "scramble"} onClick={() => setSourceMode("scramble")}>{vi ? "SCRAMBLE" : "SCRAMBLE"}</button><button type="button" role="tab" aria-selected={sourceMode === "state"} onClick={() => setSourceMode("state")}>{vi ? "54 STICKER" : "54 STICKERS"}</button></div><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={sourceMode === "scramble" ? "R U R' U' …" : "UUUUUUUUURRRRRRRRR…"} aria-label={vi ? "Scramble hoặc trạng thái để tạo memo 3-Style" : "Scramble or state for 3-Style memo"} /><div className="bld-study-source-actions"><button type="button" onClick={() => { setValue(randomScramble()); setResult(null); setError(""); }} title={vi ? "Tạo scramble mới" : "New scramble"}><Dices className="h-4 w-4" /></button><button type="button" onClick={() => void buildMemo()} disabled={loading} className="bld-study-build">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? (vi ? "ĐANG TẠO" : "BUILDING") : (vi ? "TẠO MEMO" : "BUILD MEMO")}</button></div>{error && <p className="bld-study-error">{error}</p>}</div><div className="bld-study-preview"><CubeNet state={previewState} compact /><span>{memoSummary}</span></div></section>

    <section className="bld-study-practice"><div className="bld-study-practice-tabs" role="tablist" aria-label={vi ? "Khu luyện tập 3-Style" : "3-Style practice desk"}><button type="button" role="tab" aria-selected={activeDesk === "drill"} onClick={() => setActiveDesk("drill")}>DRILL</button><button type="button" role="tab" aria-selected={activeDesk === "memo"} onClick={() => setActiveDesk("memo")}>MEMO SRS</button><button type="button" role="tab" aria-selected={activeDesk === "profile"} onClick={() => setActiveDesk("profile")}>{vi ? "HỒ SƠ" : "PROFILE"}</button></div>{activeDesk === "drill" ? <div className="bld-study-drill-layout"><BldTrainingLab result={result} profile={profile} onProfile={setProfile} language={language} /><div className="bld-study-cube-reference"><p>{vi ? "THAM CHIẾU CUBE" : "CUBE REFERENCE"}</p><Cube3DGuide state={previewState} step={0} crossColor="U" alignCross /></div></div> : activeDesk === "memo" ? <BldMemoLab result={result} profile={profile} onProfile={setProfile} language={language} /> : <BldProfilePanel profile={profile} onProfile={setProfile} language={language} />}</section>
  </section>;
}
