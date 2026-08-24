/* Bootstrap-first 3×3 BLD learning route: orient → build memo → drill → review. */
import { BookOpenCheck, Check, ChevronRight, Dices, Layers3, Loader2, Sparkles } from "@/components/BootstrapIcon";
import { SkeletonCard, StatusFeedback } from "@/components/BootstrapUI";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { BldMemoLab } from "@/components/BldMemoLab";
import { BldProfilePanel } from "@/components/BldProfilePanel";
import { BldTrainingLab } from "@/components/BldTrainingLab";
import { stateFromScramble } from "@/lib/fastCube";
import { readBldLearningPath, writeBldLearningPath, type BldLearningPathProgress } from "@/lib/bldLearningPath";
import { readBldProfile, writeBldProfile } from "@/lib/bldProfile";
import { analyzeBldInBrowser, type BldResult } from "@/lib/solverRuntime";
import { useEffect, useMemo, useState } from "react";

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

type Stage = { title: string; subtitle: string; shortTitle: string };

export function BldStudyLab({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const stages: Stage[] = vi
    ? [
      { shortTitle: "Định hướng", title: "Hiểu một lượt BLD", subtitle: "Xem → ghi nhớ → thực hiện" },
      { shortTitle: "Memo", title: "Tạo memo đầu tiên", subtitle: "Đổi scramble thành cạnh và góc" },
      { shortTitle: "Drill", title: "Luyện tình huống đặc biệt", subtitle: "Parity, flip và twist" },
      { shortTitle: "Ôn tập", title: "Ôn mỗi ngày", subtitle: "SRS, profile và thói quen" },
    ]
    : [
      { shortTitle: "Orient", title: "Understand one BLD solve", subtitle: "Inspect → memorize → execute" },
      { shortTitle: "Memo", title: "Build your first memo", subtitle: "Turn a scramble into edges and corners" },
      { shortTitle: "Drill", title: "Practice special cases", subtitle: "Parity, flips and twists" },
      { shortTitle: "Review", title: "Review daily", subtitle: "SRS, profile and routine" },
    ];
  const [sourceMode, setSourceMode] = useState<"scramble" | "state">("scramble");
  const [value, setValue] = useState(() => randomScramble());
  const [result, setResult] = useState<BldResult | null>(null);
  const [profile, setProfile] = useState(() => readBldProfile());
  const [path, setPath] = useState<BldLearningPathProgress>(() => readBldLearningPath());
  const [stageIndex, setStageIndex] = useState(() => readBldLearningPath().lastStage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewState = useMemo(() => {
    if (sourceMode === "state") return value.trim().length === 54 ? value.trim() : SOLVED_STATE;
    try { return value.trim() ? stateFromScramble(value) : SOLVED_STATE; } catch { return SOLVED_STATE; }
  }, [sourceMode, value]);
  const edgeMemo = result?.analysis.edges.memo.join(" · ") ?? "";
  const cornerMemo = result?.analysis.corners.memo.join(" · ") ?? "";
  const stageDone = [path.orientationDone, path.memoDone || Boolean(result), profile.drillAttempts.length >= 3, Object.keys(profile.memoRecords).length > 0 || profile.drillAttempts.length > 0];
  const completedCount = stageDone.filter(Boolean).length;

  useEffect(() => { writeBldProfile(profile); }, [profile]);
  useEffect(() => { writeBldLearningPath({ ...path, lastStage: stageIndex }); }, [path, stageIndex]);
  const moveToStage = (next: number) => setStageIndex(Math.min(3, Math.max(0, next)));
  const completeOrientation = () => { setPath((current) => ({ ...current, orientationDone: true })); moveToStage(1); };
  const buildMemo = async () => {
    const input = value.trim();
    if (!input || (sourceMode === "state" && input.length !== 54)) { setError(vi ? "Nhập scramble hợp lệ hoặc đủ 54 sticker trước khi tạo đường ghi nhớ." : "Enter a valid scramble or all 54 stickers before building a memo."); return; }
    setLoading(true); setError("");
    try {
      const next = await analyzeBldInBrowser(sourceMode, input);
      setResult(next);
      setPath((current) => ({ ...current, memoDone: true }));
      moveToStage(2);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (vi ? "Không thể tạo đường ghi nhớ." : "Could not build the memory path."));
    } finally { setLoading(false); }
  };

  return <section className="card mt-3">
    <div className="card-header d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
      <div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">3×3 BLD · {vi ? "LỘ TRÌNH HỌC" : "LEARNING PATH"}</p><h2 className="h3 mb-1">{vi ? "Từ lần đầu tạo memo đến nhịp ôn tập hằng ngày." : "From your first memo to a daily review routine."}</h2><p className="text-body-secondary mb-0">{vi ? "Mỗi chặng chỉ yêu cầu một việc nhỏ, rồi dẫn bạn đến chặng kế tiếp." : "Each stage asks for one small action before guiding you onward."}</p></div>
      <div className="alert alert-info mb-0 py-2 px-3"><Layers3 className="fs-5 me-1" /><strong>{completedCount}/4</strong> {vi ? "chặng đã có tiến độ" : "stages have progress"}</div>
    </div>
    <div className="card-body"><div className="progress mb-4" aria-label={vi ? "Tiến độ lộ trình BLD" : "BLD learning path progress"}><div className="progress-bar" style={{ width: `${completedCount * 25}%` }} /></div>
      <div className="row g-4"><aside className="col-12 col-xl-4"><div className="list-group" role="tablist" aria-label={vi ? "Các chặng học BLD" : "BLD learning stages"}>{stages.map((stage, index) => <button key={stage.shortTitle} type="button" role="tab" aria-selected={stageIndex === index} onClick={() => moveToStage(index)} className={stageIndex === index ? "list-group-item list-group-item-action active" : "list-group-item list-group-item-action"}><div className="d-flex align-items-center justify-content-between gap-2"><span><span className="small d-block opacity-75">{index + 1}. {stage.shortTitle}</span><strong className="d-block">{stage.title}</strong><span className="small d-block">{stage.subtitle}</span></span>{stageDone[index] ? <Check className="fs-5 flex-shrink-0" /> : <span className="badge text-bg-secondary flex-shrink-0">{index + 1}</span>}</div></button>)}</div><div className="alert alert-secondary small mt-3 mb-0"><BookOpenCheck className="fs-6 me-1" />{vi ? "Yêu cầu trước khi bắt đầu: bạn đã giải được 3×3 cơ bản khi mở mắt." : "Before you begin: be comfortable solving a 3×3 with your eyes open."}</div></aside>
        <section className="col-12 col-xl-8" role="tabpanel">
          {stageIndex === 0 && <section className="card card-body h-100"><p className="small text-uppercase fw-semibold text-body-secondary">01 · {stages[0].shortTitle}</p><h3 className="h4">{vi ? "Một lượt BLD luôn có ba nhịp." : "Every BLD solve follows three beats."}</h3><div className="row g-3 mt-1"><PathBeat title={vi ? "1. Quan sát" : "1. Inspect"} body={vi ? "Nhìn cube và xác định các mảnh chưa ở đúng vị trí." : "Look at the cube and notice pieces outside their home positions."} /><PathBeat title={vi ? "2. Ghi memo" : "2. Make a memo"} body={vi ? "Đổi đường đi của cạnh và góc thành letter pair hoặc hình ảnh quen thuộc." : "Turn edge and corner paths into letter pairs or familiar images."} /><PathBeat title={vi ? "3. Thực hiện" : "3. Execute"} body={vi ? "Nhắm mắt, làm theo memo và dùng các công thức bạn sẽ luyện ở chặng sau." : "Close your eyes, follow the memo, then use the algorithms you will drill later."} /></div><div className="alert alert-light border mt-4 mb-0"><strong>{vi ? "Điểm xuất phát mặc định:" : "Default starting points:"}</strong> {vi ? "cạnh UF và góc UBL. Bạn chưa cần thuộc ngay; chúng sẽ xuất hiện dần trong memo." : "edge UF and corner UBL. You do not need to memorize them yet; they will become familiar through memo work."}</div><div className="form-check mt-4"><input id="bld-orientation-done" type="checkbox" checked={path.orientationDone} onChange={(event) => setPath((current) => ({ ...current, orientationDone: event.target.checked }))} className="form-check-input" /><label htmlFor="bld-orientation-done" className="form-check-label">{vi ? "Tôi hiểu ba nhịp của một lượt BLD." : "I understand the three beats of a BLD solve."}</label></div><button type="button" onClick={completeOrientation} className="btn btn-primary align-self-start mt-4">{vi ? "Sang tạo memo" : "Continue to memo"}<ChevronRight className="fs-6 ms-1" /></button></section>}
          {stageIndex === 1 && <section className="card card-body h-100"><p className="small text-uppercase fw-semibold text-body-secondary">02 · {stages[1].shortTitle}</p><h3 className="h4">{vi ? "Biến một scramble thành hai dòng memo." : "Turn one scramble into two memo lines."}</h3><p className="text-body-secondary">{vi ? "Kết quả chỉ chia thành Cạnh và Góc. Đọc mỗi cặp như một từ hoặc hình ảnh của riêng bạn." : "The result is split only into Edges and Corners. Read each pair as a word or image that is meaningful to you."}</p><div className="row g-4"><div className="col-12 col-lg-7"><div className="btn-group" role="group" aria-label={vi ? "Nguồn memo" : "Memo source"}><button type="button" onClick={() => setSourceMode("scramble")} className={sourceMode === "scramble" ? "btn btn-primary" : "btn btn-outline-secondary"}>Scramble</button><button type="button" onClick={() => setSourceMode("state")} className={sourceMode === "state" ? "btn btn-primary" : "btn btn-outline-secondary"}>54 sticker</button></div><label htmlFor="bld-learning-source" className="form-label mt-3">{sourceMode === "scramble" ? (vi ? "Scramble để tạo memo" : "Scramble to build a memo") : (vi ? "State 54 sticker" : "54-sticker state")}</label><textarea id="bld-learning-source" className="form-control" rows={5} value={value} onChange={(event) => setValue(event.target.value)} placeholder={sourceMode === "scramble" ? "R U R' U' …" : "UUUUUUUUURRRRRRRRR…"} /><div className="d-flex gap-2 mt-3"><button type="button" onClick={() => { setValue(randomScramble()); setResult(null); setError(""); }} aria-label={vi ? "Tạo scramble mới" : "Create a new scramble"} className="btn btn-outline-secondary"><Dices className="fs-6" /></button><button type="button" onClick={() => void buildMemo()} disabled={loading} aria-label={loading ? (vi ? "Đang tạo đường ghi nhớ" : "Building memory path") : (vi ? "Tạo đường ghi nhớ" : "Build memory path")} className="btn btn-primary">{loading ? <Loader2 className="fs-6" /> : <Sparkles className="fs-6" />}</button></div>{error ? <div className="mt-3"><StatusFeedback tone="danger" title={vi ? "Không thể tạo memo" : "Could not build memo"}>{error}</StatusFeedback></div> : null}</div><aside className="col-12 col-lg-5"><div className="border rounded p-3 text-center"><CubeNet state={previewState} compact /></div>{loading ? <SkeletonCard lines={4} className="mt-3" label={vi ? "Đang tạo memo" : "Building memo"} /> : result ? <div className="card card-body mt-3"><p className="small text-body-secondary mb-1">{vi ? "Cạnh" : "Edges"}</p><strong className="font-monospace text-break">{edgeMemo || "—"}</strong><p className="small text-body-secondary mt-3 mb-1">{vi ? "Góc" : "Corners"}</p><strong className="font-monospace text-break">{cornerMemo || "—"}</strong><button type="button" onClick={() => moveToStage(2)} className="btn btn-primary mt-3">{vi ? "Luyện case đặc biệt" : "Practice special cases"}<ChevronRight className="fs-6 ms-1" /></button></div> : <div className="alert alert-secondary small mt-3 mb-0">{vi ? "Memo sẽ xuất hiện ở đây sau khi bạn tạo từ scramble." : "Your memo will appear here after you build it from a scramble."}</div>}</aside></div></section>}
          {stageIndex === 2 && <section className="card card-body h-100"><p className="small text-uppercase fw-semibold text-body-secondary">03 · {stages[2].shortTitle}</p><h3 className="h4">{vi ? "Luyện một loại tình huống tại một thời điểm." : "Practice one kind of situation at a time."}</h3><p className="text-body-secondary">{vi ? "Bạn không cần học mọi công thức ngay. Bắt đầu bằng parity, flip hoặc twist; xem đáp án rồi tự chấm mức nhớ." : "You do not need every algorithm at once. Start with parity, flips, or twists; reveal the answer, then grade your recall."}</p>{!path.memoDone && !result ? <div className="alert alert-info">{vi ? "Bạn vẫn có thể drill ngay, nhưng hãy quay lại chặng Memo khi muốn gắn bài tập với một lượt cube thật." : "You can drill now, but return to Memo when you want to connect practice to a real cube state."}</div> : null}<BldTrainingLab result={result} profile={profile} onProfile={setProfile} language={language} /><div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-top pt-3 mt-4"><span className="small text-body-secondary">{profile.drillAttempts.length}/3 {vi ? "lượt drill đầu tiên" : "first drill attempts"}</span><button type="button" onClick={() => moveToStage(3)} className="btn btn-outline-secondary">{vi ? "Sang ôn tập" : "Continue to review"}<ChevronRight className="fs-6 ms-1" /></button></div></section>}
          {stageIndex === 3 && <section className="card card-body h-100"><p className="small text-uppercase fw-semibold text-body-secondary">04 · {stages[3].shortTitle}</p><h3 className="h4">{vi ? "Giữ nhịp ngắn mỗi ngày." : "Keep a short daily rhythm."}</h3><p className="text-body-secondary">{vi ? "Mỗi ngày: tạo hoặc xem lại một memo, tự chấm thật, rồi để SRS chọn lần ôn tiếp theo. Hồ sơ giữ letter pair, audio và backup của bạn." : "Each day: make or review one memo, grade honestly, then let SRS pick the next review. Your profile keeps letter pairs, audio, and backups."}</p><div className="row g-4"><section className="col-12 col-lg-6"><BldMemoLab result={result} profile={profile} onProfile={setProfile} language={language} /></section><section className="col-12 col-lg-6"><BldProfilePanel profile={profile} onProfile={setProfile} language={language} /></section></div><div className="alert alert-success mt-4 mb-0"><Check className="fs-6 me-1" />{vi ? "Lộ trình không kết thúc ở đây: quay lại Memo khi có scramble mới, hoặc vào Drill/SRS cho phiên ngắn tiếp theo." : "The path does not end here: return to Memo for a new scramble, or use Drill/SRS for your next short session."}</div></section>}
        </section></div></div>
  </section>;
}

function PathBeat({ title, body }: { title: string; body: string }) {
  return <div className="col-12 col-md-4"><div className="card bg-body-tertiary h-100"><div className="card-body"><h4 className="h6">{title}</h4><p className="small text-body-secondary mb-0">{body}</p></div></div></div>;
}
