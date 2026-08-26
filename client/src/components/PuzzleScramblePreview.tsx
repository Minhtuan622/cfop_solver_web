import { useEffect, useMemo, useRef, useState } from "react";
import { timerPreviewPuzzleId, type TimerEventId } from "@/lib/timerEvents";

export function puzzleScramblePreviewConfig(eventId: TimerEventId, scramble: string) {
  const puzzle = timerPreviewPuzzleId(eventId);
  return puzzle ? { puzzle, experimentalSetupAlg: scramble, alg: "", hintFacelets: "none" as const, controlPanel: "none" as const, background: "none" as const } : null;
}

export function PuzzleScramblePreview({ eventId, scramble, language }: { eventId: TimerEventId; scramble: string; language: "vi" | "en" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const config = useMemo(() => puzzleScramblePreviewConfig(eventId, scramble), [eventId, scramble]);

  useEffect(() => {
    if (!config || !scramble.trim()) return;
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();
    setStatus("loading");
    void import("cubing/twisty").then(({ TwistyPlayer }) => {
      if (cancelled) return;
      const player = new TwistyPlayer(config);
      player.style.width = "100%";
      player.style.height = eventId === "minx" ? "17rem" : "14rem";
      player.style.display = "block";
      host.replaceChildren(player);
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; host.replaceChildren(); };
  }, [config, eventId, scramble]);

  return <div className="card card-body h-100 d-flex flex-column justify-content-center text-center">
    <div ref={hostRef} className="w-100" aria-label={language === "vi" ? "Hình ảnh scramble" : "Scramble preview"} />
    {status === "loading" ? <p className="small text-body-secondary mb-0">{language === "vi" ? "Đang tạo hình ảnh scramble…" : "Rendering scramble preview…"}</p> : null}
    {status === "error" ? <p className="small text-body-secondary mb-0">{language === "vi" ? "Không thể hiển thị hình ảnh scramble này." : "This scramble preview could not be rendered."}</p> : null}
    {status === "ready" ? <p className="small text-body-secondary mb-0">{language === "vi" ? "Trạng thái sau scramble hiện tại" : "State after the current scramble"}</p> : null}
  </div>;
}
