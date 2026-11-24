import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import * as THREE from "three";
import {
  CELL_2,
  CELL_3,
  ORBIT_LIMIT,
  parseMove,
} from "../lib/cubeGuideFacelets";
import { IconButton } from "@/components/ui/StudioUI";
import { CubeGuide3DFallback } from "./CubeGuide3DFallback";
import {
  BASE_FOV,
  buildCubies,
  disposeObject,
  type Cubie,
  type TrackedScene,
} from "../lib/cubeGuideScene";
import { Rotate3D } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";

export type CubeGuide3DProps = {
  state: string;
  previousState?: string;
  /** Lệnh vừa chạy, dùng để phát hoạt hình xoay tầng. */
  move?: string;
  transition?: "idle" | "move" | "seek" | "phase" | "reset";
  /** Thời lượng một nước, mặc định 340ms. */
  turnDurationMs?: number;
  dimension?: 2 | 3;
  surface?: "dark" | "light";
  initialYaw?: number;
  initialPitch?: number;
  /** Mũi tên trái/phải/lên/xuống xoay góc nhìn (dùng cho chế độ chơi bằng bàn phím). */
  orbitKeys?: boolean;
  /** Chiều cao tối thiểu của khung khối (px), mặc định 288. */
  stageHeight?: number;
};

