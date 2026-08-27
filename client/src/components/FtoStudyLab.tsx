import { PuzzleScramblePreview } from "@/components/PuzzleScramblePreview";
import { SolveTimer, type TimerCompletion } from "@/components/SolveTimer";
import { FtoBeginnerGuide } from "@/components/FtoBeginnerGuide";
import { FTO_SINGLE_LAYER_LEVELS, createFtoSingleLayerScramble, invertFtoScramble, readFtoSingleLayerAttempts, writeFtoSingleLayerAttempts, type FtoSingleLayerAttempt } from "@/lib/ftoStudy";
import { useMemo, useState } from "react";

function formatTime(milliseconds: number) {
  const totalCentiseconds = Math.max(0, Math.floor(milliseconds / 10));
  const seconds = Math.floor(totalCentiseconds / 100);
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}.${(totalCentiseconds % 100).toString().padStart(2, "0")}`;
}

export function FtoStudyLab({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const [levelIndex, setLevelIndex] = useState(0);
  const [drillVersion, setDrillVersion] = useState(0);
  const level = FTO_SINGLE_LAYER_LEVELS[levelIndex]!;
  const [scramble, setScramble] = useState(() => createFtoSingleLayerScramble(FTO_SINGLE_LAYER_LEVELS[0]!));
  const [showAnswer, setShowAnswer] = useState(false);
  const [lastResult, setLastResult] = useState<FtoSingleLayerAttempt | null>(null);
  const [attempts, setAttempts] = useState<FtoSingleLayerAttempt[]>(() => readFtoSingleLayerAttempts());
  const answer = useMemo(() => invertFtoScramble(scramble), [scramble]);

  const chooseLevel = (index: number) => {
    const next = FTO_SINGLE_LAYER_LEVELS[index]!;
    setLevelIndex(index);
    setScramble(createFtoSingleLayerScramble(next));
    setShowAnswer(false);
    setLastResult(null);
    setDrillVersion((value) => value + 1);
  };
  const nextDrill = () => {
    setScramble(createFtoSingleLayerScramble(level));
    setShowAnswer(false);
    setLastResult(null);
    setDrillVersion((value) => value + 1);
  };
  const complete = (completion: TimerCompletion) => {
    const attempt: FtoSingleLayerAttempt = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, levelId: level.id, scramble, elapsedMs: completion.elapsedMs, completedAt: Date.now() };
    const nextAttempts = [attempt, ...attempts].slice(0, 20);
    setLastResult(attempt);
    setAttempts(nextAttempts);
    writeFtoSingleLayerAttempts(nextAttempts);
  };

  return <section className="container py-4">
    <div className="row g-4">
      <section className="col-12 col-xl-8">
        <div className="card"><div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3"><div><h2 className="h4 mb-1">FTO · {vi ? "Bắt đầu" : "Getting started"}</h2><p className="text-body-secondary mb-0">{vi ? "Đọc ký hiệu, sau đó luyện các bài ngắn tập trung quanh một mặt." : "Learn notation, then time short drills focused around one face."}</p></div><span className="badge text-bg-secondary">Face Turning Octahedron</span></div>
          <div className="accordion" id="fto-notation"><div className="accordion-item"><h3 className="accordion-header"><button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#fto-notation-content" aria-expanded="true" aria-controls="fto-notation-content">{vi ? "Ký hiệu FTO cơ bản" : "Basic FTO notation"}</button></h3><div id="fto-notation-content" className="accordion-collapse collapse show"><div className="accordion-body"><p>{vi ? "FTO có 8 mặt tam giác. Giữ một mặt ở trên là U; các mặt còn lại thường được ghi bằng F, B, R, L, BR (sau-phải) và BL (sau-trái), cùng mặt đáy D." : "FTO has eight triangular faces. With one face on top as U, the remaining faces are commonly named F, B, R, L, BR (back-right), BL (back-left), and D."}</p><div className="table-responsive"><table className="table table-sm align-middle mb-2"><thead><tr><th>{vi ? "Viết" : "Write"}</th><th>{vi ? "Ý nghĩa" : "Meaning"}</th><th>{vi ? "Ví dụ" : "Example"}</th></tr></thead><tbody><tr><td><code>U</code>, <code>F</code>, <code>R</code>…</td><td>{vi ? "Xoay lớp ngoài của mặt đó theo chiều kim đồng hồ khi nhìn thẳng vào mặt." : "Turn that outer face clockwise while looking directly at it."}</td><td><code>U F R</code></td></tr><tr><td><code>'</code></td><td>{vi ? "Dấu nháy nghĩa là xoay ngược chiều kim đồng hồ." : "A prime mark means counter-clockwise."}</td><td><code>F'</code></td></tr><tr><td><code>r</code>, <code>l</code></td><td>{vi ? "Chữ thường là lớp giữa/slice; hãy để dành cho công thức sau khi đã quen lớp ngoài." : "Lower-case letters are inner slice moves; save them for algorithms after outer turns feel natural."}</td><td><code>r U r' U'</code></td></tr></tbody></table></div><p className="small text-body-secondary mb-0">{vi ? "Mẹo: luôn xét chiều xoay từ phía đối diện trực tiếp với mặt đang xoay. Scramble trong bài nhập môn chỉ dùng các nước lớp ngoài." : "Tip: always judge turn direction from straight in front of the face you are turning. Beginner drills below use outer turns only."} <a href="https://www.jaapsch.net/puzzles/octaface.htm" target="_blank" rel="noreferrer">{vi ? "Tham khảo notation" : "Notation reference"}</a>.</p></div></div></div></div>
          <FtoBeginnerGuide language={language} />
          <hr className="my-4" />
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h3 className="h5 mb-1">{vi ? "Luyện một tầng" : "Single-layer practice"}</h3><p className="small text-body-secondary mb-0">{vi ? "Bài ngắn để tập đưa các mảnh quay quanh mặt U trở lại. Hãy tự đối chiếu lời giải, hệ thống không tự chấm trạng thái khối." : "Short drills to practice restoring pieces around U. Compare with the answer yourself; the app does not auto-grade the puzzle state."}</p></div><button type="button" className="btn btn-outline-primary btn-sm" onClick={nextDrill}>{vi ? "Bài mới" : "New drill"}</button></div>
          <div className="btn-group flex-wrap mt-3" role="group" aria-label={vi ? "Mức luyện FTO" : "FTO practice level"}>{FTO_SINGLE_LAYER_LEVELS.map((item, index) => <button type="button" key={item.id} className={levelIndex === index ? "btn btn-primary" : "btn btn-outline-secondary"} onClick={() => chooseLevel(index)}>{item.labelVi}</button>)}</div>
          <p className="small text-body-secondary mt-2 mb-3">{level.descriptionVi}</p>
          <div className="row g-4 align-items-stretch"><div className="col-12 col-lg-7"><div className="bg-body-tertiary rounded p-3 h-100"><p className="small text-body-secondary mb-1">FTO · {vi ? "SCRAMBLE NGẮN" : "SHORT SCRAMBLE"}</p><p className="fs-3 fw-bold text-break mb-3" aria-live="polite">{scramble}</p><PuzzleScramblePreview eventId="fto" scramble={scramble} language={language} /><button type="button" className="btn btn-outline-secondary btn-sm mt-3" onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? (vi ? "Ẩn lời giải gợi ý" : "Hide guided answer") : (vi ? "Xem lời giải gợi ý" : "Show guided answer")}</button>{showAnswer ? <div className="alert alert-secondary mt-3 mb-0"><strong>{vi ? "Làm ngược lại:" : "Reverse it:"}</strong> <code className="ms-1 text-break">{answer}</code></div> : null}</div></div><div className="col-12 col-lg-5"><div className="card bg-body-tertiary h-100"><div className="card-body d-flex flex-column"><h4 className="h6">{vi ? "Bấm giờ bài tập" : "Drill timer"}</h4><p className="small text-body-secondary">{vi ? "Giữ rồi thả Space/Enter, hoặc chạm vào timer để bắt đầu; thao tác tiếp theo sẽ dừng." : "Hold then release Space/Enter, or touch the timer to start; the next action stops it."}</p><SolveTimer key={drillVersion} onComplete={complete} soundEnabled={false} inspectionEnabled={false} /><div className="border-top mt-3 pt-3" aria-live="polite">{lastResult ? <><strong>{vi ? "Kết quả vừa ghi" : "Latest result"}</strong><p className="display-6 mb-0">{formatTime(lastResult.elapsedMs)}</p><small className="text-body-secondary">{vi ? "Chọn “Bài mới” khi sẵn sàng." : "Choose “New drill” when ready."}</small></> : <span className="small text-body-secondary">{vi ? "Hoàn tất bài tập để lưu kết quả gần nhất." : "Finish a drill to record the latest result."}</span>}</div></div></div></div></div>
        </div></div>
      </section>
      <aside className="col-12 col-xl-4"><div className="card h-100"><div className="card-body"><h3 className="h5">{vi ? "Tiến độ FTO" : "FTO progress"}</h3><p className="display-6 mb-0">{attempts.length}</p><p className="text-body-secondary small">{vi ? "bài single-layer đã bấm giờ trên thiết bị này" : "single-layer drills timed on this device"}</p><div className="list-group list-group-flush">{attempts.length ? attempts.slice(0, 5).map((attempt) => <div key={attempt.id} className="list-group-item px-0 d-flex justify-content-between gap-2"><span><strong>{FTO_SINGLE_LAYER_LEVELS.find((item) => item.id === attempt.levelId)?.labelVi ?? "FTO"}</strong><small className="d-block text-body-secondary text-break">{attempt.scramble}</small></span><span className="text-nowrap">{formatTime(attempt.elapsedMs)}</span></div>) : <p className="small text-body-secondary mb-0">{vi ? "Chưa có bài tập nào. Bắt đầu với “Làm quen”." : "No drills yet. Start with “Getting started”."}</p>}</div></div></div></aside>
    </div>
  </section>;
}
