import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CUBE_COLORS, CUBE_FALLBACK_COLOR } from "../lib/cubeColors";
import { IconButton } from "@/components/ui/StudioUI";
import { Rotate3D } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";

export type CubeGuide3DProps = {
  state: string;
  previousState?: string;
  /** Small NxN variants: 2 means 2×2×2, default 3. */
  dimension?: 2 | 3;
  inspectCross?: boolean;
  crossColor?: string;
  xcrossSlots?: string[];
  lastLayerCase?: { family: string; id: string } | null;
  specialStickers?: Partial<
    Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>
  >;
  surface?: "dark" | "light";
  initialYaw?: number;
  initialPitch?: number;
};

const FACE_ORDER: Array<"U" | "R" | "F" | "D" | "L" | "B"> = [
  "U",
  "R",
  "F",
  "D",
  "L",
  "B",
];
const FACE_OFFSET: Record<string, number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};
const XROSS_STICKERS: Record<string, Partial<Record<string, number[]>>> = {
  FR: { D: [2], F: [5, 8], R: [3, 6] },
  FL: { D: [0], F: [3, 6], L: [5, 8] },
  BL: { D: [6], B: [5, 8], L: [3, 6] },
  BR: { D: [8], B: [3, 6], R: [5, 8] },
};
const CROSS_EDGES = [1, 3, 5, 7];
const HALF = 1.05;
const CELL_3 = 0.7;
const CELL_2 = 0.9;
const ORBIT_LIMIT = 1.1;

function faceletTransform(face: string, index: number, cell: number) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  switch (face) {
    case "U":
      return {
        position: new THREE.Vector3((col - 1) * cell, HALF + 0.026, (row - 1) * cell),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
      };
    case "F":
      return {
        position: new THREE.Vector3((col - 1) * cell, (1 - row) * cell, HALF + 0.026),
        rotation: new THREE.Euler(0, 0, 0),
      };
    case "D":
      return {
        position: new THREE.Vector3((col - 1) * cell, -HALF - 0.026, (1 - row) * cell),
        rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      };
    case "R":
      return {
        position: new THREE.Vector3(HALF + 0.026, (1 - row) * cell, (1 - col) * cell),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
      };
    case "L":
      return {
        position: new THREE.Vector3(-HALF - 0.026, (1 - row) * cell, (col - 1) * cell),
        rotation: new THREE.Euler(0, -Math.PI / 2, 0),
      };
    default:
      return {
        position: new THREE.Vector3((1 - col) * cell, (1 - row) * cell, -HALF - 0.026),
        rotation: new THREE.Euler(0, Math.PI, 0),
      };
  }
}

function highlightedIndexes(
  state: string,
  inspectCross: boolean,
  crossColor: string,
  xcrossSlots: string[] | undefined,
  lastLayerCase: { family: string; id: string } | null | undefined,
  specialStickers: Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>> | undefined,
) {
  const highlight = new Map<string, { color: string; intensity: number }>();
  if (inspectCross) {
    for (const index of CROSS_EDGES) {
      if (state[FACE_OFFSET.D + index] === crossColor) {
        highlight.set(`D:${index}`, { color: "#ffffff", intensity: 0.6 });
      }
    }
  }
  if (xcrossSlots?.length) {
    for (const slot of xcrossSlots) {
      const slotMap = XROSS_STICKERS[slot];
      if (!slotMap) continue;
      for (const face of Object.keys(slotMap) as Array<"D" | "F" | "R" | "L" | "B">) {
        for (const index of slotMap[face] ?? []) {
          highlight.set(`${face}:${index}`, { color: "#7c6cf0", intensity: 0.75 });
        }
      }
    }
  }
  if (lastLayerCase) {
    for (const face of FACE_ORDER) {
      for (let index = 0; index < 9; index += 1) {
        highlight.set(`${face}:${index}`, { color: "#fbbf24", intensity: 0.65 });
      }
    }
  }
  if (specialStickers) {
    for (const face of Object.keys(specialStickers) as Array<"U" | "R" | "F" | "D" | "L" | "B">) {
      for (const index of specialStickers[face] ?? []) {
        highlight.set(`${face}:${index}`, { color: "#fb7185", intensity: 0.7 });
      }
    }
  }
  return highlight;
}

type TrackedScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  host: HTMLDivElement;
  resize: () => void;
};

export function CubeGuide3D({
  state,
  previousState,
  dimension = 3,
  inspectCross = false,
  crossColor = "U",
  xcrossSlots,
  lastLayerCase = null,
  specialStickers,
  surface = "dark",
  initialYaw = 0.55,
  initialPitch = 0.3,
}: CubeGuide3DProps) {
  const { language } = useLanguage();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<TrackedScene | null>(null);
  const orbitRef = useRef({ yaw: initialYaw, pitch: initialPitch, distance: dimension === 2 ? 4.1 : 4.6 });
  const flashUntilRef = useRef(0);
  const flashMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const stickerMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");

  const rebuildStickers = (
    scene: TrackedScene,
    nextState: string,
    prevState: string | undefined,
    opts: {
      inspectCross?: boolean;
      crossColor?: string;
      xcrossSlots?: string[];
      lastLayerCase?: { family: string; id: string } | null;
      specialStickers?: Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>>;
    }
  ) => {
    const { root } = scene;
    for (const material of stickerMaterialsRef.current) material.dispose();
    stickerMaterialsRef.current = [];
    for (const child of root.children.slice()) {
      root.remove(child);
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).geometry?.dispose();
      }
    }
    const cell = dimension === 2 ? CELL_2 : CELL_3;
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(HALF * 2, HALF * 2, HALF * 2, 5, 0.16),
      new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.45, metalness: 0.15 })
    );
    root.add(body);
    const highlight = highlightedIndexes(
      nextState,
      opts.inspectCross ?? false,
      opts.crossColor ?? "U",
      opts.xcrossSlots,
      opts.lastLayerCase,
      opts.specialStickers
    );
    const flashMaterials: THREE.MeshStandardMaterial[] = [];
    const changed = new Set<string>();
    if (prevState && prevState.length === nextState.length) {
      for (let index = 0; index < nextState.length; index += 1) {
        if (prevState[index] !== nextState[index]) {
          for (const face of FACE_ORDER) {
            const base = FACE_OFFSET[face];
            if (index >= base && index < base + 9) changed.add(`${face}:${index - base}`);
          }
        }
      }
    }
    for (const face of FACE_ORDER) {
      for (let index = 0; index < 9; index += 1) {
        const key = `${face}:${index}`;
        const letter = nextState[FACE_OFFSET[face] + index] ?? "?";
        const color = CUBE_COLORS[letter] ?? CUBE_FALLBACK_COLOR;
        const highlightInfo = highlight.get(key);
        const spec = faceletTransform(face, index, cell);
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.35,
          metalness: 0.05,
          emissive: highlightInfo ? new THREE.Color(highlightInfo.color) : new THREE.Color("#000000"),
          emissiveIntensity: highlightInfo?.intensity ?? 0,
        });
        if (changed.has(key)) {
          material.emissive.set("#ffffff");
          material.emissiveIntensity = 0.9;
          flashMaterials.push(material);
        }
        const sticker = new THREE.Mesh(
          new RoundedBoxGeometry(cell, cell, 0.052, 4, 0.075),
          material
        );
        sticker.position.copy(spec.position);
        sticker.rotation.copy(spec.rotation);
        root.add(sticker);
        stickerMaterialsRef.current.push(material);
      }
    }
    flashMaterialsRef.current = flashMaterials;
    flashUntilRef.current = flashMaterials.length ? performance.now() + 750 : 0;
    scene.resize();
  };

  // Mount-time: create renderer + scene once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
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
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    const root = new THREE.Group();
    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff, surface === "light" ? 0x7a7a7a : 0x1a2230, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(3.5, 6, 8);
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xbfd3ff, 0.9);
    fill.position.set(-6, -2, -4);
    scene.add(fill);
    host.replaceChildren(activeRenderer.domElement);
    activeRenderer.domElement.className = "block h-full w-full";

    const resize = () => {
      const width = Math.max(200, host.clientWidth);
      const height = Math.max(220, host.clientHeight || (dimension === 2 ? 260 : 320));
      activeRenderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const orbit = orbitRef.current;
      root.rotation.set(orbit.pitch, orbit.yaw, 0);
      camera.position.set(0, 0, orbit.distance);
      camera.lookAt(0, 0, 0);
      activeRenderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    sceneRef.current = { renderer: activeRenderer, scene, camera, root, host, resize };
    resize();

    const decay = () => {
      raf = window.requestAnimationFrame(decay);
      const remaining = flashUntilRef.current - performance.now();
      const intensity = remaining > 0 ? Math.min(0.9, Math.max(0, (remaining / 750) * 0.9)) : 0;
      for (const material of flashMaterialsRef.current) {
        material.emissiveIntensity = intensity;
      }
      if (remaining <= 0 && flashMaterialsRef.current.length) {
        for (const material of flashMaterialsRef.current) material.emissiveIntensity = 0;
        flashMaterialsRef.current = [];
      }
    };
    raf = window.requestAnimationFrame(decay);

    setStatus("ready");
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      for (const material of stickerMaterialsRef.current) material.dispose();
      stickerMaterialsRef.current = [];
      activeRenderer.dispose();
      sceneRef.current = null;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, surface]);

  // State-dependent: rebuild stickers + flash on change.
  useEffect(() => {
    const bundle = sceneRef.current;
    if (!bundle) return;
    rebuildStickers(bundle, state, previousState, {
      inspectCross,
      crossColor,
      xcrossSlots,
      lastLayerCase,
      specialStickers,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, previousState, inspectCross, crossColor, xcrossSlots, lastLayerCase, specialStickers]);

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
    const min = dimension === 2 ? 3.0 : 3.4;
    const max = dimension === 2 ? 7 : 8;
    orbit.distance = Math.max(min, Math.min(max, orbit.distance + (event.deltaY > 0 ? 0.5 : -0.5)));
    renderNow();
  };

  const stageBackground =
    surface === "light"
      ? "radial-gradient(ellipse at 50% 38%, #ffffff 0%, #eceef7 60%, #e2e4f0 100%)"
      : "radial-gradient(ellipse at 50% 38%, #1b2240 0%, #10142a 60%, #070a15 100%)";

  if (status === "error")
    return (
      <div className="grid min-h-84 place-items-center text-sm text-muted">
        {language === "vi" ? "Không thể dựng mô hình 3D." : "Could not build the 3D model."}
      </div>
    );

  if (status === "fallback") {
    const stickerIndexes = dimension === 2 ? [0, 2, 6, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <div
        className="grid min-h-84 w-full place-items-center rounded-card"
        style={{ background: stageBackground }}
        aria-label={language === "vi" ? "Mô hình Rubik 3D của bạn" : "3D Rubik model"}
      >
        <div className="grid grid-cols-4 gap-2" data-testid="cube-3d-fallback">
          {FACE_ORDER.map(face => (
            <div
              key={face}
              data-testid={`face-${face}`}
              className="cube3d-face-fallback grid gap-1 rounded-lg bg-black/40 p-1.5"
              style={{ gridTemplateColumns: `repeat(${dimension}, 1fr)` }}
            >
              {stickerIndexes.map(index => {
                const letter = state[FACE_OFFSET[face] + index] ?? "?";
                return (
                  <span
                    key={index}
                    className="cube3d-sticker-fallback h-5 w-5 rounded-sm"
                    style={{ background: CUBE_COLORS[letter] ?? CUBE_FALLBACK_COLOR }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="pb-3 text-[11px] text-white/60">
          {language === "vi"
            ? "Thiết bị không hỗ trợ WebGL — hiển thị 2D."
            : "Device does not support WebGL — 2D preview."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative grid min-h-84 w-full place-items-center overflow-hidden rounded-card" style={{ background: stageBackground }}>
      <div
        ref={hostRef}
        role="img"
        className="interactive-cube-stage h-full w-full"
        style={{ minHeight: 288, touchAction: "none", cursor: "grab" }}
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
          orbitRef.current = { yaw: initialYaw, pitch: initialPitch, distance: dimension === 2 ? 4.1 : 4.6 };
          renderNow();
        }}
        className="absolute bottom-2 right-2 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}
      />
    </div>
  );
}
