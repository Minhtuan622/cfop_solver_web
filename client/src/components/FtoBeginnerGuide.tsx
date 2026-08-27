import { useMemo, useState } from "react";
import { PuzzleScramblePreview } from "@/components/PuzzleScramblePreview";
import {
  FTO_BENCISCO_WALKTHROUGH,
  FTO_BENCISCO_WALKTHROUGH_SCRAMBLE,
  FTO_SOLVED_REFERENCE_ALG,
  ftoWalkthroughPhaseAlgorithms,
  ftoWalkthroughStateAfter,
  ftoWalkthroughStateBefore,
} from "@/lib/ftoBeginnerGuide";

function WhiteFaceMilestone() {
  return <div className="rounded-3 bg-dark text-white p-3 mb-2 text-center" aria-label="Mặt U trắng đã hoàn thành">
    <div className="small fw-semibold mb-2">Mặt U sau stage 1: 9 sticker trắng</div>
    <svg viewBox="0 0 180 156" className="d-block mx-auto" width="150" height="130" role="img" aria-label="Mặt tam giác U gồm chín sticker trắng đã hoàn thành">
      <polygon points="90,6 12,148 168,148" fill="#ffffff" stroke="#212529" strokeWidth="4" strokeLinejoin="round" />
      <path d="M64,53 L116,53 M38,100 L142,100 M64,53 L38,100 M116,53 L142,100 M90,6 L90,148 M12,148 L116,53 M168,148 L64,53" fill="none" stroke="#212529" strokeWidth="2" />
    </svg>
  </div>;
}

