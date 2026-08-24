/**
 * Soft Focus Workspace — BLD is taught as a calm four-step path.
 * One beginner action is visible at a time; drill, SRS and backup remain available after the lesson.
 */
import { BookOpenCheck, ChevronRight, Dices, Layers3, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BldMemoLab } from "@/components/BldMemoLab";
import { BldProfilePanel } from "@/components/BldProfilePanel";
import { BldTrainingLab } from "@/components/BldTrainingLab";
import { StatusFeedback } from "@/components/BootstrapUI";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { stateFromScramble } from "@/lib/fastCube";
import { readBldProfile, writeBldProfile } from "@/lib/bldProfile";
import { analyzeBldInBrowser, type BldResult } from "@/lib/solverRuntime";

const FACES = ["U", "R", "F", "D", "L", "B"] as const;
const SUFFIXES = ["", "2", "'"] as const;
const STEPS = ["BLD LÀ GÌ?", "GẮN CHỮ", "TẠO MEMO", "LUYỆN NHẸ"] as const;

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
  const [lessonStep, setLessonStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const previewState = useMemo(() => {
    if (sourceMode === "state") return value.trim().length === 54 ? value.trim() : SOLVED_STATE;
    try { return value.trim() ? stateFromScramble(value) : SOLVED_STATE; } catch { return SOLVED_STATE; }
  }, [sourceMode, value]);
  const edgeMemo = result?.analysis.edges.memo.join(" · ") ?? "";
  const cornerMemo = result?.analysis.corners.memo.join(" · ") ?? "";

  useEffect(() => { writeBldProfile(profile); }, [profile]);
  const buildMemo = async () => {
    const input = value.trim();
    if (!input || (sourceMode === "state" && input.length !== 54)) { setError(vi ? "Nhập scramble hợp lệ hoặc đủ 54 sticker trước khi tạo đường ghi nhớ." : "Enter a valid scramble or all 54 stickers before building a memo."); return; }
    setLoading(true); setError("");
    try { const next = await analyzeBldInBrowser(sourceMode, input); setResult(next); setLessonStep(2); }
    catch (reason) { setError(reason instanceof Error ? reason.message : (vi ? "Không thể tạo đường ghi nhớ." : "Could not build the memory path.")); }
    finally { setLoading(false); }
  };
  const nextStep = () => setLessonStep((current) => Math.min(3, current + 1));
  const stepLabels = vi ? STEPS : ["WHAT IS BLD?", "ASSIGN LETTERS", "BUILD MEMO", "GENTLE PRACTICE"];

  return <section className="card card-body mt-3">
    <header className="row g-3 align-items-center"><div className="col-12 col-lg"><p className="text-muted small mb-1">3-STYLE BLD · {vi ? "NHẬP MÔN" : "BEGINNER"}</p><h2 className="">{vi ? "Học bịt mắt theo từng việc nhỏ." : "Learn blindfolded solving one small task at a time."}</h2><p className="mb-0">{vi ? "Bạn không cần hiểu các từ như parity hay buffer ngay bây giờ. Bắt đầu bằng cách đọc vị trí, ghi nhớ cặp chữ rồi luyện một công thức." : "You do not need to know terms such as parity or buffer yet. Start by reading positions, remembering pairs, then practicing one algorithm."}</p></div><div className="col-12 col-lg-auto alert alert-info mb-0"><Layers3 className="me-1" /><b>{vi ? "Cần biết giải 3×3 cơ bản" : "Know basic 3×3 solving first"}</b><p className="small mb-0">{vi ? "3-Style là bước nâng cao sau BLD nhập môn." : "3-Style is an advanced step after BLD basics."}</p></div></header>
    <nav className="nav nav-pills mt-4 gap-2" aria-label={vi ? "Lộ trình học 3-Style" : "3-Style learning path"}>{STEPS.map((label, index) => <button key={label} type="button" aria-current={lessonStep === index ? "step" : undefined} className={lessonStep === index ? "nav-link active" : "nav-link"} onClick={() => setLessonStep(index)}>{index + 1}. {stepLabels[index]}</button>)}</nav>
    {lessonStep === 0 && <section className="card card-body mt-4"><p className="text-muted small">01 · {vi ? "Ý tưởng cốt lõi" : "Core idea"}</p><h3 className="">{vi ? "Bạn nhìn cube trước, sau đó nhắm mắt và đưa từng mảnh về đúng chỗ." : "Inspect first, then solve one piece back to its place while blindfolded."}</h3><ul><li><b>{vi ? "Nhìn:" : "Inspect:"}</b> {vi ? "xem sticker nào đang ở sai vị trí." : "notice which stickers are out of place."}</li><li><b>{vi ? "Ghi nhớ:" : "Remember:"}</b> {vi ? "biến các vị trí thành một chuỗi chữ ngắn." : "turn those locations into a short letter sequence."}</li><li><b>{vi ? "Thực hiện:" : "Execute:"}</b> {vi ? "đưa từng sticker về nhà bằng một công thức nhỏ." : "send each sticker home with a small algorithm."}</li></ul><button type="button" className="btn btn-primary" onClick={nextStep}>{vi ? "Tôi hiểu ý tưởng này" : "I understand the idea"} <ChevronRight className="" /></button></section>}
    {lessonStep === 1 && <section className="card card-body mt-4"><p className="text-muted small">02 · {vi ? "Chữ cái là gợi nhớ" : "Letters are memory cues"}</p><h3 className="">{vi ? "Gắn một chữ cho mỗi vị trí sticker, rồi ghép hai chữ thành một hình ảnh." : "Give each sticker location a letter, then turn two letters into one image."}</h3><p className="display-6">A B → <strong>{vi ? "“Áo Bơi”" : "“Air Balloon”"}</strong></p><p>{vi ? "Khi memo hiện “AB”, bạn không cần cố nhớ hai ký tự rời rạc; chỉ cần nhớ hình “áo bơi”. Chọn bất kỳ hình ảnh nào dễ nhớ với bạn." : "When a memo reads “AB”, do not hold two isolated characters. Recall one image instead. Pick any image that feels memorable to you."}</p><button type="button" className="btn btn-primary" onClick={nextStep}>{vi ? "Tôi sẵn sàng thử memo" : "I am ready to try a memo"} <ChevronRight className="" /></button></section>}
    {lessonStep === 2 && <section className="card card-body mt-4"><p className="text-muted small">03 · {vi ? "Thử lần đầu" : "First try"}</p><div className="row g-4"><div className="col-12 col-lg-8"><h3 className="">{vi ? "Tạo đường ghi nhớ từ một scramble." : "Build a memory path from one scramble."}</h3><p>{vi ? "Hệ thống sẽ chia kết quả thành Cạnh và Góc. Mỗi cặp chữ là một gợi ý để bạn tạo hình ảnh trong đầu." : "The result separates edges and corners. Each letter pair is a prompt for one image in your mind."}</p><div className="btn-group" role="tablist" aria-label={vi ? "Nguồn memo" : "Memo source"}><button type="button" role="tab" aria-selected={sourceMode === "scramble"} onClick={() => setSourceMode("scramble")} className={sourceMode === "scramble" ? "btn btn-primary" : "btn btn-outline-primary"}>Scramble</button><button type="button" role="tab" aria-selected={sourceMode === "state"} onClick={() => setSourceMode("state")} className={sourceMode === "state" ? "btn btn-primary" : "btn btn-outline-primary"}>54 sticker</button></div><label className="form-label mt-3" htmlFor="bld-memo-source">{sourceMode === "scramble" ? (vi ? "Scramble để tạo memo" : "Scramble to build a memo") : (vi ? "State 54 sticker" : "54-sticker state")}</label><textarea id="bld-memo-source" className="form-control" rows={5} value={value} onChange={(event) => setValue(event.target.value)} placeholder={sourceMode === "scramble" ? "R U R' U' …" : "UUUUUUUUURRRRRRRRR…"} aria-describedby="bld-memo-hint" /><div id="bld-memo-hint" className="form-text">{sourceMode === "scramble" ? (vi ? "Dùng notation 3×3 chuẩn." : "Use standard 3×3 notation.") : (vi ? "Dán đúng 54 sticker theo thứ tự mặt cube." : "Paste all 54 stickers in cube face order.")}</div><div className="d-flex gap-2 mt-3"><button type="button" className="btn btn-outline-secondary" onClick={() => { setValue(randomScramble()); setResult(null); setError(""); }} title={vi ? "Tạo scramble mới" : "New scramble"}><Dices className="" /></button><button type="button" onClick={() => void buildMemo()} disabled={loading} className="btn btn-primary">{loading ? <Loader2 className="" /> : <Sparkles className="" />} {loading ? (vi ? "Đang tạo" : "Building") : (vi ? "Tạo đường ghi nhớ" : "Build memory path")}</button></div>{error ? <div className="mt-3"><StatusFeedback tone="danger" title={vi ? "Không thể tạo memo" : "Could not build memo"}>{error}</StatusFeedback></div> : null}</div><aside className="col-12 col-lg-4"><div className="border rounded p-3 text-center"><CubeNet state={previewState} compact /></div>{result ? <div className="card card-body mt-3"><p className="small text-muted mb-1">{vi ? "Cạnh" : "Edges"}</p><b>{edgeMemo || "—"}</b><p className="small text-muted mt-3 mb-1">{vi ? "Góc" : "Corners"}</p><b>{cornerMemo || "—"}</b>{result.analysis.special.parity && <p className="alert alert-warning mt-3 mb-0">{vi ? "Có một tình huống lẻ; bạn sẽ học nó sau." : "There is an odd-case situation; you will learn it later."}</p>}<button type="button" className="btn btn-primary mt-3" onClick={() => setLessonStep(3)}>{vi ? "Mở bài luyện đầu tiên" : "Open the first practice"} <ChevronRight className="" /></button></div> : <p className="text-muted mt-3">{vi ? "Kết quả memo sẽ hiện ở đây." : "Your memory path will appear here."}</p>}</aside></div></section>}
    {lessonStep === 3 && <section className="card card-body mt-4"><p className="text-muted small">04 · {vi ? "Luyện nhẹ" : "Gentle practice"}</p><h3 className="">{vi ? "Nhìn tình huống, tự đoán, rồi xem đáp án." : "See one situation, guess it, then check the answer."}</h3><p>{vi ? "Chưa cần bấm timer. Lần đầu, hãy xem đáp án trước; sau vài lượt, thử gọi lại công thức trước khi bấm “Xem đáp án”." : "You do not need the timer yet. At first, read the answer; after a few tries, recall it before selecting “Show answer”."}</p><BldTrainingLab result={result} profile={profile} onProfile={setProfile} language={language} /></section>}
    <details className="card card-body mt-4"><summary><BookOpenCheck className="" /> {vi ? "Tiến độ & sao lưu — mở khi bạn đã quen" : "Progress & backup — open when you are ready"}</summary><div className="row g-4 mt-1"><section className="col-12 col-lg-6"><h3 className="">{vi ? "Ôn lại memo" : "Review your memo"}</h3><p>{vi ? "Sau khi đã tạo một vài đường ghi nhớ, hệ thống sẽ ưu tiên những mục cần ôn." : "After creating a few memory paths, this area prioritizes what needs review."}</p><BldMemoLab result={result} profile={profile} onProfile={setProfile} language={language} /></section><section className="col-12 col-lg-6"><h3 className="">{vi ? "Hồ sơ cá nhân" : "Personal profile"}</h3><p>{vi ? "Lưu thuật toán ưa thích, thẻ gợi nhớ, hoặc xuất/nhập tiến độ của bạn." : "Save preferred algorithms and memory cues, or export/import your progress."}</p><BldProfilePanel profile={profile} onProfile={setProfile} language={language} /></section></div></details>
  </section>;
}
