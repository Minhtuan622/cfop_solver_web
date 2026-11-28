import { useEffect, useRef, useState } from "react";
import { timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import { RotateCcw } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { applyToken, parseSquareOneAlg, type SquareOneToken } from "@/lib/squareOneModel";
import { defaultPuzzleCamera, fitDistanceForPoints } from "../lib/puzzleCamera";
import { collectShownPoints } from "../lib/puzzleFitPoints";
import { createSquareOneModel, type SquareOneModel } from "../lib/squareOneScene";
import { usePuzzleOrbitControls } from "../lib/usePuzzleOrbitControls";
import { Puzzle3DErrorCard } from "./Puzzle3DErrorCard";

// Turns the half that the slice flips towards the right of the screen, seen
// from a little above.
const INITIAL_ORBIT = { yaw: 1.3, pitch: 0.45 };
const TURN_MS = 480;
const SLICE_MS = 760;

const ease = (value: number) => value * value * (3 - 2 * value);

function safeTokens(text: string): SquareOneToken[] {
  try {
    return parseSquareOneAlg(text);
  } catch {
    return [];
  }
}

// The state after a setup scramble; a slice that cuts through a corner stops
// the replay at the last legal state instead of drawing a broken puzzle.
function applySetup(tokens: readonly SquareOneToken[]) {
  let state = Array.from({ length: 24 }, (_, index) => index);
  let flips = 0;
  for (const token of tokens) {
    try {
      state = applyToken(state, token);
    } catch {
      break;
    }
    if (token.slice) flips += 1;
  }
  return { state, flips };
}

export function SquareOneCanvas({
  eventId,
  scramble,
  language,
  animationAlg = "",
  animationRunId = 0,
  tempoScale = 1,
}: {
  eventId: TimerEventId;
  scramble: string;
  language: "vi" | "en";
  animationAlg?: string;
  animationRunId?: number;
  tempoScale?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const {
    orbitRef,
    targetDistanceRef,
    pointersRef,
    pinchRef,
    userZoomedRef,
    zoomFrameRef,
    inertiaFrameRef,
    renderRef,
    resetRef,
    pointerDown,
    pointerMove,
    pointerUp,
    resetView,
  } = usePuzzleOrbitControls("square1");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryTick, setRetryTick] = useState(0);
  const modelRef = useRef<SquareOneModel | null>(null);
  const showRef = useRef<((tokens: SquareOneToken[], setup: SquareOneToken[]) => void) | null>(null);
  const scrambleRef = useRef(scramble);
  const algRef = useRef(animationAlg);
  const tempoRef = useRef(tempoScale);
  scrambleRef.current = scramble;
  algRef.current = animationAlg;
  tempoRef.current = tempoScale;
  const hasScramble = Boolean(scramble.trim());

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasScramble) return;
    let disposed = false;
    let cleanup = () => undefined;
    setStatus("loading");

    void (async () => {
      const THREE = await import("three");
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = "h-full w-full";
      renderer.domElement.style.display = "block";
      host.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 1.9));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(2.5, 5, 4);
      scene.add(sun);
      const camera = new THREE.PerspectiveCamera(defaultPuzzleCamera("square1").fov, 1, 0.1, 100);
      const model = createSquareOneModel(THREE);
      modelRef.current = model;
      const world = new THREE.Group();
      world.add(model.root);
      scene.add(world);

      const orbit = (orbitRef.current = { ...INITIAL_ORBIT, distance: defaultPuzzleCamera("square1").distance });
      targetDistanceRef.current = orbit.distance;
      userZoomedRef.current = false;

      const size = () => {
        const width = Math.max(1, Math.round(host.clientWidth));
        const height = Math.max(1, Math.round(host.clientHeight));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const draw = () => {
        size();
        world.rotation.set(orbit.pitch, orbit.yaw, 0);
        camera.position.set(0, 0, orbit.distance);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };
      const fit = () => {
        world.rotation.set(orbit.pitch, orbit.yaw, 0);
        world.updateWorldMatrix(true, true);
        const points = collectShownPoints(world, new THREE.Vector3());
        return points.length
          ? fitDistanceForPoints(points, camera.fov, camera.aspect)
          : defaultPuzzleCamera("square1").distance;
      };
      const fitAndDraw = () => {
        size();
        if (!userZoomedRef.current) {
          orbit.distance = fit();
          targetDistanceRef.current = orbit.distance;
        }
        draw();
      };
      renderRef.current = draw;
      resetRef.current = () => {
        orbit.yaw = INITIAL_ORBIT.yaw;
        orbit.pitch = INITIAL_ORBIT.pitch;
        userZoomedRef.current = false;
        orbit.distance = fit();
        targetDistanceRef.current = orbit.distance;
        draw();
      };

      // Plays the tokens one after the other from the state the setup leaves.
      let frame = 0;
      let run = 0;
      const show = (tokens: SquareOneToken[], setup: SquareOneToken[]) => {
        run += 1;
        const mine = run;
        window.cancelAnimationFrame(frame);
        let { state, flips } = applySetup(setup);
        model.pose(state, flips);
        draw();
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const speed = Math.max(0.6, tempoRef.current / 1.6);
        const queue = tokens.filter(token => token.top || token.bottom || token.slice);
        const step = () => {
          if (mine !== run || disposed) return;
          const token = queue.shift();
          if (!token) return;
          let next;
          try {
            next = applyToken(state, token);
          } catch {
            return;
          }
          if (reduced) {
            state = next;
            if (token.slice) flips += 1;
            model.pose(state, flips);
            draw();
            step();
            return;
          }
          const turned = applyToken(state, { ...token, slice: false });
          const hasTurn = Boolean(token.top || token.bottom);
          const turnMs = hasTurn ? TURN_MS / speed : 0;
          const sliceMs = token.slice ? SLICE_MS / speed : 0;
          const started = performance.now();
          const tick = (now: number) => {
            if (mine !== run || disposed) return;
            const elapsed = now - started;
            if (elapsed < turnMs) {
              model.pose(state, flips, {
                kind: "turn",
                top: token.top,
                bottom: token.bottom,
                progress: ease(elapsed / turnMs),
              });
            } else if (token.slice && elapsed < turnMs + sliceMs) {
              model.pose(turned, flips, { kind: "slice", progress: ease((elapsed - turnMs) / sliceMs) });
            } else {
              state = next;
              if (token.slice) flips += 1;
              model.pose(state, flips);
              draw();
              frame = window.requestAnimationFrame(() => step());
              return;
            }
            draw();
            frame = window.requestAnimationFrame(tick);
          };
          frame = window.requestAnimationFrame(tick);
        };
        step();
      };
      showRef.current = show;

      const observer = new ResizeObserver(fitAndDraw);
      observer.observe(host);
      show(safeTokens(algRef.current), safeTokens(scrambleRef.current));
      fitAndDraw();
      setStatus("ready");
      cleanup = () => {
        run += 1;
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        if (zoomFrameRef.current !== null) window.cancelAnimationFrame(zoomFrameRef.current);
        zoomFrameRef.current = null;
        if (inertiaFrameRef.current !== null) window.cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
        pointersRef.current.clear();
        pinchRef.current = null;
        renderRef.current = null;
        resetRef.current = null;
        showRef.current = null;
        modelRef.current = null;
        model.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      };
    })().catch(error => {
      if (disposed) return;
      if (import.meta.env.DEV) console.error("[3D preview] không dựng được Square-1", error);
      setStatus("error");
    });

    return () => {
      disposed = true;
      cleanup();
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasScramble, retryTick]);

  useEffect(() => {
    showRef.current?.(safeTokens(animationAlg), safeTokens(scramble));
  }, [scramble, animationAlg, animationRunId]);

  const label = timerEventLabel(eventId, language);
  if (status === "error")
    return (
      <Puzzle3DErrorCard
        label={label}
        modelLabel="3D"
        language={language}
        onRetry={() => {
          setStatus("loading");
          setRetryTick(value => value + 1);
        }}
      />
    );

  return (
    <div className="rounded-card bg-surface h-full flex flex-col">
      <div className="p-2 relative flex-1 min-h-0">
        <div
          ref={hostRef}
          role="img"
          className="h-full w-full"
          style={{ touchAction: "none", cursor: "grab" }}
          aria-label={language === "vi" ? `Mô hình ${label} 3D` : `${label} 3D model`}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
        />
        {status === "loading" ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted">
            {language === "vi" ? "Đang tải mô hình 3D…" : "Loading 3D model…"}
          </div>
        ) : null}
        <IconButton
          label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"}
          icon={<RotateCcw className="text-base" aria-hidden="true" />}
          className="absolute bottom-0 right-0 m-2 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={resetView}
          title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}
        />
      </div>
    </div>
  );
}