export function FtoBeginnerGuide({ language = "vi" }: { language?: "vi" | "en" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animationRunId, setAnimationRunId] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const phase = FTO_BENCISCO_WALKTHROUGH[activeIndex];
  const beforeState = useMemo(() => ftoWalkthroughStateBefore(activeIndex), [activeIndex]);
  const afterState = useMemo(() => activeIndex === FTO_BENCISCO_WALKTHROUGH.length - 1 ? FTO_SOLVED_REFERENCE_ALG : ftoWalkthroughStateAfter(activeIndex), [activeIndex]);
  const moves = useMemo(() => ftoWalkthroughPhaseAlgorithms(phase), [phase]);

  function selectStage(index: number) {
    setIsPlaying(false);
    setActiveIndex(index);
  }

  function playStage() {
    setIsPlaying(true);
    setAnimationRunId((value) => value + 1);
  }

  function resetStage() {
    setIsPlaying(false);
    setAnimationRunId((value) => value + 1);
  }

  return (
    <section className="card border-0 rounded-3 bg-body-tertiary" aria-labelledby="fto-bencisco-title">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
          <div className="pe-lg-4">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge text-bg-primary">Bencisco</span>
              <span className="small text-body-secondary">Speed method · example solve cố định</span>
            </div>
            <h2 id="fto-bencisco-title" className="h4 mb-2">Giải FTO từ white center đến solved</h2>
            <p className="mb-0 text-body-secondary">Toàn bộ sáu stage dùng một scramble cố định. Stage 1 dựng <strong className="text-body">white center/hexagon</strong>; ở checkpoint Sau, bạn sẽ thấy rõ <strong className="text-body">toàn bộ mặt U trắng</strong> để đối chiếu bằng mắt trước khi sang First Two Triples.</p>
          </div>
          <div className="bg-body rounded-3 p-3 text-lg-end flex-shrink-0">
            <div className="small text-uppercase text-body-secondary mb-1">Scramble cố định</div>
            <code className="small text-break d-block">{FTO_BENCISCO_WALKTHROUGH_SCRAMBLE}</code>
          </div>
        </div>

        <div className="row g-4">
          <aside className="col-12 col-lg-4" aria-label="Các stage Bencisco">
            <div className="list-group">
              {FTO_BENCISCO_WALKTHROUGH.map((item, index) => (
                <button key={item.id} type="button" className={`list-group-item list-group-item-action d-flex gap-3 align-items-start ${index === activeIndex ? "active" : ""}`} onClick={() => selectStage(index)} aria-current={index === activeIndex ? "step" : undefined}>
                  <span className={`badge rounded-pill ${index === activeIndex ? "text-bg-light text-primary" : "text-bg-secondary"}`}>{index + 1}</span>
                  <span className="text-start"><span className="d-block fw-semibold">{item.shortTitleVi}</span><span className="d-block small opacity-75">{index === 0 ? "White center / hexagon" : index === 5 ? "Kết thúc solve" : "State kế tiếp"}</span></span>
                </button>
              ))}
            </div>
            <a className="btn btn-outline-secondary btn-sm w-100 mt-3" href="https://docs.google.com/document/d/e/2PACX-1vTDL7-XvpNrhIc2Q_1nHfeJyG7tIazgBCq88PE8ahqIbvPb3LPQsM3_vsdqX6y8sxte1n5jGk2J3c5V/pub" target="_blank" rel="noreferrer">Mở tài liệu Bencisco gốc <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" /></a>
          </aside>

          <article className="col-12 col-lg-8">
            <div className="bg-body rounded-3 p-3 p-lg-4">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                <div>
                  <div className="small fw-semibold text-primary mb-1">Stage {activeIndex + 1} / {FTO_BENCISCO_WALKTHROUGH.length}</div>
                  <h3 className="h5 mb-2">{phase.titleVi}</h3>
                  <p className="mb-0 text-body-secondary">{phase.objectiveVi}</p>
                </div>
                <div className="btn-group align-self-md-start" role="group" aria-label="Điều khiển animation stage">
                  <button type="button" className="btn btn-primary btn-sm" onClick={playStage}><i className="bi bi-play-fill me-1" aria-hidden="true" />Phát stage</button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetStage}><i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />Đặt lại</button>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6"><div className="rounded-3 bg-body-tertiary p-3 h-100"><div className="small text-uppercase text-body-secondary fw-semibold mb-1">Cần nhìn</div><p className="mb-0 small">{phase.lookForVi}</p></div></div>
                <div className="col-12 col-md-6"><div className="rounded-3 bg-body-tertiary p-3 h-100"><div className="small text-uppercase text-body-secondary fw-semibold mb-1">Cách cầm</div><p className="mb-0 small">{phase.holdVi}</p></div></div>
              </div>

              <ol className="mb-3 ps-3">
                {phase.actionsVi.map((action) => <li key={action} className="mb-2">{action}</li>)}
              </ol>

              <div className="rounded-3 bg-dark text-light p-3 mb-3">
                <div className="small text-white-50 text-uppercase mb-1">Chuỗi xoay của stage</div>
                <code className="text-warning text-break d-block mb-2">{moves.join(" ")}</code>
                <div className="small text-white-50">{phase.algorithmRoleVi}</div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="rounded-3 bg-body-tertiary p-2 h-100">
                    <div className="d-flex justify-content-between align-items-center px-1 pt-1"><strong className="small">Trước</strong><span className="badge text-bg-secondary">Mốc {activeIndex + 1}</span></div>
                    <p className="small text-body-secondary px-1 mb-2">{phase.beforeVi}</p>
                    <div className="ratio ratio-1x1 rounded-3 overflow-hidden bg-body">
                      <PuzzleScramblePreview eventId="fto" scramble={beforeState} language={language} animationAlg={isPlaying ? phase.algorithm : undefined} animationRunId={animationRunId} />
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="rounded-3 bg-body-tertiary p-2 h-100">
                    <div className="d-flex justify-content-between align-items-center px-1 pt-1"><strong className="small">Sau</strong><span className="badge text-bg-success">Mốc {activeIndex + 2}</span></div>
                    <p className="small text-body-secondary px-1 mb-2">{phase.afterVi}</p>
                    {activeIndex === 0 ? <WhiteFaceMilestone /> : null}
                    <div className="ratio ratio-1x1 rounded-3 overflow-hidden bg-body"><PuzzleScramblePreview eventId="fto" scramble={afterState} language={language} focusFtoWhiteFace={activeIndex === 0} /></div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info d-flex gap-2 align-items-start mt-3 mb-0" role="note"><i className="bi bi-check2-circle fs-5" aria-hidden="true" /><span><strong>Tự kiểm:</strong> {phase.checkVi}</span></div>
              <div className="d-flex flex-wrap align-items-center gap-2 mt-3"><span className="small text-body-secondary">Video tham khảo:</span><a className="small" href={`https://www.youtube.com/watch?v=${phase.video.youtubeId}`} target="_blank" rel="noreferrer">{phase.video.title} <i className="bi bi-box-arrow-up-right" aria-hidden="true" /></a><span className="small text-body-secondary">— {phase.video.focusVi}</span></div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
