import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import type { Object3D, WebGLRenderer } from "three";
import { timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import { isSideEvent3DPuzzle, type FtoTeachingFace, type PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";
import {
  clampDistance,
  defaultPuzzleCamera,
  distanceFromPinch,
  gapBetween,
  inertiaStepForPuzzle,
  orbitFromPuzzleDrag,
  type Point,
} from "@/features/puzzle-3d/lib/puzzleCamera";
import {
  focusActualFtoFace,
  puzzleInitialOrbit,
  puzzlePreviewBaseRoll,
  puzzlePreviewDistance,
  puzzlePreviewSetupAlgorithm,
} from "@/features/puzzle-3d/lib/puzzleFraming";
import type { SideEvent3DAnimation } from "@/features/puzzle-3d/lib/sideEventAnimation";

type PuzzlePlayer = HTMLElement & {
  puzzle: PuzzleId;
  experimentalSetupAlg: string;
  experimentalModel: { currentPattern: { get: () => Promise<{ patternData: unknown }> } };
  alg: string;
  visualization: "3D";
  hintFacelets: "none";
  controlPanel: "none";
  backView: "none";
  background: "none";
  experimentalCurrentThreeJSPuzzleObject: (callback: () => void) => Promise<unknown>;
  play?: () => void;
  pause?: () => void;
};

function startMountedTwistyPlayer(player: HTMLElement) {
  let target: object | null = player;
  while (target) {
    const startSymbol = Object.getOwnPropertySymbols(target).find((symbol) => symbol.description === "intersectedCallback");
    if (startSymbol) {
      const start = (target as Record<symbol, unknown>)[startSymbol];
      if (typeof start === "function") { void start.call(player); return; }
    }
    target = Object.getPrototypeOf(target);
  }
}

export function Puzzle3DCanvas({ eventId, puzzle, scramble, language, animationAlg = "", animationRunId = 0, focusFtoWhiteFace = false, focusFtoFace }: { eventId: TimerEventId; puzzle: PuzzleId; scramble: string; language: "vi" | "en"; animationAlg?: string; animationRunId?: number; focusFtoWhiteFace?: boolean; focusFtoFace?: FtoTeachingFace }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number; lastX: number; lastY: number; lastAt: number; moved: boolean } | null>(null);
  const orbitRef = useRef({ yaw: -0.55, pitch: 0.32, distance: 5.4 });
  const targetDistanceRef = useRef(5.4);
  const pointersRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<{ gap: number; distance: number } | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const inertiaVelocityRef = useRef({ yaw: 0, pitch: 0 });
  const renderRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !scramble.trim()) return;
    let disposed = false;
    let cleanup = () => undefined;
    let staging: HTMLDivElement | null = null;
    let player: PuzzlePlayer | null = null;
    let renderer: WebGLRenderer | null = null;
    let sideEventAnimation: SideEvent3DAnimation | null = null;
    setStatus("loading");

    void (async () => {
      let THREE: typeof import("three");
      if (disposed) return;
      let puzzleObject: Object3D;
      if (isSideEvent3DPuzzle(puzzle)) {
        const [three, { sideEvent3DAnimation }] = await Promise.all([import("three"), import("@/features/puzzle-3d/lib/sideEventAnimation")]);
        THREE = three;
        sideEventAnimation = await sideEvent3DAnimation(THREE, puzzle, scramble);
        puzzleObject = sideEventAnimation.object;
      } else {
        const [three] = await Promise.all([import("three"), import("cubing/twisty")]);
        THREE = three;
        staging = document.createElement("div");
        staging.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:2px;height:2px;overflow:hidden;pointer-events:none";
        player = document.createElement("twisty-player") as PuzzlePlayer;
        player.puzzle = puzzle;
        player.experimentalSetupAlg = puzzlePreviewSetupAlgorithm(puzzle, scramble, focusFtoWhiteFace);
        player.alg = animationAlg;
        player.visualization = "3D";
        player.hintFacelets = "none";
        player.controlPanel = "none";
        player.backView = "none";
        player.background = "none";
        staging.appendChild(player);
        document.body.appendChild(staging);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
        startMountedTwistyPlayer(player);
        puzzleObject = await Promise.race([
          player.experimentalCurrentThreeJSPuzzleObject(() => renderRef.current?.()),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("3D puzzle timeout")), 7_000)),
        ]) as unknown as Object3D;
      }
      if (disposed) { sideEventAnimation?.dispose(); player?.remove(); staging?.remove(); return; }
      const activeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer = activeRenderer;
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
      activeRenderer.domElement.className = "w-100 h-100";
      activeRenderer.domElement.style.display = "block";
      host.replaceChildren(activeRenderer.domElement);

      const scene = new THREE.Scene();
      const cameraConfig = defaultPuzzleCamera(puzzle);
      const isFtoTeachingPreview = focusFtoWhiteFace || Boolean(focusFtoFace);
      const camera = new THREE.PerspectiveCamera(cameraConfig.fov, 1, 0.1, 100);
      const initialOrbit = puzzleInitialOrbit(puzzle, isFtoTeachingPreview);
      const previewDistance = puzzlePreviewDistance(puzzle, cameraConfig.distance, isFtoTeachingPreview);
      const orbit = orbitRef.current = { ...initialOrbit, distance: previewDistance };
      targetDistanceRef.current = orbit.distance;
      const root = new THREE.Group();
      const puzzleBase = new THREE.Group();
      puzzleBase.rotation.z = puzzlePreviewBaseRoll(puzzle, isFtoTeachingPreview);
      puzzleBase.add(puzzleObject);
      const teachingFace = focusFtoFace ?? (focusFtoWhiteFace ? "white" : undefined);
      if (puzzle === "fto" && teachingFace) focusActualFtoFace(THREE, puzzleObject, puzzleBase, teachingFace);
      root.add(puzzleBase);
      scene.add(root);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2230, 2.4));
      const key = new THREE.DirectionalLight(0xffffff, 2.8);
      key.position.set(4, 6, 8);
      scene.add(key);

      const resizeAndRender = () => {
        const width = Math.max(220, host.clientWidth);
        const height = Math.max(puzzle === "megaminx" ? 270 : puzzle === "clock" ? 205 : 220, host.clientHeight);
        activeRenderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        root.rotation.set(orbit.pitch, orbit.yaw, 0);
        camera.position.set(0, 0, orbit.distance);
        camera.lookAt(0, 0, 0);
        activeRenderer.render(scene, camera);
      };
      renderRef.current = resizeAndRender;
      resetRef.current = () => { const nextOrbit = puzzleInitialOrbit(puzzle, isFtoTeachingPreview); orbit.yaw = nextOrbit.yaw; orbit.pitch = nextOrbit.pitch; orbit.distance = previewDistance; resizeAndRender(); };
      const observer = new ResizeObserver(resizeAndRender);
      observer.observe(host);
      resizeAndRender();
      setStatus("ready");
      if (animationAlg.trim()) player?.play?.();
      if (sideEventAnimation) { sideEventAnimation.finish(); resizeAndRender(); }
      cleanup = () => {
        observer.disconnect();
        if (zoomFrameRef.current !== null) window.cancelAnimationFrame(zoomFrameRef.current);
        zoomFrameRef.current = null;
        if (inertiaFrameRef.current !== null) window.cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
        pointersRef.current.clear();
        pinchRef.current = null;
        sideEventAnimation?.dispose();
        renderRef.current = null;
        resetRef.current = null;
        scene.remove(root);
        activeRenderer.dispose();
        activeRenderer.forceContextLoss();
        player?.remove();
        staging?.remove();
      };
    })().catch(() => {
      player?.remove();
      staging?.remove();
      renderer?.dispose();
      renderer?.forceContextLoss();
      if (!disposed) setStatus("error");
    });

    return () => { disposed = true; cleanup(); host.replaceChildren(); };
  }, [puzzle, scramble, animationAlg, animationRunId, focusFtoWhiteFace, focusFtoFace]);

  const smoothZoom = () => {
    if (!renderRef.current) return;
    if (zoomFrameRef.current !== null) return;
    const tick = () => {
      const orbit = orbitRef.current;
      const target = targetDistanceRef.current;
      const nextDistance = orbit.distance + (target - orbit.distance) * 0.28;
      orbit.distance = Math.abs(target - nextDistance) < 0.01 ? target : nextDistance;
      renderRef.current?.();
      if (orbit.distance === target) { zoomFrameRef.current = null; return; }
      zoomFrameRef.current = window.requestAnimationFrame(tick);
    };
    zoomFrameRef.current = window.requestAnimationFrame(tick);
  };

  const cancelInertia = () => {
    if (inertiaFrameRef.current !== null) window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
    inertiaVelocityRef.current = { yaw: 0, pitch: 0 };
  };

  const startInertia = () => {
    if (!renderRef.current || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const advance = () => {
      const next = inertiaStepForPuzzle(puzzle, orbitRef.current, inertiaVelocityRef.current);
      inertiaVelocityRef.current = next.velocity;
      if (Math.abs(next.velocity.yaw) < 0.0004 && Math.abs(next.velocity.pitch) < 0.0004) { cancelInertia(); return; }
      orbitRef.current.yaw = next.orbit.yaw;
      orbitRef.current.pitch = next.orbit.pitch;
      renderRef.current?.();
      inertiaFrameRef.current = window.requestAnimationFrame(advance);
    };
    inertiaFrameRef.current = window.requestAnimationFrame(advance);
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!renderRef.current) return;
    cancelInertia();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const points = Array.from(pointersRef.current.values());
      pinchRef.current = { gap: gapBetween(points), distance: targetDistanceRef.current };
      dragRef.current = null;
      return;
    }
    dragRef.current = { x: event.clientX, y: event.clientY, yaw: orbitRef.current.yaw, pitch: orbitRef.current.pitch, lastX: event.clientX, lastY: event.clientY, lastAt: performance.now(), moved: false };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId) || !renderRef.current) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      targetDistanceRef.current = distanceFromPinch(pinchRef.current.distance, pinchRef.current.gap, gapBetween(Array.from(pointersRef.current.values())));
      smoothZoom();
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastAt);
    inertiaVelocityRef.current = { yaw: ((event.clientX - drag.lastX) * 0.012 * 16) / elapsed, pitch: ((event.clientY - drag.lastY) * 0.012 * 16) / elapsed };
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastAt = now;
    drag.moved = true;
    const nextOrbit = orbitFromPuzzleDrag(puzzle, { yaw: drag.yaw, pitch: drag.pitch, distance: orbitRef.current.distance }, event.clientX - drag.x, event.clientY - drag.y);
    orbitRef.current.yaw = nextOrbit.yaw;
    orbitRef.current.pitch = nextOrbit.pitch;
    renderRef.current();
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const wasDragged = dragRef.current?.moved ?? false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    const remaining = Array.from(pointersRef.current.values())[0];
    dragRef.current = remaining ? { x: remaining.x, y: remaining.y, yaw: orbitRef.current.yaw, pitch: orbitRef.current.pitch, lastX: remaining.x, lastY: remaining.y, lastAt: performance.now(), moved: false } : null;
    if (!remaining && wasDragged) startInertia();
  };
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!renderRef.current) return;
    targetDistanceRef.current = clampDistance(targetDistanceRef.current + (event.deltaY > 0 ? 0.48 : -0.48));
    smoothZoom();
  };

  const cameraConfig = defaultPuzzleCamera(puzzle);
  const label = timerEventLabel(eventId, language);
  if (status === "error") return <div className="card card-body h-100 d-flex flex-column align-items-center justify-content-center text-center"><i className="bi bi-box-seam fs-1 text-body-secondary mb-3" aria-hidden="true" /><p className="fw-semibold mb-1">{label}</p><p className="small text-body-secondary mb-0">{language === "vi" ? "Không thể tạo mô hình 3D cho scramble này." : "The 3D model could not be created for this scramble."}</p></div>;

  return <div className="card bg-dark text-white h-100"><div className="card-body p-2 position-relative"><div ref={hostRef} className="w-100" style={{ minHeight: cameraConfig.height, touchAction: "none", cursor: "grab" }} aria-label={language === "vi" ? `Mô hình ${label} 3D` : `${label} 3D model`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} />{status === "loading" ? <div className="position-absolute top-50 start-50 translate-middle small text-white-50">{language === "vi" ? "Đang tạo mô hình 3D…" : "Building 3D model…"}</div> : null}<button type="button" className="btn btn-outline-light btn-sm position-absolute bottom-0 end-0 m-2" onClick={() => { cancelInertia(); resetRef.current?.(); targetDistanceRef.current = orbitRef.current.distance; }} aria-label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"} title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /></button></div></div>;
}
