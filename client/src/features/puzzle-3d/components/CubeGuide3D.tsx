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
  /** Lệnh vừa chạy, dùng để phát hoạt hình xoay tầng. */
  move?: string;
  transition?: "idle" | "move" | "seek" | "phase" | "reset";
  /** Thời lượng một nước, mặc định 340ms. */
  turnDurationMs?: number;
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
const SLICE_MOVES: Record<string, { axis: "x" | "y" | "z"; layers: number[]; sign: 1 | -1 }> = {
  R: { axis: "x", layers: [1], sign: -1 },
  L: { axis: "x", layers: [-1], sign: 1 },
  r: { axis: "x", layers: [0, 1], sign: -1 },
  l: { axis: "x", layers: [-1, 0], sign: 1 },
  M: { axis: "x", layers: [0], sign: 1 },
  U: { axis: "y", layers: [1], sign: -1 },
  D: { axis: "y", layers: [-1], sign: 1 },
  u: { axis: "y", layers: [0, 1], sign: -1 },
  d: { axis: "y", layers: [-1, 0], sign: 1 },
  E: { axis: "y", layers: [0], sign: -1 },
  F: { axis: "z", layers: [1], sign: -1 },
  B: { axis: "z", layers: [-1], sign: 1 },
  f: { axis: "z", layers: [0, 1], sign: -1 },
  b: { axis: "z", layers: [-1, 0], sign: 1 },
  S: { axis: "z", layers: [0], sign: -1 },
  x: { axis: "x", layers: [-1, 0, 1], sign: -1 },
  y: { axis: "y", layers: [-1, 0, 1], sign: -1 },
  z: { axis: "z", layers: [-1, 0, 1], sign: -1 },
};
const ORBIT_LIMIT = 1.1;
const HALF = 1.05;
const BODY = 0.66;
const CELL_3 = 0.7;
const CELL_2 = 0.95;
const XROSS_STICKERS: Record<string, Partial<Record<string, number[]>>> = {
  FR: { D: [2], F: [5, 8], R: [3, 6] },
  FL: { D: [0], F: [3, 6], L: [5, 8] },
  BL: { D: [6], B: [5, 8], L: [3, 6] },
  BR: { D: [8], B: [3, 6], R: [5, 8] },
};
const CROSS_EDGES = [1, 3, 5, 7];

function indexFor(face: string, x: number, y: number, z: number) {
  switch (face) {
    case "U":
      return FACE_OFFSET.U + (z + 1) * 3 + (x + 1);
    case "D":
      return FACE_OFFSET.D + (1 - z) * 3 + (x + 1);
    case "F":
      return FACE_OFFSET.F + (1 - y) * 3 + (x + 1);
    case "B":
      return FACE_OFFSET.B + (1 - y) * 3 + (1 - x);
    case "R":
      return FACE_OFFSET.R + (1 - y) * 3 + (1 - z);
    default: // L
      return FACE_OFFSET.L + (1 - y) * 3 + (z + 1);
  }
}

