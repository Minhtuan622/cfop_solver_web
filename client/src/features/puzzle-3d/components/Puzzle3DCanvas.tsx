import { useEffect, useRef, useState } from "react";
import type { Object3D, WebGLRenderer } from "three";
import { timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import {
  isSideEvent2DPuzzle,
  isCubeFamilyPuzzle,
  type FtoTeachingFace,
  type PuzzleId,
} from "../lib/puzzleIds";
import { defaultPuzzleCamera, fitDistanceForPoints } from "../lib/puzzleCamera";
import {
  focusActualFtoFace,
  puzzleInitialOrbit,
  puzzlePreviewBaseRoll,
  puzzlePreviewDistance,
  puzzlePreviewSetupAlgorithm,
} from "../lib/puzzleFraming";
import { recolorCubeStickerColors, type ColoredObject } from "../lib/recolorCubeStickerColors";
import { IconButton } from "@/components/ui/StudioUI";
import { RotateCcw } from "@/components/ui/Icon";
import { Puzzle3DErrorCard } from "./Puzzle3DErrorCard";
import { PreviewViewToggle } from "./PreviewViewToggle";
import { SquareOneCanvas } from "./SquareOneCanvas";
import { usePreviewView } from "../lib/previewView";
import { collectShownPoints } from "../lib/puzzleFitPoints";
import { usePuzzleOrbitControls } from "../lib/usePuzzleOrbitControls";
import {
  clearPreviewReloadFlag,
  isModuleLoadFailure,
  reloadPreviewPageOnce,
  startMountedTwistyPlayer,
  type PuzzlePlayer,
} from "../lib/previewPlayer";

type Puzzle3DCanvasProps = {
  eventId: TimerEventId;
  puzzle: PuzzleId;
  scramble: string;
  language: "vi" | "en";
  animationAlg?: string;
  animationRunId?: number;
  focusFtoWhiteFace?: boolean;
  focusFtoFace?: FtoTeachingFace;
  nativeColors?: boolean;
  tempoScale?: number;
  // Square-1 is drawn as the 3D model; pass false to get the flat diagram.
  model3d?: boolean;
};

export function Puzzle3DCanvas(props: Puzzle3DCanvasProps) {
  const [view, setView] = usePreviewView();
  // Clock only has a flat diagram, and a Square-1 case that cannot be drawn on
  // the 3D model asks for the diagram; neither has a choice to offer.
  const fixedFlat = props.puzzle === "clock" || (props.puzzle === "square1" && props.model3d === false);
  const flat = fixedFlat || view === "2d";
  const canvas =
    !flat && props.puzzle === "square1" ? (
      <SquareOneCanvas
        eventId={props.eventId}
        scramble={props.scramble}
        language={props.language}
        animationAlg={props.animationAlg}
        animationRunId={props.animationRunId}
        tempoScale={props.tempoScale}
      />
    ) : (
      <TwistyPuzzleCanvas {...props} force2d={flat} />
    );
  if (fixedFlat) return canvas;
  return (
    <div className="relative h-full">
      {canvas}
      <PreviewViewToggle value={view} onChange={setView} language={props.language} />
    </div>
  );
}

function TwistyPuzzleCanvas({
  eventId,
  puzzle,
  scramble,
  language,
  animationAlg = "",
  animationRunId = 0,
  focusFtoWhiteFace = false,
  focusFtoFace,
  nativeColors = false,
  tempoScale = 1,
  force2d = false,
}: Puzzle3DCanvasProps & { force2d?: boolean }) {
  const isTwoD = force2d || isSideEvent2DPuzzle(puzzle);
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
  } = usePuzzleOrbitControls(puzzle);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [retryTick, setRetryTick] = useState(0);
  const attemptRef = useRef({ key: "", attempt: 0 });
  const moduleFailureRef = useRef(false);
  const playerRef = useRef<PuzzlePlayer | null>(null);
  const scrambleRef = useRef(scramble);
  const animationAlgRef = useRef(animationAlg);
  const tempoRef = useRef(tempoScale);
  tempoRef.current = tempoScale;
  scrambleRef.current = scramble;
  animationAlgRef.current = animationAlg;
  const hasScramble = Boolean(scramble.trim());

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !hasScramble) return;
    const scramble = scrambleRef.current;
    const animationAlg = animationAlgRef.current;
    let disposed = false;
    let cleanup = () => undefined;
    let staging: HTMLDivElement | null = null;
    let player: PuzzlePlayer | null = null;
    let renderer: WebGLRenderer | null = null;
    const buildKey = `${puzzle}|${focusFtoWhiteFace}|${focusFtoFace ?? ""}`;
    if (attemptRef.current.key !== buildKey)
      attemptRef.current = { key: buildKey, attempt: 0 };
    moduleFailureRef.current = false;
    setStatus("loading");
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isModuleLoadFailure(event.reason)) moduleFailureRef.current = true;
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    void (async () => {
      if (disposed) return;
      if (isTwoD) {
        await import("cubing/twisty");
        if (disposed) return;
        player = document.createElement("twisty-player") as PuzzlePlayer;
        player.puzzle = puzzle;
        player.experimentalSetupAlg = scramble;
        player.alg = animationAlg;
        player.visualization = "2D";
        player.tempoScale = tempoRef.current;
        playerRef.current = player;
        player.hintFacelets = "none";
        player.controlPanel = "none";
        player.backView = "none";
        player.background = "none";
        player.style.width = "100%";
        player.style.height = "100%";
        host.replaceChildren(player);
        startMountedTwistyPlayer(player);
        clearPreviewReloadFlag();
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
      player.tempoScale = tempoRef.current;
      playerRef.current = player;
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
      clearPreviewReloadFlag();
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
      const fitDistance = () => {
        if (!fitEnabled) return previewDistance;
        root.rotation.set(orbit.pitch, orbit.yaw, 0);
        puzzleObject.updateWorldMatrix(true, true);
        const points = collectShownPoints(puzzleObject, new THREE.Vector3());
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
      playerRef.current = null;
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      cleanup();
      host.replaceChildren();
    };
  }, [
    puzzle,
    hasScramble,
    focusFtoWhiteFace,
    focusFtoFace,
    nativeColors,
    isTwoD,
    retryTick,
  ]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.experimentalSetupAlg = isTwoD
      ? scramble
      : puzzlePreviewSetupAlgorithm(puzzle, scramble, focusFtoWhiteFace);
    player.alg = animationAlg;
    player.tempoScale = tempoScale;
    player.jumpToStart?.({ flash: false });
    renderRef.current?.();
    if (animationAlg.trim()) player.play?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scramble, animationAlg, animationRunId]);

  useEffect(() => {
    const player = playerRef.current;
    if (player) player.tempoScale = tempoScale;
  }, [tempoScale]);

  const label = timerEventLabel(eventId, language);
  const modelLabel = isTwoD ? "2D" : "3D";
  if (status === "error")
    return (
      <Puzzle3DErrorCard
        label={label}
        modelLabel={modelLabel}
        language={language}
        onRetry={() => {
          if (reloadPreviewPageOnce()) return;
          attemptRef.current = { key: attemptRef.current.key, attempt: 0 };
          moduleFailureRef.current = false;
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
            onClick={resetView}
            title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}
          />
        )}
      </div>
    </div>
  );
}
