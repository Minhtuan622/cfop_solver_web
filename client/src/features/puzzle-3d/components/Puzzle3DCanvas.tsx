import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { BufferAttribute, Object3D, WebGLRenderer } from "three";
import { timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import {
  isSideEvent2DPuzzle,
  isCubeFamilyPuzzle,
  type FtoTeachingFace,
  type PuzzleId,
} from "../lib/puzzleIds";
import {
  defaultPuzzleCamera,
  distanceFromPinch,
  fitDistanceForPoints,
  gapBetween,
  inertiaStepForPuzzle,
  orbitFromPuzzleDrag,
  type PointerPoint,
  type ProjectedPoint,
} from "../lib/puzzleCamera";
import {
  focusActualFtoFace,
  puzzleInitialOrbit,
  puzzlePreviewBaseRoll,
  puzzlePreviewDistance,
  puzzlePreviewSetupAlgorithm,
} from "../lib/puzzleFraming";
import {
  recolorCubeStickerColors,
  type ColoredObject,
} from "../lib/recolorCubeStickerColors";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/StudioUI";
import { BoxSeam, RotateCcw } from "@/components/ui/Icon";

type PuzzlePlayer = HTMLElement & {
  puzzle: PuzzleId;
  experimentalSetupAlg: string;
  experimentalModel: {
    currentPattern: { get: () => Promise<{ patternData: unknown }> };
  };
  alg: string;
  visualization: "2D" | "3D";
  hintFacelets: "none";
  controlPanel: "none";
  backView: "none";
  background: "none";
  experimentalCurrentThreeJSPuzzleObject: (
    callback: () => void
  ) => Promise<unknown>;
  play?: () => void;
  pause?: () => void;
};

function startMountedTwistyPlayer(player: HTMLElement) {
  let target: object | null = player;
  while (target) {
    const startSymbol = Object.getOwnPropertySymbols(target).find(
      symbol => symbol.description === "intersectedCallback"
    );
    if (startSymbol) {
      const start = (target as Record<symbol, unknown>)[startSymbol];
      if (typeof start === "function") {
        void start.call(player);
        return;
      }
    }
    target = Object.getPrototypeOf(target);
  }
}

/** Cờ sessionStorage đánh dấu trang đã được nạp lại một lần để cứu lỗi 3D. */
const PREVIEW_RELOAD_FLAG = "cfop-3d-preview-reload";

/**
 * Lỗi tải module (import động hỏng). Module map của trình duyệt cache luôn cả
 * thất bại, nên thử lại `import()` trong cùng document sẽ fail ngay mà không
 * có request mạng nào nữa — chỉ nạp lại trang (document mới) mới xoá được cache.
 */
function isModuleLoadFailure(error: unknown): boolean {
  return /dynamically imported module|importing a module/i.test(
    String((error as { message?: string } | null | undefined)?.message ?? error)
  );
}

export function Puzzle3DCanvas({
  eventId,
  puzzle,
  scramble,
  language,
  animationAlg = "",
  animationRunId = 0,
  focusFtoWhiteFace = false,
  focusFtoFace,
  nativeColors = false,
}: {
  eventId: TimerEventId;
  puzzle: PuzzleId;
  scramble: string;
  language: "vi" | "en";
  animationAlg?: string;
  animationRunId?: number;
  focusFtoWhiteFace?: boolean;
  focusFtoFace?: FtoTeachingFace;
  /**
   * Giữ màu WCA gốc của Cubing.js (trắng U, xanh lá F) thay vì đổi sang bảng
   * màu studio (vàng U): dùng khi xem scramble đúng hướng cầm lúc tráo.
   */
  nativeColors?: boolean;
}) {
  const isTwoD = isSideEvent2DPuzzle(puzzle);
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    lastX: number;
    lastY: number;
    lastAt: number;
    moved: boolean;
  } | null>(null);
  const orbitRef = useRef({ yaw: -0.55, pitch: 0.32, distance: 5.4 });
  const targetDistanceRef = useRef(5.4);
  const pointersRef = useRef(new Map<number, PointerPoint>());
  const pinchRef = useRef<{ gap: number; distance: number } | null>(null);
  const userZoomedRef = useRef(false);
  const zoomFrameRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const inertiaVelocityRef = useRef({ yaw: 0, pitch: 0 });
  const renderRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  // Lần thử lại cho cùng một preview; đổi puzzle/scramble thì đếm lại từ 0.
  const [retryTick, setRetryTick] = useState(0);
  const attemptRef = useRef({ key: "", attempt: 0 });
  // Lần dựng gần nhất có lỗi tải module (import động) hay không — lỗi này để
  // lại cache hỏng trong module map của document, thử lại trong cùng document
  // vô ích; chỉ nạp lại trang mới xoá được.
  const moduleFailureRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !scramble.trim()) return;
    let disposed = false;
    let cleanup = () => undefined;
    let staging: HTMLDivElement | null = null;
    let player: PuzzlePlayer | null = null;
    let renderer: WebGLRenderer | null = null;
    const buildKey = `${puzzle}|${scramble}|${animationRunId}|${focusFtoWhiteFace}|${focusFtoFace ?? ""}`;
    if (attemptRef.current.key !== buildKey)
      attemptRef.current = { key: buildKey, attempt: 0 };
    moduleFailureRef.current = false;
    setStatus("loading");
    // Lỗi tải module phát sinh bên trong cubing.js không lan tới catch ở dưới
    // (chỉ thành unhandled rejection), nên nghe ở window để nhận diện.
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isModuleLoadFailure(event.reason)) moduleFailureRef.current = true;
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    void (async () => {
      if (disposed) return;
      if (isTwoD) {
        // Cubing.js chỉ có KPuzzle + SVG cho Square-1/Clock, không có model
        // 3D. Dùng đúng trình xem 2D của thư viện thay vì tự dựng hình học.
        await import("cubing/twisty");
        if (disposed) return;
        player = document.createElement("twisty-player") as PuzzlePlayer;
        player.puzzle = puzzle;
        player.experimentalSetupAlg = scramble;
        player.alg = animationAlg;
        player.visualization = "2D";
        player.hintFacelets = "none";
        player.controlPanel = "none";
        player.backView = "none";
        player.background = "none";
        // Cubing.js lays the 2D view out with `display: grid` + `contain: size`;
        // overriding display collapses the chain to 0 px, so only set the size.
        player.style.width = "100%";
        player.style.height = "100%";
        host.replaceChildren(player);
        // The player waits for an IntersectionObserver before rendering; start
        // it explicitly so the 2D SVG appears even inside a short preview card.
        startMountedTwistyPlayer(player);
        try {
          window.sessionStorage.removeItem(PREVIEW_RELOAD_FLAG);
        } catch {
          /* sessionStorage có thể bị chặn — bỏ qua. */
        }
        setStatus("ready");
        if (animationAlg.trim()) {
          window.setTimeout(() => {
            if (!disposed) player?.play?.();
          }, 120);
        }
        cleanup = () => {
          player?.remove();
        };
        return;
      }
      const [three] = await Promise.all([
        import("three"),
        import("cubing/twisty"),
      ]);
      const THREE = three;
      staging = document.createElement("div");
      staging.style.cssText =
        "position:fixed;left:-10000px;top:-10000px;width:2px;height:2px;overflow:hidden;pointer-events:none";
      player = document.createElement("twisty-player") as PuzzlePlayer;
      player.puzzle = puzzle;
      player.experimentalSetupAlg = puzzlePreviewSetupAlgorithm(
        puzzle,
        scramble,
        focusFtoWhiteFace
      );
      player.alg = animationAlg;
      player.visualization = "3D";
      player.hintFacelets = "none";
      player.controlPanel = "none";
      player.backView = "none";
      player.background = "none";
      staging.appendChild(player);
      document.body.appendChild(staging);
      await new Promise<void>(resolve => window.setTimeout(resolve, 80));
      startMountedTwistyPlayer(player);
      const puzzleObject = (await Promise.race([
        player.experimentalCurrentThreeJSPuzzleObject(() =>
          renderRef.current?.()
        ),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("3D puzzle timeout")), 7_000)
        ),
      ])) as unknown as Object3D;
      if (disposed) {
        player?.remove();
        staging?.remove();
        return;
      }
      if (isCubeFamilyPuzzle(puzzle) && !nativeColors)
        recolorCubeStickerColors(
          puzzleObject as unknown as ColoredObject,
        );
      // Module đã tải xong và player đã trả về đối tượng 3D: xoá cờ "đã nạp
      // lại trang" để lần hỏng sau (nếu có) vẫn được phép nạp lại trang.
      try {
        window.sessionStorage.removeItem(PREVIEW_RELOAD_FLAG);
      } catch {
        /* sessionStorage có thể bị chặn — bỏ qua. */
      }
      const activeRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer = activeRenderer;
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
      activeRenderer.domElement.className = "h-full w-full";
      activeRenderer.domElement.style.display = "block";
      host.replaceChildren(activeRenderer.domElement);

      const scene = new THREE.Scene();
      const cameraConfig = defaultPuzzleCamera(puzzle);
      const isFtoTeachingPreview = focusFtoWhiteFace || Boolean(focusFtoFace);
      const camera = new THREE.PerspectiveCamera(cameraConfig.fov, 1, 0.1, 100);
      const initialOrbit = puzzleInitialOrbit(puzzle, isFtoTeachingPreview);
      const previewDistance = puzzlePreviewDistance(
        puzzle,
        cameraConfig.distance,
        isFtoTeachingPreview
      );
      const orbit = (orbitRef.current = {
        ...initialOrbit,
        distance: previewDistance,
      });
      targetDistanceRef.current = orbit.distance;
      const root = new THREE.Group();
      const puzzleBase = new THREE.Group();
      puzzleBase.rotation.z = puzzlePreviewBaseRoll(
        puzzle,
        isFtoTeachingPreview
      );
      puzzleBase.add(puzzleObject);
      const teachingFace =
        focusFtoFace ?? (focusFtoWhiteFace ? "white" : undefined);
      if (puzzle === "fto" && teachingFace)
        focusActualFtoFace(THREE, puzzleObject, puzzleBase, teachingFace);
      root.add(puzzleBase);
      scene.add(root);
      // Flat lighting only: no direction, every face gets the same light.
      scene.add(new THREE.AmbientLight(0xffffff, 2.2));

      const fitEnabled = !(puzzle === "fto" && isFtoTeachingPreview);
      userZoomedRef.current = false;

      const sizeRenderer = () => {
        const width = Math.max(1, Math.round(host.clientWidth));
        const height = Math.max(1, Math.round(host.clientHeight));
        activeRenderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const resizeAndRender = () => {
        sizeRenderer();
        if (isCubeFamilyPuzzle(puzzle) && !nativeColors)
          recolorCubeStickerColors(
            puzzleObject as unknown as ColoredObject,
          );
        root.rotation.set(orbit.pitch, orbit.yaw, 0);
        camera.position.set(0, 0, orbit.distance);
        camera.lookAt(0, 0, 0);
        activeRenderer.render(scene, camera);
      };
      /**
       * cubing.js hides hint facelets behind invisible materials and meshes.
       * Both extend past the puzzle, so only sample groups the renderer shows.
       */
      const isShownMaterial = (
        material: { visible?: boolean; opacity?: number } | undefined
      ) => {
        if (!material) return false;
        return material.visible !== false && (material.opacity ?? 1) > 0.02;
      };
      const isShown = (object: Object3D) => {
        let node: Object3D | null = object;
        while (node) {
          if (!node.visible) return false;
          node = node.parent;
        }
        return true;
      };
      type FitMesh = Object3D & {
        isMesh?: boolean;
        geometry?: {
          attributes?: { position?: BufferAttribute };
          groups?: ReadonlyArray<{
            start: number;
            count: number;
            materialIndex?: number;
          }>;
          index?: BufferAttribute | null;
        };
        material?:
          | { visible?: boolean; opacity?: number }
          | Array<{ visible?: boolean; opacity?: number }>;
      };
      const fitDistance = () => {
        if (!fitEnabled) return previewDistance;
        root.rotation.set(orbit.pitch, orbit.yaw, 0);
        puzzleObject.updateWorldMatrix(true, true);
        const points: ProjectedPoint[] = [];
        const vertex = new THREE.Vector3();
        puzzleObject.traverse(child => {
          const mesh = child as FitMesh;
          const geometry = mesh.geometry;
          const position = geometry?.attributes?.position;
          if (!mesh.isMesh || !position || !isShown(mesh)) return;
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          const materialShown = (materialIndex: number) =>
            isShownMaterial(materials[materialIndex] ?? materials[0]);
          const push = (index: number) => {
            vertex.fromBufferAttribute(position, index);
            vertex.applyMatrix4(mesh.matrixWorld);
            points.push({ x: vertex.x, y: vertex.y, z: vertex.z });
          };
          const groups = geometry?.groups ?? [];
          if (!groups.length) {
            if (!materialShown(0)) return;
            for (let index = 0; index < position.count; index += 1) push(index);
            return;
          }
          const triangles = geometry?.index;
          for (const group of groups) {
            if (group.count <= 0 || !materialShown(group.materialIndex ?? 0))
              continue;
            const end = Math.min(
              group.start + group.count,
              triangles ? triangles.count : position.count
            );
            for (let index = group.start; index < end; index += 1)
              push(triangles ? triangles.getX(index) : index);
          }
        });
        if (!points.length) return previewDistance;
        return fitDistanceForPoints(points, camera.fov, camera.aspect);
      };
      const fitAndRender = () => {
        sizeRenderer();
        if (fitEnabled && !userZoomedRef.current) {
          orbit.distance = fitDistance();
          targetDistanceRef.current = orbit.distance;
        }
        resizeAndRender();
      };
      renderRef.current = resizeAndRender;
      resetRef.current = () => {
        const nextOrbit = puzzleInitialOrbit(puzzle, isFtoTeachingPreview);
        orbit.yaw = nextOrbit.yaw;
        orbit.pitch = nextOrbit.pitch;
        userZoomedRef.current = false;
        orbit.distance = fitDistance();
        targetDistanceRef.current = orbit.distance;
        resizeAndRender();
      };
      const observer = new ResizeObserver(fitAndRender);
      observer.observe(host);
      fitAndRender();
      setStatus("ready");
      if (animationAlg.trim()) player?.play?.();
      cleanup = () => {
        observer.disconnect();
        if (zoomFrameRef.current !== null)
          window.cancelAnimationFrame(zoomFrameRef.current);
        zoomFrameRef.current = null;
        if (inertiaFrameRef.current !== null)
          window.cancelAnimationFrame(inertiaFrameRef.current);
        inertiaFrameRef.current = null;
        pointersRef.current.clear();
        pinchRef.current = null;
        renderRef.current = null;
        resetRef.current = null;
        scene.remove(root);
        activeRenderer.dispose();
        activeRenderer.forceContextLoss();
        player?.remove();
        staging?.remove();
      };
    })().catch(error => {
      player?.remove();
      staging?.remove();
      renderer?.dispose();
      renderer?.forceContextLoss();
      if (disposed) return;
      moduleFailureRef.current =
        moduleFailureRef.current || isModuleLoadFailure(error);
      // Thất bại thường chỉ là tạm thời (chunk/wasm tải chậm hoặc chập chờn
      // đúng một lần), nên thử lại tự động trước khi báo lỗi cho người dùng.
      // Riêng lỗi tải module thì thử lại trong document vô ích (module map
      // cache luôn cả thất bại) — báo lỗi ngay để nút "Thử lại" nạp lại trang.
      if (!moduleFailureRef.current && attemptRef.current.attempt < 2) {
        attemptRef.current = {
          key: buildKey,
          attempt: attemptRef.current.attempt + 1,
        };
        window.setTimeout(
          () => {
            if (!disposed) setRetryTick(value => value + 1);
          },
          attemptRef.current.attempt === 1 ? 400 : 1600
        );
        return;
      }
      if (import.meta.env.DEV)
        console.error("[3D preview] không dựng được mô hình", error);
      setStatus("error");
    });

    return () => {
      disposed = true;
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      cleanup();
      host.replaceChildren();
    };
  }, [
    puzzle,
    scramble,
    animationAlg,
    animationRunId,
    focusFtoWhiteFace,
    focusFtoFace,
    nativeColors,
    retryTick,
  ]);

  const smoothZoom = () => {
    if (!renderRef.current) return;
    if (zoomFrameRef.current !== null) return;
    const tick = () => {
      const orbit = orbitRef.current;
      const target = targetDistanceRef.current;
      const nextDistance = orbit.distance + (target - orbit.distance) * 0.28;
      orbit.distance =
        Math.abs(target - nextDistance) < 0.01 ? target : nextDistance;
      renderRef.current?.();
      if (orbit.distance === target) {
        zoomFrameRef.current = null;
        return;
      }
      zoomFrameRef.current = window.requestAnimationFrame(tick);
    };
    zoomFrameRef.current = window.requestAnimationFrame(tick);
  };

  const cancelInertia = () => {
    if (inertiaFrameRef.current !== null)
      window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
    inertiaVelocityRef.current = { yaw: 0, pitch: 0 };
  };

  const startInertia = () => {
    if (
      !renderRef.current ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const advance = () => {
      const next = inertiaStepForPuzzle(
        puzzle,
        orbitRef.current,
        inertiaVelocityRef.current
      );
      inertiaVelocityRef.current = next.velocity;
      if (
        Math.abs(next.velocity.yaw) < 0.0004 &&
        Math.abs(next.velocity.pitch) < 0.0004
      ) {
        cancelInertia();
        return;
      }
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
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointersRef.current.size >= 2) {
      const points = Array.from(pointersRef.current.values());
      pinchRef.current = {
        gap: gapBetween(points),
        distance: targetDistanceRef.current,
      };
      dragRef.current = null;
      return;
    }
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      yaw: orbitRef.current.yaw,
      pitch: orbitRef.current.pitch,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: performance.now(),
      moved: false,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId) || !renderRef.current) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      userZoomedRef.current = true;
      targetDistanceRef.current = distanceFromPinch(
        pinchRef.current.distance,
        pinchRef.current.gap,
        gapBetween(Array.from(pointersRef.current.values()))
      );
      smoothZoom();
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastAt);
    inertiaVelocityRef.current = {
      yaw: ((event.clientX - drag.lastX) * 0.012 * 16) / elapsed,
      pitch: ((event.clientY - drag.lastY) * 0.012 * 16) / elapsed,
    };
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastAt = now;
    drag.moved = true;
    const nextOrbit = orbitFromPuzzleDrag(
      puzzle,
      { yaw: drag.yaw, pitch: drag.pitch, distance: orbitRef.current.distance },
      event.clientX - drag.x,
      event.clientY - drag.y
    );
    orbitRef.current.yaw = nextOrbit.yaw;
    orbitRef.current.pitch = nextOrbit.pitch;
    renderRef.current();
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const wasDragged = dragRef.current?.moved ?? false;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    const remaining = Array.from(pointersRef.current.values())[0];
    dragRef.current = remaining
      ? {
          x: remaining.x,
          y: remaining.y,
          yaw: orbitRef.current.yaw,
          pitch: orbitRef.current.pitch,
          lastX: remaining.x,
          lastY: remaining.y,
          lastAt: performance.now(),
          moved: false,
        }
      : null;
    if (!remaining && wasDragged) startInertia();
  };
  const label = timerEventLabel(eventId, language);
  const modelLabel = isTwoD ? "2D" : "3D";
  if (status === "error")
    return (
      <div className="rounded-card bg-surface p-5 sm:p-6 h-full flex flex-col items-center justify-center text-center">
        <BoxSeam className="text-4xl text-muted mb-4" />
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-sm text-muted mb-3">
          {language === "vi"
            ? `Không thể tạo mô hình ${modelLabel} cho scramble này.`
            : `The ${modelLabel} model could not be created for this scramble.`}
        </p>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            // Lỗi thường để lại cache hỏng trong module map của document hiện
            // tại, nên nạp lại trang một lần là cách phục hồi đáng tin nhất.
            // Cờ sessionStorage chặn vòng lặp nạp lại; các lần bấm sau (và
            // trường hợp sessionStorage bị chặn) dựng lại trong trang.
            try {
              if (!window.sessionStorage.getItem(PREVIEW_RELOAD_FLAG)) {
                window.sessionStorage.setItem(PREVIEW_RELOAD_FLAG, "1");
                window.location.reload();
                return;
              }
            } catch {
              /* sessionStorage có thể bị chặn — dựng lại trong trang. */
            }
            attemptRef.current = { key: attemptRef.current.key, attempt: 0 };
            moduleFailureRef.current = false;
            setStatus("loading");
            setRetryTick(value => value + 1);
          }}
        >
          {language === "vi" ? "Thử lại" : "Try again"}
        </Button>
      </div>
    );

  return (
    <div className="rounded-card bg-surface h-full flex flex-col">
      <div className="p-2 relative flex-1 min-h-0">
        <div
          ref={hostRef}
          role="img"
          className="h-full w-full"
          style={
            isTwoD
              ? undefined
              : {
                  touchAction: "none",
                  cursor: "grab",
                }
          }
          aria-label={
            language === "vi"
              ? `Mô hình ${label} ${modelLabel}`
              : `${label} ${modelLabel} model`
          }
          onPointerDown={isTwoD ? undefined : pointerDown}
          onPointerMove={isTwoD ? undefined : pointerMove}
          onPointerUp={isTwoD ? undefined : pointerUp}
          onPointerCancel={isTwoD ? undefined : pointerUp}
        />
        {status === "loading" ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted">
            {language === "vi"
              ? `Đang tải mô hình ${modelLabel}…`
              : `Loading ${modelLabel} model…`}
          </div>
        ) : null}
        {isTwoD ? null : (
          <IconButton
            label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"}
            icon={<RotateCcw className="text-base" aria-hidden="true" />}
            className="absolute bottom-0 right-0 m-2 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              cancelInertia();
              userZoomedRef.current = false;
              resetRef.current?.();
              targetDistanceRef.current = orbitRef.current.distance;
            }}
            title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}
          />
        )}
      </div>
    </div>
  );
}
