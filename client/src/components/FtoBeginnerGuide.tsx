import { PuzzleScramblePreview } from "@/components/PuzzleScramblePreview";
import {
  FTO_NAUTILUS_1LLL_CAPSTONE,
  FTO_NAUTILUS_WALKTHROUGH,
  FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE,
  FTO_SOLVED_REFERENCE_ALG,
  ftoWalkthroughPhaseAlgorithms,
  ftoWalkthroughStateAfter,
  ftoWalkthroughStateBefore,
} from "@/lib/ftoBeginnerGuide";
import { useMemo, useState } from "react";

type Playback = { phaseIndex: number; runId: number };

export function FtoBeginnerGuide({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [oneLllRunId, setOneLllRunId] = useState<number | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const phase = FTO_NAUTILUS_WALKTHROUGH[phaseIndex]!;
  const [activeAlgorithm] = useMemo(() => ftoWalkthroughPhaseAlgorithms(phase), [phase]);
  const beforeState = ftoWalkthroughStateBefore(phaseIndex);
  const afterState = ftoWalkthroughStateAfter(phaseIndex);
  const isPlaying = playback?.phaseIndex === phaseIndex;

  const selectPhase = (nextIndex: number) => {
    setPhaseIndex(nextIndex);
    setPlayback(null);
    setVideoOpen(false);
  };
  const playPhase = () => setPlayback((current) => ({ phaseIndex, runId: (current?.runId ?? 0) + 1 }));

  return (
    <section className="card mt-4">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <span className="badge text-bg-primary mb-2">Nautilus · Advanced endgame</span>
            <h3 className="h4 mb-1">
              {vi ? "Nautilus nâng cao: Last Triple → one-look L6X → one-look L3C" : "Advanced Nautilus: Last Triple → one-look L6X → one-look L3C"}
            </h3>
            <p className="text-body-secondary mb-0">
              {vi ? "Không dùng Baby Nautilus, insert đơn lẻ, Headlights two-look hay Orient + Permute two-look." : "No Baby Nautilus, single-piece inserts, two-look Headlights, or two-look Orient + Permute."}
            </p>
          </div>
          <span className="badge text-bg-secondary">{phaseIndex + 1}/{FTO_NAUTILUS_WALKTHROUGH.length}</span>
        </div>

        <div className="alert alert-secondary mt-3 mb-3">
          <strong>{vi ? "Phạm vi của walkthrough:" : "Walkthrough scope:"}</strong>{" "}
          {vi ? "First Block và Centres là opening trực giác của Nautilus. Một khi hai stage đó xong, walkthrough này đi thẳng vào endgame nâng cao và giải cùng một scramble tới solved." : "First Block and Centres are Nautilus's intuitive opening. Once they are complete, this walkthrough goes directly through the advanced endgame to solved on one scramble."}
        </div>

        <div className="alert alert-primary mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <strong>{vi ? "Scramble cố định của walkthrough nâng cao:" : "Fixed advanced walkthrough scramble:"}</strong>{" "}
              <code className="text-break ms-1">{FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE}</code>
            </div>
            <span className="small">{vi ? "Không đổi state giữa ba stage." : "The state does not change between these three phases."}</span>
          </div>
        </div>

        <div className="row g-4">
          <aside className="col-12 col-lg-4">
            <p className="small text-uppercase fw-semibold text-body-secondary mb-2">{vi ? "Đường nâng cao cố định" : "Fixed advanced path"}</p>
            <nav className="list-group" role="tablist" aria-label={vi ? "Ba stage Nautilus nâng cao" : "Three advanced Nautilus phases"}>
              {FTO_NAUTILUS_WALKTHROUGH.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={index === phaseIndex}
                  className={index === phaseIndex ? "list-group-item list-group-item-action active" : "list-group-item list-group-item-action"}
                  onClick={() => selectPhase(index)}
                >
                  <strong className="d-block">{item.shortTitleVi}</strong>
                  <small className="d-block mt-1">{item.objectiveVi}</small>
                </button>
              ))}
            </nav>
            <div className="alert alert-success small mt-3 mb-0">
              <strong>{vi ? "Liên kết state:" : "State continuity:"}</strong>{" "}
              {vi ? "Mô hình Sau ở stage này luôn là mô hình Trước của stage sau; đây không phải ba case rời." : "The After model of this stage is the Before model of the next—these are not three disconnected cases."}
            </div>
          </aside>

          <article className="col-12 col-lg-8">
            <div className="bg-body-tertiary rounded p-3 p-lg-4 h-100">
              <p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? `Stage nâng cao ${phaseIndex + 1}` : `Advanced phase ${phaseIndex + 1}`}</p>
              <h4 className="h4 mb-2">{phase.titleVi}</h4>
              <p className="fs-5 mb-3">{phase.objectiveVi}</p>
              <div className="row g-3">
                <section className="col-12 col-md-6">
                  <div className="bg-body rounded p-3 h-100">
                    <p className="small fw-semibold text-body-secondary mb-1">{vi ? "Nhận diện trên 3D" : "3D recognition"}</p>
                    <p className="mb-0">{phase.lookForVi}</p>
                  </div>
                </section>
                <section className="col-12 col-md-6">
                  <div className="bg-body rounded p-3 h-100">
                    <p className="small fw-semibold text-body-secondary mb-1">{vi ? "Cách cầm" : "Grip"}</p>
                    <p className="mb-0">{phase.holdVi}</p>
                  </div>
                </section>
              </div>
              <h5 className="h6 mt-4 mb-2">{vi ? "Ba việc phải làm" : "Three actions"}</h5>
              <ol className="mb-0 ps-3">
                {phase.actionsVi.map((action) => <li key={action} className="mb-2">{action}</li>)}
              </ol>
              <div className="alert alert-success mt-3 mb-0">
                <strong>{vi ? "Kiểm tra:" : "Check:"}</strong> {phase.checkVi}
              </div>
            </div>
          </article>
        </div>

        <section className="mt-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "Minh họa một state liên tục" : "One continuous state visual"}</p>
              <h4 className="h5 mb-1">{phase.shortTitleVi}</h4>
              <p className="text-body-secondary mb-0"><code>{phase.algorithm}</code> · {phase.algorithmRoleVi}</p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={playPhase} aria-label={`${vi ? "Phát stage nâng cao: " : "Play advanced phase: "}${activeAlgorithm}`}>
                <i className="bi bi-play-fill me-1" aria-hidden="true" />{vi ? "Phát stage" : "Play phase"}
              </button>
              {isPlaying ? <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setPlayback(null)}>{vi ? "Đặt lại mốc" : "Reset checkpoint"}</button> : null}
            </div>
          </div>

          <div className="row g-3">
            <section className="col-12 col-md-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center gap-2">
                  <strong>{vi ? "Trước stage này" : "Before this phase"}</strong>
                  <span className="badge text-bg-secondary">{vi ? `Mốc ${phaseIndex + 1}` : `Checkpoint ${phaseIndex + 1}`}</span>
                </div>
                <div className="card-body">
                  <p className="small text-body-secondary">{phase.beforeVi}</p>
                  <PuzzleScramblePreview eventId="fto" scramble={beforeState} language={language} animationAlg={isPlaying ? activeAlgorithm : ""} animationRunId={playback?.runId} />
                  <p className="small text-body-secondary mb-0 mt-2" aria-live="polite">
                    {isPlaying ? (vi ? `Đang chạy: ${activeAlgorithm}` : `Playing: ${activeAlgorithm}`) : (vi ? "Bấm Phát stage để xem algorithm khởi đầu từ đúng state này." : "Play the phase to start the algorithm from this exact state.")}
                  </p>
                </div>
              </div>
            </section>
            <section className="col-12 col-md-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center gap-2">
                  <strong>{vi ? "Sau stage này" : "After this phase"}</strong>
                  <span className={phaseIndex === FTO_NAUTILUS_WALKTHROUGH.length - 1 ? "badge text-bg-success" : "badge text-bg-secondary"}>
                    {phaseIndex === FTO_NAUTILUS_WALKTHROUGH.length - 1 ? (vi ? "Đã giải" : "Solved") : (vi ? `Bắt đầu stage ${phaseIndex + 2}` : `Starts phase ${phaseIndex + 2}`)}
                  </span>
                </div>
                <div className="card-body">
                  <p className="small text-body-secondary">{phase.afterVi}</p>
                  <PuzzleScramblePreview eventId="fto" scramble={phaseIndex === FTO_NAUTILUS_WALKTHROUGH.length - 1 ? FTO_SOLVED_REFERENCE_ALG : afterState} language={language} />
                  <p className="small text-body-secondary mb-0 mt-2">
                    {phaseIndex === FTO_NAUTILUS_WALKTHROUGH.length - 1 ? (vi ? "Đây là FTO solved sau cả ba stage nâng cao của cùng scramble." : "This is the solved FTO after all three advanced phases on the same scramble.") : (vi ? "Mở stage kế tiếp: preview Trước sẽ là chính state này." : "Open the next phase: its Before preview is exactly this state.")}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={() => selectPhase(phaseIndex - 1)} disabled={phaseIndex === 0}>
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />{vi ? "Stage trước" : "Previous phase"}
          </button>
          <span className="small text-body-secondary">{vi ? "Advanced LT → one-look L6X → one-look L3C" : "Advanced LT → one-look L6X → one-look L3C"}</span>
          <button type="button" className="btn btn-primary" onClick={() => selectPhase(phaseIndex + 1)} disabled={phaseIndex === FTO_NAUTILUS_WALKTHROUGH.length - 1}>
            {vi ? "Stage tiếp" : "Next phase"}<i className="bi bi-arrow-right ms-1" aria-hidden="true" />
          </button>
        </div>

        <section className="card bg-body-tertiary mt-4" aria-labelledby="fto-1lll-heading">
          <div className="card-body p-3 p-lg-4">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-5">
                <span className="badge text-bg-dark mb-2">Đích cuối · 1LLL</span>
                <h4 id="fto-1lll-heading" className="h5">{FTO_NAUTILUS_1LLL_CAPSTONE.nameVi}</h4>
                <p>{FTO_NAUTILUS_1LLL_CAPSTONE.objectiveVi}</p>
                <p className="small text-body-secondary">{FTO_NAUTILUS_1LLL_CAPSTONE.recognitionVi}</p>
                <div className="alert alert-warning small">{vi ? "1LLL là nhánh thay thế trực tiếp cho L6X → L3C, không phải algorithm thứ tư chạy sau walkthrough bên trên." : "1LLL is a direct alternative to L6X → L3C, not a fourth algorithm after the walkthrough above."}</div>
                <p className="mb-2"><code>{FTO_NAUTILUS_1LLL_CAPSTONE.algorithm}</code></p>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setOneLllRunId((runId) => (runId ?? 0) + 1)} aria-label={`${vi ? "Phát case 1LLL: " : "Play 1LLL case: "}${FTO_NAUTILUS_1LLL_CAPSTONE.algorithm}`}>
                    <i className="bi bi-play-fill me-1" aria-hidden="true" />{vi ? "Phát case 1LLL" : "Play 1LLL case"}
                  </button>
                  {oneLllRunId !== null ? <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setOneLllRunId(null)}>{vi ? "Đặt lại" : "Reset"}</button> : null}
                  <a className="btn btn-outline-secondary btn-sm" href={FTO_NAUTILUS_1LLL_CAPSTONE.sourceUrl} target="_blank" rel="noreferrer">{vi ? "Mở catalogue 1LLL" : "Open 1LLL catalogue"}</a>
                </div>
              </div>
              <div className="col-12 col-lg-7">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <p className="small fw-semibold text-body-secondary mb-2">{vi ? "Case 1LLL trước" : "1LLL case before"}</p>
                    <PuzzleScramblePreview eventId="fto" scramble={FTO_NAUTILUS_1LLL_CAPSTONE.setupAlg} language={language} animationAlg={oneLllRunId === null ? "" : FTO_NAUTILUS_1LLL_CAPSTONE.algorithm} animationRunId={oneLllRunId ?? undefined} />
                  </div>
                  <div className="col-12 col-md-6">
                    <p className="small fw-semibold text-body-secondary mb-2">{vi ? "Sau một look" : "After one look"}</p>
                    <PuzzleScramblePreview eventId="fto" scramble={FTO_SOLVED_REFERENCE_ALG} language={language} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <details className="mt-4" open={videoOpen} onToggle={(event) => setVideoOpen(event.currentTarget.open)}>
          <summary className="fw-semibold">{vi ? "Video bổ sung cho stage hiện tại" : "Supplementary video for this phase"}</summary>
          <div className="card card-body mt-2">
            <p className="mb-1"><strong>{phase.video.title}</strong></p>
            <p className="small text-body-secondary">{phase.video.focusVi}</p>
            {videoOpen ? <div className="ratio ratio-16x9 bg-body-secondary"><iframe src={`https://www.youtube-nocookie.com/embed/${phase.video.youtubeId}?rel=0`} title={`${vi ? "Video Nautilus FTO: " : "Nautilus FTO video: "}${phase.video.title}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : null}
            <a className="btn btn-outline-secondary btn-sm align-self-start mt-3" href={`https://www.youtube.com/watch?v=${phase.video.youtubeId}`} target="_blank" rel="noreferrer">{vi ? "Mở video trên YouTube" : "Open on YouTube"}</a>
          </div>
        </details>

        <p className="small text-body-secondary mt-3 mb-0">
          {vi ? "Case và cách phân nhánh được đối chiếu từ " : "Cases and branching are cross-checked with "}
          <a href="https://sites.google.com/view/nautilusfto/step3" target="_blank" rel="noreferrer">Nautilus Last Triple</a>, {" "}
          <a href="https://sites.google.com/view/nautilusfto/step4" target="_blank" rel="noreferrer">Nautilus Last Layer</a>, {" "}
          {vi ? "và catalogue 1LLL chính thức. Walkthrough là đường case-based có state được kiểm chứng; không tuyên bố là solver hay lời giải tối ưu cho mọi scramble." : "and the official 1LLL catalogue. The walkthrough is a verified case-based state path, not a general solver or an optimal solution claim."}
        </p>
      </div>
    </section>
  );
}
