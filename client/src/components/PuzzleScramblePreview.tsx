import { useEffect, useMemo, useRef, useState } from "react";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { timerEventLabel, timerPreviewPuzzleId, type TimerEventId } from "@/lib/timerEvents";

export function puzzleScramblePreviewConfig(eventId: TimerEventId, scramble: string) {
  const puzzle = timerPreviewPuzzleId(eventId);
  return puzzle ? { puzzle, experimentalSetupAlg: scramble, alg: "", hintFacelets: "none" as const, controlPanel: "none" as const, background: "none" as const } : null;
}

export function PuzzleScramblePreview({ eventId, scramble, language }: { eventId: TimerEventId; scramble: string; language: "vi" | "en" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const config = useMemo(() => puzzleScramblePreviewConfig(eventId, scramble), [eventId, scramble]);
  const twoByTwoState = useMemo(() => { if (eventId !== "222") return SOLVED_FAST_STATE; try { return stateFromScramble(scramble); } catch { return SOLVED_FAST_STATE; } }, [eventId, scramble]);

  useEffect(() => {
    if (!config || !scramble.trim()) return;
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();
    setStatus("loading");
    const timeout = window.setTimeout(() => { if (!cancelled) { host.replaceChildren(); setStatus("error"); } }, 2_000);
    void import("cubing/twisty").then(({ TwistyPlayer }) => {
      if (cancelled) return;
      const player = new TwistyPlayer(config);
      player.style.width = "100%";
      player.style.height = eventId === "minx" ? "17rem" : "14rem";
      player.style.display = "block";
      host.replaceChildren(player);
      void player.experimentalCurrentCanvases().then((canvases) => { if (!cancelled && canvases.length) { window.clearTimeout(timeout); setStatus("ready"); } }).catch(() => undefined);
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; window.clearTimeout(timeout); host.replaceChildren(); };
  }, [config, eventId, scramble]);

  if (eventId === "222") return <Cube3DGuide state={twoByTwoState} dimension={2} step={0} />;

  if (status === "error") return <div className="card card-body h-100 d-flex flex-column align-items-center justify-content-center text-center"><i className="bi bi-box-seam fs-1 text-body-secondary mb-3" aria-hidden="true" /><p className="fw-semibold mb-1">{timerEventLabel(eventId, language)}</p><p className="small text-body-secondary mb-0">{language === "vi" ? "Mô hình 3D chưa tải được trên trình duyệt này. Timer và scramble vẫn hoạt động bình thường." : "The 3D model could not load in this browser. Timer and scramble still work normally."}</p></div>;

  return <div className="card card-body h-100 d-flex flex-column justify-content-center text-center"><div ref={hostRef} className="w-100" aria-label={language === "vi" ? "Mô hình puzzle 3D" : "3D puzzle model"} />{status === "loading" ? <p className="small text-body-secondary mb-0">{language === "vi" ? "Đang tải mô hình 3D…" : "Loading 3D model…"}</p> : null}</div>;
}
