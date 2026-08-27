import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import type { Object3D, WebGLRenderer } from "three";
import { timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import { isSideEvent3DPuzzle, sideEvent3DAnimation, type SideEvent3DAnimation } from "@/components/SideEvent3DObject";

type PuzzleId = "4x4x4" | "5x5x5" | "6x6x6" | "7x7x7" | "pyraminx" | "skewb" | "megaminx" | "fto" | "square1" | "clock";
export type PuzzleOrbit = { yaw: number; pitch: number; distance: number };
type Point = { x: number; y: number };
const CAMERA_LIMITS = { min: 3.6, max: 13, pitch: 1.1 };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function orbitFromDrag(start: PuzzleOrbit, deltaX: number, deltaY: number): PuzzleOrbit {
  return {
    ...start,
    yaw: start.yaw + deltaX * 0.012,
    pitch: clamp(start.pitch + deltaY * 0.012, -CAMERA_LIMITS.pitch, CAMERA_LIMITS.pitch),
  };
}

export function distanceFromPinch(startDistance: number, startGap: number, currentGap: number) {
  if (startGap <= 0 || currentGap <= 0) return clamp(startDistance, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
  return clamp(startDistance * (startGap / currentGap), CAMERA_LIMITS.min, CAMERA_LIMITS.max);
}

export function inertiaStep(orbit: PuzzleOrbit, velocity: { yaw: number; pitch: number }) {
  const nextVelocity = { yaw: velocity.yaw * 0.91, pitch: velocity.pitch * 0.91 };
  return {
    orbit: { ...orbit, yaw: orbit.yaw + nextVelocity.yaw, pitch: clamp(orbit.pitch + nextVelocity.pitch, -CAMERA_LIMITS.pitch, CAMERA_LIMITS.pitch) },
    velocity: nextVelocity,
  };
}

function defaultPuzzleCamera(puzzle: PuzzleId) {
  if (puzzle === "megaminx") return { fov: 29, distance: 6.1, height: "18rem" };
  if (puzzle === "fto") return { fov: 28, distance: 5.95, height: "17rem" };
  if (puzzle === "pyraminx") return { fov: 32, distance: 4.45, height: "16rem" };
  if (puzzle === "skewb") return { fov: 33, distance: 4.65, height: "16rem" };
  if (puzzle === "clock") return { fov: 31, distance: 7.45, height: "12rem" };
  if (puzzle === "square1") return { fov: 32, distance: 7.15, height: "13rem" };
  if (puzzle === "7x7x7") return { fov: 31, distance: 6.8, height: "15rem" };
  if (puzzle === "6x6x6") return { fov: 32, distance: 6.5, height: "15rem" };
  if (puzzle === "5x5x5") return { fov: 33, distance: 6.1, height: "14rem" };
  if (puzzle === "4x4x4") return { fov: 34, distance: 5.8, height: "14rem" };
  return { fov: 34, distance: 5.4, height: "14rem" };
}

function gapBetween([first, second]: Point[]) { return Math.hypot(first.x - second.x, first.y - second.y); }
type PuzzlePlayer = HTMLElement & {
  puzzle: PuzzleId;
  experimentalSetupAlg: string;
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

export function Puzzle3DCanvas({ eventId, puzzle, scramble, language, animationAlg = "", animationRunId = 0 }: { eventId: TimerEventId; puzzle: PuzzleId; scramble: string; language: "vi" | "en"; animationAlg?: string; animationRunId?: number }) {
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
      const THREE = await import("three");
      if (disposed) return;
      let puzzleObject: Object3D;
      if (isSideEvent3DPuzzle(puzzle)) {
        sideEventAnimation = await sideEvent3DAnimation(THREE, puzzle, scramble);
        puzzleObject = sideEventAnimation.object;
      } else {
        await import("cubing/twisty");
        staging = document.createElement("div");
        staging.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:2px;height:2px;overflow:hidden;pointer-events:none";
        player = document.createElement("twisty-player") as PuzzlePlayer;
        player.puzzle = puzzle;
        player.experimentalSetupAlg = scramble;
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
      const camera = new THREE.PerspectiveCamera(cameraConfig.fov, 1, 0.1, 100);
      const orbit = orbitRef.current = { yaw: -0.55, pitch: 0.32, distance: cameraConfig.distance };
      targetDistanceRef.current = orbit.distance;
      const root = new THREE.Group();
      root.add(puzzleObject);
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
      resetRef.current = () => { orbit.yaw = -0.55; orbit.pitch = 0.32; orbit.distance = cameraConfig.distance; resizeAndRender(); };
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
  }, [puzzle, scramble, animationAlg, animationRunId]);

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
      const next = inertiaStep(orbitRef.current, inertiaVelocityRef.current);
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
    const nextOrbit = orbitFromDrag({ yaw: drag.yaw, pitch: drag.pitch, distance: orbitRef.current.distance }, event.clientX - drag.x, event.clientY - drag.y);
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
    targetDistanceRef.current = clamp(targetDistanceRef.current + (event.deltaY > 0 ? 0.48 : -0.48), CAMERA_LIMITS.min, CAMERA_LIMITS.max);
    smoothZoom();
  };

  const cameraConfig = defaultPuzzleCamera(puzzle);
  const label = timerEventLabel(eventId, language);
  if (status === "error") return <div className="card card-body h-100 d-flex flex-column align-items-center justify-content-center text-center"><i className="bi bi-box-seam fs-1 text-body-secondary mb-3" aria-hidden="true" /><p className="fw-semibold mb-1">{label}</p><p className="small text-body-secondary mb-0">{language === "vi" ? "Không thể tạo mô hình 3D cho scramble này." : "The 3D model could not be created for this scramble."}</p></div>;

  return <div className="card bg-dark text-white h-100"><div className="card-body p-2 position-relative"><div ref={hostRef} className="w-100" style={{ minHeight: cameraConfig.height, touchAction: "none", cursor: "grab" }} aria-label={language === "vi" ? `Mô hình ${label} 3D` : `${label} 3D model`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} />{status === "loading" ? <div className="position-absolute top-50 start-50 translate-middle small text-white-50">{language === "vi" ? "Đang tạo mô hình 3D…" : "Building 3D model…"}</div> : null}<button type="button" className="btn btn-outline-light btn-sm position-absolute bottom-0 end-0 m-2" onClick={() => { cancelInertia(); resetRef.current?.(); targetDistanceRef.current = orbitRef.current.distance; }} aria-label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"} title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /></button></div></div>;
}