export function CubeGuide3D({
  state,
  previousState,
  move,
  transition = "idle",
  turnDurationMs = 340,
  dimension = 3,
  surface = "dark",
  initialYaw = 0.55,
  initialPitch = 0.3,
  orbitKeys = false,
  stageHeight = 288,
}: CubeGuide3DProps) {
  const { language } = useLanguage();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<TrackedScene | null>(null);
  const cubiesRef = useRef<Cubie[]>([]);
  /** State string the scene is currently built from — used to skip redundant rebuilds. */
  const builtStateRef = useRef<string>(state);
  const animFrameRef = useRef<number | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const orbitRef = useRef({ yaw: initialYaw, pitch: initialPitch, distance: dimension === 2 ? 5.3 : 6.0 });
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");

  const cancelAnimation = () => {
    if (animFrameRef.current !== null) {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Trả các cubie đang bị xoay về root ở vị trí tuyệt đối — KHÔNG dispose
    // vật liệu/geometry (chúng vẫn được cubiesRef giữ lại, sẽ bị dispose riêng
    // khi buildFromState() rebuild lại từ state mới).
    const pivot = pivotRef.current;
    if (pivot && sceneRef.current) {
      const cell = dimension === 2 ? CELL_2 : CELL_3;
      for (const cubie of cubiesRef.current) {
        if (cubie.group.parent === pivot) {
          pivot.remove(cubie.group);
          cubie.group.position.set(
            cubie.unit.x * cell,
            cubie.unit.y * cell,
            cubie.unit.z * cell
          );
          sceneRef.current.root.add(cubie.group);
        }
      }
      sceneRef.current.root.remove(pivot);
      pivotRef.current = null;
    }
  };

  const buildFromState = (
    bundle: TrackedScene,
    nextState: string
  ) => {
    cancelAnimation();
    const { root } = bundle;
    for (const cubie of cubiesRef.current) disposeObject(cubie.group);
    while (root.children.length) {
      const child = root.children[0];
      root.remove(child);
      disposeObject(child);
    }
    cubiesRef.current = [];

    cubiesRef.current = buildCubies(root, nextState, dimension);
    builtStateRef.current = nextState;
    bundle.resize();
  };

  // Mount-time: create renderer + scene once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setStatus("fallback");
      return () => undefined;
    }
    if (!renderer) {
      setStatus("fallback");
      return () => undefined;
    }
    const activeRenderer = renderer;
    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    activeRenderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 50);
    const alignGroup = new THREE.Group();
    scene.add(alignGroup);
    const root = new THREE.Group();
    alignGroup.add(root);
    // Flat lighting only: no direction, every face gets the same light.
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    host.replaceChildren(activeRenderer.domElement);
    activeRenderer.domElement.className = "block h-full w-full";

    const resize = () => {
      const width = Math.max(200, host.clientWidth);
      const height = Math.max(220, host.clientHeight || (dimension === 2 ? 260 : 320));
      activeRenderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Khung hẹp hơn cao (điện thoại): mở rộng góc nhìn dọc để góc nhìn
      // ngang giữ như khung vuông — khối luôn vừa chiều ngang, không bị cắt.
      camera.fov =
        camera.aspect < 1
          ? (2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) / camera.aspect) * 180) / Math.PI
          : BASE_FOV;
      camera.updateProjectionMatrix();
      const orbit = orbitRef.current;
      root.rotation.set(orbit.pitch, orbit.yaw, 0);
      camera.position.set(0, 0, orbit.distance);
      camera.lookAt(0, 0, 0);
      activeRenderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    sceneRef.current = { renderer: activeRenderer, scene, camera, root, alignGroup, host, resize };
    builtStateRef.current = state;
    buildFromState(sceneRef.current, state);

    setStatus("ready");
    return () => {
      cancelAnimation();
      observer.disconnect();
      for (const cubie of cubiesRef.current) disposeObject(cubie.group);
      cubiesRef.current = [];
      activeRenderer.dispose();
      sceneRef.current = null;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, surface]);

  // Camera nudges from the arrow keys (play mode). Ignores events from form
  // fields so typing never orbits the cube behind the user's back.
  useEffect(() => {
    if (!orbitKeys) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.closest("input, textarea, select, [contenteditable='true']") ||
          target.isContentEditable)
      ) {
        return;
      }
      const orbit = orbitRef.current;
      const STEP = 0.35;
      switch (event.key) {
        case "ArrowLeft":
          orbit.yaw -= STEP;
          break;
        case "ArrowRight":
          orbit.yaw += STEP;
          break;
        case "ArrowUp":
          orbit.pitch = Math.min(ORBIT_LIMIT, orbit.pitch + STEP * 0.6);
          break;
        case "ArrowDown":
          orbit.pitch = Math.max(-ORBIT_LIMIT, orbit.pitch - STEP * 0.6);
          break;
        default:
          return;
      }
      event.preventDefault();
      sceneRef.current?.resize();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbitKeys]);

  // State-dependent: rebuild or animate on change.
  useEffect(() => {
    const bundle = sceneRef.current;
    if (!bundle) return;
    const isMove = transition === "move" && move && previousState && previousState !== state;

    const rebuild = () =>
      buildFromState(bundle, state);

    if (!isMove) {
      rebuild();
      return;
    }

    const parsed = parseMove(move);
    if (!parsed) {
      rebuild();
      return;
    }
    cancelAnimation();
    // Guarantee the scene starts exactly at previousState; an interrupted
    // animation may have left it behind. Cheap when already up to date.
    if (builtStateRef.current !== previousState) {
      buildFromState(bundle, previousState);
    }
    const cell = dimension === 2 ? CELL_2 : CELL_3;
    const { axis, layers, angle } = parsed;
    const pivot = new THREE.Group();
    pivot.position.set(
      axis === "x" ? layers[0] * cell : 0,
      axis === "y" ? layers[0] * cell : 0,
      axis === "z" ? layers[0] * cell : 0
    );
    pivotRef.current = pivot;
    const moved = cubiesRef.current.filter(cubie =>
      layers.includes(Math.round(cubie.unit[axis]))
    );
    for (const cubie of moved) {
      // Ô sáng (XCross, case Last Layer…) được đặt theo VỊ TRÍ, không đi theo
      // mảnh: nếu để nguyên, lớp đang xoay mang màu sáng sang ô khác và sticker
      // bị nhuộm xanh/vàng giữa chừng. Tắt phát sáng trong lúc xoay; bước dựng
      // lại ở cuối nước đi đặt lại đúng ô.
      for (const material of cubie.stickerMaterials) material.emissiveIntensity = 0;
      bundle.root.remove(cubie.group);
      cubie.group.position.set(
        cubie.unit.x * cell - (axis === "x" ? layers[0] * cell : 0),
        cubie.unit.y * cell - (axis === "y" ? layers[0] * cell : 0),
        cubie.unit.z * cell - (axis === "z" ? layers[0] * cell : 0)
      );
      pivot.add(cubie.group);
    }
    bundle.root.add(pivot);
    const start = performance.now();
    const duration = Math.max(120, turnDurationMs);
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      pivot.rotation[axis as "x" | "y" | "z"] = angle * ease(t);
      bundle.resize();
      if (t < 1) {
        animFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        // Snap back everything with the canonical rebuild; identical geometry, no visible jump.
        animFrameRef.current = null;
        rebuild();
      }
    };
    animFrameRef.current = window.requestAnimationFrame(tick);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, move, transition]);

  const renderNow = () => {
    sceneRef.current?.resize();
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    (hostRef.current as unknown as { __drag?: { x: number; y: number; yaw: number; pitch: number } }).__drag = {
      x: event.clientX,
      y: event.clientY,
      yaw: orbitRef.current.yaw,
      pitch: orbitRef.current.pitch,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = (hostRef.current as unknown as { __drag?: { x: number; y: number; yaw: number; pitch: number } }).__drag;
    if (!drag) return;
    const orbit = orbitRef.current;
    orbit.yaw = drag.yaw + (event.clientX - drag.x) * 0.012;
    orbit.pitch = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, drag.pitch + (event.clientY - drag.y) * 0.012));
    renderNow();
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    delete (hostRef.current as unknown as { __drag?: unknown }).__drag;
  };
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const orbit = orbitRef.current;
    const min = dimension === 2 ? 4.2 : 4.8;
    const max = dimension === 2 ? 7 : 8;
    orbit.distance = Math.max(min, Math.min(max, orbit.distance + (event.deltaY > 0 ? 0.5 : -0.5)));
    renderNow();
  };

  // Nền phẳng, theo theme (không gradient): "light" dùng màu bề mặt nhạt
  // của trang nên tự đổi theo chế độ sáng/tối.
  const stageBackground =
    surface === "light" ? "var(--surface-2)" : "var(--cube-stage)";

  if (status === "error")
    return (
      <div className="grid min-h-84 place-items-center text-sm text-muted">
        {language === "vi" ? "Không thể dựng mô hình 3D." : "Could not build the 3D model."}
      </div>
    );

  if (status === "fallback")
    return (
      <CubeGuide3DFallback
        state={state}
        dimension={dimension}
        surface={surface}
        stageBackground={stageBackground}
      />
    );

  return (
    <div className="relative grid min-h-84 w-full place-items-center overflow-hidden rounded-card" style={{ background: stageBackground }}>
      <div
        ref={hostRef}
        role="img"
        className="interactive-cube-stage h-full w-full"
        style={{
          minHeight: stageHeight,
          touchAction: "none",
          cursor: "grab",
          // `.interactive-cube-stage` trong cube.css đặt nền đặc
          // `var(--cube-stage)` (gần-đen) — che mất nền trắng/light do wrapper
          // bên ngoài vẽ. Khi dùng surface="light" thì xóa nền để wrapper
          // hiện ra.
          background: surface === "light" ? "transparent" : undefined,
        }}
        aria-label={language === "vi" ? "Mô hình Rubik 3D của bạn" : "3D Rubik model"}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onWheel={wheel}
      />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">
          {language === "vi" ? "Đang dựng mô hình…" : "Building the model…"}
        </div>
      ) : null}
      <IconButton
        label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"}
        icon={<Rotate3D className="text-base" />}
        onClick={() => {
          orbitRef.current = { yaw: initialYaw, pitch: initialPitch, distance: dimension === 2 ? 5.3 : 6.0 };
          renderNow();
        }}
        className={
          surface === "light"
            ? "absolute bottom-2 right-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink/10 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink/15 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            : "absolute bottom-2 right-2 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        }
        title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}
      />
    </div>
  );
}