function parseMove(move: string) {
  const match = /^([a-zA-Z])(['2]?)$/.exec(move.trim());
  if (!match) return null;
  const base = match[1];
  const suffix = match[2];
  const spec = SLICE_MOVES[base];
  if (!spec) return null;
  if (match[1].toLowerCase() === "x" || match[1].toLowerCase() === "y" || match[1].toLowerCase() === "z") {
    const lower = match[1].toLowerCase();
    if (base === lower) {
      // x / y / z — whole-cube rotation, follow the sign table.
      const axis = lower as "x" | "y" | "z";
      const sign = match[1] === lower ? -1 : 1; // lowercase = inverse of uppercase in this scheme
      const angle = (suffix === "2" ? Math.PI : (Math.PI / 2) * sign * (suffix === "'" ? -1 : 1)) as number;
      return { axis, layers: [-1, 0, 1], angle };
    }
  }
  let angle = (Math.PI / 2) * spec.sign;
  if (suffix === "'") angle = -angle;
  if (suffix === "2") angle *= 2;
  return { axis: spec.axis, layers: spec.layers, angle };
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

type Cubie = {
  unit: { x: number; y: number; z: number };
  group: THREE.Group;
  stickerMaterials: THREE.MeshStandardMaterial[];
};

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
  move,
  transition = "idle",
  turnDurationMs = 340,
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
  const cubiesRef = useRef<Cubie[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const orbitRef = useRef({ yaw: initialYaw, pitch: initialPitch, distance: dimension === 2 ? 4.1 : 4.6 });
  const [status, setStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");

  const disposeObject = (object: THREE.Object3D) => {
    object.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach(m => m.dispose());
        else material?.dispose();
      }
    });
  };

  const cancelAnimation = () => {
    if (animFrameRef.current !== null) {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (pivotRef.current && sceneRef.current) {
      disposeObject(pivotRef.current);
      sceneRef.current.root.remove(pivotRef.current);
      pivotRef.current = null;
    }
  };

  const buildFromState = (
    bundle: TrackedScene,
    nextState: string,
    opts: {
      inspectCross?: boolean;
      crossColor?: string;
      xcrossSlots?: string[];
      lastLayerCase?: { family: string; id: string } | null;
      specialStickers?: Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>>;
    }
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

    const highlight = highlightedIndexes(
      nextState,
      opts.inspectCross ?? false,
      opts.crossColor ?? "U",
      opts.xcrossSlots,
      opts.lastLayerCase,
      opts.specialStickers
    );
    const cell = dimension === 2 ? CELL_2 : CELL_3;
    const coords = dimension === 2 ? [-1, 1] : [-1, 0, 1];

    const stickerGeometry = new RoundedBoxGeometry(cell * 0.88, cell * 0.88, 0.052, 4, 0.075);
    const bodyGeometry = new RoundedBoxGeometry(cell * 0.94, cell * 0.94, cell * 0.94, 4, 0.09);

    for (const x of coords) {
      for (const y of coords) {
        for (const z of coords) {
          if (dimension === 3 && x === 0 && y === 0 && z === 0) continue;
          const group = new THREE.Group();
          group.position.set(x * cell, y * cell, z * cell);
          const bodyMaterial = new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.5, metalness: 0.15 });
          const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
          group.add(body);
          const cubie: Cubie = { unit: { x, y, z }, group, stickerMaterials: [] };
          for (const face of FACE_ORDER) {
            const exposed =
              (face === "U" && y === 1) ||
              (face === "D" && y === -1) ||
              (face === "F" && z === 1) ||
              (face === "B" && z === -1) ||
              (face === "R" && x === 1) ||
              (face === "L" && x === -1);
            if (!exposed) continue;
            const faceletIndex = indexFor(face, x, y, z);
            const faceIndex = faceletIndex % 9;
            const letter = nextState[faceletIndex] ?? "?";
            const color = CUBE_COLORS[letter] ?? CUBE_FALLBACK_COLOR;
            const highlightInfo = highlight.get(`${face}:${faceIndex}`);
            const material = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.35,
              metalness: 0.05,
              emissive: highlightInfo ? new THREE.Color(highlightInfo.color) : new THREE.Color("#000000"),
              emissiveIntensity: highlightInfo?.intensity ?? 0,
            });
            const sticker = new THREE.Mesh(stickerGeometry, material);
            const offset = BODY / 2 + 0.026;
            switch (face) {
              case "U":
                sticker.position.set(0, offset, 0);
                sticker.rotation.set(-Math.PI / 2, 0, 0);
                break;
              case "D":
                sticker.position.set(0, -offset, 0);
                sticker.rotation.set(Math.PI / 2, 0, 0);
                break;
              case "F":
                sticker.position.set(0, 0, offset);
                break;
              case "B":
                sticker.position.set(0, 0, -offset);
                sticker.rotation.set(0, Math.PI, 0);
                break;
              case "R":
                sticker.position.set(offset, 0, 0);
                sticker.rotation.set(0, Math.PI / 2, 0);
                break;
              default: // L
                sticker.position.set(-offset, 0, 0);
                sticker.rotation.set(0, -Math.PI / 2, 0);
                break;
            }
            group.add(sticker);
            cubie.stickerMaterials.push(material);
          }
          root.add(group);
          cubiesRef.current.push(cubie);
        }
      }
    }
    stickerGeometry.dispose();
    bodyGeometry.dispose();
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
    buildFromState(sceneRef.current, state, {
      inspectCross,
      crossColor,
      xcrossSlots,
      lastLayerCase,
      specialStickers,
    });

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

  // State-dependent: rebuild or animate on change.
  useEffect(() => {
    const bundle = sceneRef.current;
    if (!bundle) return;
    const isMove = transition === "move" && move && previousState && previousState !== state;

    const rebuild = () =>
      buildFromState(bundle, state, {
        inspectCross,
        crossColor,
        xcrossSlots,
        lastLayerCase,
        specialStickers,
      });

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
