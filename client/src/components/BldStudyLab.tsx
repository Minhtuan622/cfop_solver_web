/**
 * Soft Focus Workspace — BLD is taught as a calm four-step path.
 * One beginner action is visible at a time; drill, SRS and backup remain available after the lesson.
 */
import { BookOpenCheck, ChevronRight, Dices, Layers3, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BldMemoLab } from "@/components/BldMemoLab";
import { BldProfilePanel } from "@/components/BldProfilePanel";
import { BldTrainingLab } from "@/components/BldTrainingLab";
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

  return <section className="bld-learning-path">
    <header className="bld-learning-intro"><div><p>3-STYLE BLD · NHẬP MÔN</p><h2>{vi ? "Học bịt mắt theo từng việc nhỏ." : "Learn blindfolded solving one small task at a time."}</h2><span>{vi ? "Bạn không cần hiểu các từ như parity hay buffer ngay bây giờ. Bắt đầu bằng cách đọc vị trí, ghi nhớ cặp chữ rồi luyện một công thức." : "You do not need to know terms such as parity or buffer yet. Start by reading positions, remembering pairs, then practicing one algorithm."}</span></div><div className="bld-learning-readiness"><Layers3 className="h-5 w-5" /><b>{vi ? "Cần biết giải 3×3 cơ bản" : "Know basic 3×3 solving first"}</b><span>{vi ? "3-Style là bước nâng cao sau BLD nhập môn." : "3-Style is an advanced step after BLD basics."}</span></div></header>
    <nav className="bld-learning-steps" aria-label={vi ? "Lộ trình học 3-Style" : "3-Style learning path"}>{STEPS.map((label, index) => <button key={label} type="button" aria-current={lessonStep === index ? "step" : undefined} className={lessonStep === index ? "is-current" : result && index < 3 ? "is-ready" : ""} onClick={() => setLessonStep(index)}><span>{index + 1}</span><b>{stepLabels[index]}</b></button>)}</nav>
    {lessonStep === 0 && <section className="bld-lesson-card bld-lesson-card--concept"><div className="bld-lesson-number">01</div><div><p className="bld-lesson-eyebrow">{vi ? "Ý TƯỞNG CỐT LÕI" : "CORE IDEA"}</p><h3>{vi ? "Bạn nhìn cube trước, sau đó nhắm mắt và đưa từng mảnh về đúng chỗ." : "Inspect first, then solve one piece back to its place while blindfolded."}</h3><div className="bld-plain-points"><p><b>{vi ? "Nhìn:" : "Inspect:"}</b> {vi ? "xem sticker nào đang ở sai vị trí." : "notice which stickers are out of place."}</p><p><b>{vi ? "Ghi nhớ:" : "Remember:"}</b> {vi ? "biến các vị trí thành một chuỗi chữ ngắn." : "turn those locations into a short letter sequence."}</p><p><b>{vi ? "Thực hiện:" : "Execute:"}</b> {vi ? "đưa từng sticker về nhà bằng một công thức nhỏ." : "send each sticker home with a small algorithm."}</p></div><button type="button" className="bld-lesson-next" onClick={nextStep}>{vi ? "Tôi hiểu ý tưởng này" : "I understand the idea"}<ChevronRight className="h-4 w-4" /></button></div></section>}
    {lessonStep === 1 && <section className="bld-lesson-card bld-lesson-card--letters"><div className="bld-lesson-number">02</div><div><p className="bld-lesson-eyebrow">{vi ? "CHỮ CÁI LÀ GỢI NHỚ" : "LETTERS ARE MEMORY CUES"}</p><h3>{vi ? "Gắn một chữ cho mỗi vị trí sticker, rồi ghép hai chữ thành một hình ảnh." : "Give each sticker location a letter, then turn two letters into one image."}</h3><div className="bld-letter-example"><span>A</span><span>B</span><i>→</i><strong>{vi ? "“Áo Bơi”" : "“Air Balloon”"}</strong></div><p>{vi ? "Khi memo hiện “AB”, bạn không cần cố nhớ hai ký tự rời rạc; chỉ cần nhớ hình “áo bơi”. Chọn bất kỳ hình ảnh nào dễ nhớ với bạn." : "When a memo reads “AB”, do not hold two isolated characters. Recall one image instead. Pick any image that feels memorable to you."}</p><button type="button" className="bld-lesson-next" onClick={nextStep}>{vi ? "Tôi sẵn sàng thử memo" : "I am ready to try a memo"}<ChevronRight className="h-4 w-4" /></button></div></section>}
    {lessonStep === 2 && <section className="bld-lesson-card bld-lesson-card--memo"><div className="bld-lesson-number">03</div><div className="bld-memo-builder"><p className="bld-lesson-eyebrow">{vi ? "THỬ LẦN ĐẦU" : "FIRST TRY"}</p><h3>{vi ? "Tạo đường ghi nhớ từ một scramble." : "Build a memory path from one scramble."}</h3><p>{vi ? "Hệ thống sẽ chia kết quả thành Cạnh và Góc. Mỗi cặp chữ là một gợi ý để bạn tạo hình ảnh trong đầu." : "The result separates edges and corners. Each letter pair is a prompt for one image in your mind."}</p><div className="bld-builder-mode" role="tablist" aria-label={vi ? "Nguồn memo" : "Memo source"}><button type="button" role="tab" aria-selected={sourceMode === "scramble"} onClick={() => setSourceMode("scramble")}>SCRAMBLE</button><button type="button" role="tab" aria-selected={sourceMode === "state"} onClick={() => setSourceMode("state")}>54 STICKER</button></div><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={sourceMode === "scramble" ? "R U R' U' …" : "UUUUUUUUURRRRRRRRR…"} aria-label={vi ? "Scramble hoặc trạng thái để tạo đường ghi nhớ" : "Scramble or state to build a memory path"} /><div className="bld-builder-actions"><button type="button" className="bld-new-scramble" onClick={() => { setValue(randomScramble()); setResult(null); setError(""); }} title={vi ? "Tạo scramble mới" : "New scramble"}><Dices className="h-4 w-4" /></button><button type="button" onClick={() => void buildMemo()} disabled={loading} className="bld-build-memo">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? (vi ? "ĐANG TẠO" : "BUILDING") : (vi ? "TẠO ĐƯỜNG GHI NHỚ" : "BUILD MEMORY PATH")}</button></div>{error && <p className="bld-learning-error">{error}</p>}</div><aside className="bld-memo-preview"><CubeNet state={previewState} compact />{result ? <div className="bld-memo-result"><p>{vi ? "CẠNH" : "EDGES"}</p><b>{edgeMemo || "—"}</b><p>{vi ? "GÓC" : "CORNERS"}</p><b>{cornerMemo || "—"}</b>{result.analysis.special.parity && <span>{vi ? "Có một tình huống lẻ; bạn sẽ học nó sau." : "There is an odd-case situation; you will learn it later."}</span>}<button type="button" className="bld-lesson-next" onClick={() => setLessonStep(3)}>{vi ? "Mở bài luyện đầu tiên" : "Open the first practice"}<ChevronRight className="h-4 w-4" /></button></div> : <span>{vi ? "Kết quả memo sẽ hiện ở đây." : "Your memory path will appear here."}</span>}</aside></section>}
    {lessonStep === 3 && <section className="bld-lesson-card bld-lesson-card--practice"><div className="bld-lesson-number">04</div><div className="bld-practice-copy"><p className="bld-lesson-eyebrow">{vi ? "LUYỆN NHẸ" : "GENTLE PRACTICE"}</p><h3>{vi ? "Nhìn tình huống, tự đoán, rồi xem đáp án." : "See one situation, guess it, then check the answer."}</h3><p>{vi ? "Chưa cần bấm timer. Lần đầu, hãy xem đáp án trước; sau vài lượt, thử gọi lại công thức trước khi bấm “Xem đáp án”." : "You do not need the timer yet. At first, read the answer; after a few tries, recall it before selecting “Show answer”."}</p></div><BldTrainingLab result={result} profile={profile} onProfile={setProfile} language={language} /></section>}
    <details className="bld-learning-advanced"><summary><BookOpenCheck className="h-4 w-4" />{vi ? "Tiến độ & sao lưu — mở khi bạn đã quen" : "Progress & backup — open when you are ready"}</summary><div><section><h3>{vi ? "Ôn lại memo" : "Review your memo"}</h3><p>{vi ? "Sau khi đã tạo một vài đường ghi nhớ, hệ thống sẽ ưu tiên những mục cần ôn." : "After creating a few memory paths, this area prioritizes what needs review."}</p><BldMemoLab result={result} profile={profile} onProfile={setProfile} language={language} /></section><section><h3>{vi ? "Hồ sơ cá nhân" : "Personal profile"}</h3><p>{vi ? "Lưu thuật toán ưa thích, thẻ gợi nhớ, hoặc xuất/nhập tiến độ của bạn." : "Save preferred algorithms and memory cues, or export/import your progress."}</p><BldProfilePanel profile={profile} onProfile={setProfile} language={language} /></section></div></details>
  </section>;
}
