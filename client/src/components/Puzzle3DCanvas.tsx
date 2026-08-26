import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import type { Object3D, WebGLRenderer } from "three";
import type { TimerEventId } from "@/lib/timerEvents";

type PuzzleId = "pyraminx" | "megaminx";
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

export function Puzzle3DCanvas({ eventId, puzzle, scramble, language }: { eventId: TimerEventId; puzzle: PuzzleId; scramble: string; language: "vi" | "en" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const orbitRef = useRef({ yaw: -0.55, pitch: 0.32, distance: 5.4 });
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
    setStatus("loading");

    void (async () => {
      const [{ TwistyPlayer }, THREE] = await Promise.all([import("cubing/twisty"), import("three")]);
      if (disposed) return;
      staging = document.createElement("div");
      staging.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:2px;height:2px;overflow:hidden;pointer-events:none";
      player = document.createElement("twisty-player") as PuzzlePlayer;
      player.puzzle = puzzle;
      player.experimentalSetupAlg = scramble;
      player.alg = "";
      player.visualization = "3D";
      player.hintFacelets = "none";
      player.controlPanel = "none";
      player.backView = "none";
      player.background = "none";
      staging.appendChild(player);
      document.body.appendChild(staging);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
      startMountedTwistyPlayer(player);
      const puzzleObject = await Promise.race([
        player.experimentalCurrentThreeJSPuzzleObject(() => renderRef.current?.()),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("3D puzzle timeout")), 7_000)),
      ]);
      if (disposed) { player.remove(); staging.remove(); return; }

      const activeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer = activeRenderer;
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
      activeRenderer.domElement.className = "w-100 h-100";
      activeRenderer.domElement.style.display = "block";
      host.replaceChildren(activeRenderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(puzzle === "megaminx" ? 29 : 34, 1, 0.1, 100);
      const orbit = orbitRef.current = { yaw: -0.55, pitch: 0.32, distance: puzzle === "megaminx" ? 7.2 : 5.4 };
      const root = new THREE.Group();
      root.add(puzzleObject as unknown as Object3D);
      scene.add(root);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2230, 2.4));
      const key = new THREE.DirectionalLight(0xffffff, 2.8);
      key.position.set(4, 6, 8);
      scene.add(key);

      const resizeAndRender = () => {
        const width = Math.max(220, host.clientWidth);
        const height = Math.max(puzzle === "megaminx" ? 270 : 220, host.clientHeight);
        activeRenderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        root.rotation.set(orbit.pitch, orbit.yaw, 0);
        camera.position.set(0, 0, orbit.distance);
        camera.lookAt(0, 0, 0);
        activeRenderer.render(scene, camera);
      };
      renderRef.current = resizeAndRender;
      resetRef.current = () => { orbit.yaw = -0.55; orbit.pitch = 0.32; orbit.distance = puzzle === "megaminx" ? 7.2 : 5.4; resizeAndRender(); };
      const observer = new ResizeObserver(resizeAndRender);
      observer.observe(host);
      resizeAndRender();
      setStatus("ready");
      cleanup = () => {
        observer.disconnect();
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
  }, [puzzle, scramble]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!renderRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, yaw: orbitRef.current.yaw, pitch: orbitRef.current.pitch };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !renderRef.current) return;
    orbitRef.current.yaw = drag.yaw + (event.clientX - drag.x) * 0.012;
    orbitRef.current.pitch = Math.max(-1.1, Math.min(1.1, drag.pitch - (event.clientY - drag.y) * 0.012));
    renderRef.current();
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); dragRef.current = null; };
  const wheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); if (!renderRef.current) return; orbitRef.current.distance = Math.max(3.6, Math.min(10.5, orbitRef.current.distance + (event.deltaY > 0 ? 0.45 : -0.45))); renderRef.current(); };

  if (status === "error") return <div className="card card-body h-100 d-flex flex-column align-items-center justify-content-center text-center"><i className="bi bi-box-seam fs-1 text-body-secondary mb-3" aria-hidden="true" /><p className="fw-semibold mb-1">{eventId === "pyram" ? "Pyraminx" : "Megaminx"}</p><p className="small text-body-secondary mb-0">{language === "vi" ? "Không thể tạo mô hình 3D cho scramble này." : "The 3D model could not be created for this scramble."}</p></div>;

  return <div className="card bg-dark text-white h-100"><div className="card-body p-2 position-relative"><div ref={hostRef} className="w-100" style={{ minHeight: eventId === "minx" ? "17rem" : "14rem", touchAction: "none", cursor: "grab" }} aria-label={language === "vi" ? `Mô hình ${eventId === "pyram" ? "Pyraminx" : "Megaminx"} 3D` : `${eventId === "pyram" ? "Pyraminx" : "Megaminx"} 3D model`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} />{status === "loading" ? <div className="position-absolute top-50 start-50 translate-middle small text-white-50">{language === "vi" ? "Đang tạo mô hình 3D…" : "Building 3D model…"}</div> : null}<button type="button" className="btn btn-outline-light btn-sm position-absolute bottom-0 end-0 m-2" onClick={() => resetRef.current?.()} aria-label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"} title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /></button></div></div>;
}
