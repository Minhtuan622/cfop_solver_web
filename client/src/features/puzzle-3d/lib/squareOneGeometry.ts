import type { ThreeModule } from "./sideEventShared";
import { TAU } from "./sideEventShared";
import { CUBE_COLORS } from "./cubeColors";
import {
  squareOneLayerPieces,
  squareOnePieceFace,
  squareOnePieceSide,
  squareOneSlotAngle,
  type SquareOneFace,
  type SquareOneState,
} from "./squareOneState";

/** Cube half-width in layer units: a 30° edge chord sits 15° off the face centre. */
const SQUARE1_CHORD = Math.sqrt(3) / 2 + 1;
const SQUARE1_FOOTPRINT_SCALE = 0.5;
const SQUARE1_LAYER_THICKNESS = 1.08;
const SQUARE1_BELT_THICKNESS = SQUARE1_LAYER_THICKNESS / 2;
/** Scale the stack so the shaped puzzle reads as a cube, like the real one. */
const SQUARE1_HEIGHT_SCALE =
  (2 * SQUARE1_CHORD * SQUARE1_FOOTPRINT_SCALE) /
  (2 * SQUARE1_LAYER_THICKNESS + SQUARE1_BELT_THICKNESS);
const SQUARE1_PLASTIC = "#171d23";

type SquarePoint = [number, number];

/**
 * Base wedge outlines in world XZ, front face towards +z. The edge is a
 * 30° triangle, the corner a 60° quad whose two flat sides carry the two
 * half stickers (first half on the lower-angle side).
 */
const SQUARE1_EDGE_SHAPE: SquarePoint[] = [
  [0, 0],
  [-0.5, SQUARE1_CHORD],
  [0.5, SQUARE1_CHORD],
];
const SQUARE1_CORNER_SHAPE: SquarePoint[] = [
  [0, 0],
  [0.5, SQUARE1_CHORD],
  [SQUARE1_CHORD, SQUARE1_CHORD],
  [SQUARE1_CHORD, 0.5],
];
/** Bottom-layer corners are seen from the far side, so their halves swap. */
const SQUARE1_CORNER_MIRROR: SquarePoint[] = [
  [0, 0],
  [SQUARE1_CHORD, 0.5],
  [SQUARE1_CHORD, SQUARE1_CHORD],
  [0.5, SQUARE1_CHORD],
];

/** Rotate world XZ points from +z towards +x (increasing slot angle). */
function squareOneRotate(points: SquarePoint[], angle: number): SquarePoint[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(
    ([x, z]) => [x * cos + z * sin, -x * sin + z * cos] as SquarePoint
  );
}

function makeSquareShape(THREE: ThreeModule, points: SquarePoint[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) =>
    index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z)
  );
  shape.closePath();
  return shape;
}

function squareOneVerticalPanel(
  THREE: ThreeModule,
  from: SquarePoint,
  to: SquarePoint,
  lowerY: number,
  upperY: number,
  color: string
) {
  const [ax, az] = from;
  const [bx, bz] = to;
  const midpointX = (ax + bx) / 2;
  const midpointZ = (az + bz) / 2;
  const midpointLength = Math.max(0.0001, Math.hypot(midpointX, midpointZ));
  const outward = 0.006;
  const offsetX = (midpointX / midpointLength) * outward;
  const offsetZ = (midpointZ / midpointLength) * outward;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        ax + offsetX,
        lowerY,
        az + offsetZ,
        bx + offsetX,
        lowerY,
        bz + offsetZ,
        bx + offsetX,
        upperY,
        bz + offsetZ,
        ax + offsetX,
        upperY,
        az + offsetZ,
      ],
      3
    )
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({
      color,
      side: THREE.DoubleSide,
    })
  );
}

function squareOneLayer(
  THREE: ThreeModule,
  state: SquareOneState,
  layerStart: 0 | 12,
  verticalBase: number
) {
  const layer = new THREE.Group();
  const isTopLayer = layerStart === 0;
  const thickness = SQUARE1_LAYER_THICKNESS;
  const lowerY = isTopLayer ? verticalBase : verticalBase - thickness;
  const upperY = isTopLayer ? verticalBase + thickness : verticalBase;
  const stickerY = isTopLayer ? upperY + 0.004 : lowerY - 0.004;
  const plastic = new THREE.MeshLambertMaterial({
    color: SQUARE1_PLASTIC,
  });
  /** Extrude shapes live in XY; the top layer flips Y onto world -Z. */
  const shapeFromWorld = (points: SquarePoint[]) =>
    points.map(([x, z]) => (isTopLayer ? [x, -z] : [x, z]) as SquarePoint);
  const bodyRotation = isTopLayer ? -Math.PI / 2 : Math.PI / 2;

  const addWedge = (
    world: SquarePoint[],
    face: SquareOneFace,
    panels: Array<[SquarePoint, SquarePoint, string]>
  ) => {
    const shape = makeSquareShape(THREE, shapeFromWorld(world));
    const cubieGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
    });
    const body = new THREE.Mesh(cubieGeometry, plastic);
    body.rotation.x = bodyRotation;
    body.position.y = verticalBase;
    const sticker = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshLambertMaterial({
        color: CUBE_COLORS[face] ?? CUBE_COLORS.F,
      })
    );
    sticker.rotation.x = bodyRotation;
    sticker.position.y = stickerY;
    layer.add(body, sticker);
    panels.forEach(([from, to, color]) =>
      layer.add(squareOneVerticalPanel(THREE, from, to, lowerY, upperY, color))
    );
  };

  const addEdge = (slot: number) => {
    const piece = state.pieces[slot] ?? slot;
    const world = squareOneRotate(SQUARE1_EDGE_SHAPE, squareOneSlotAngle(slot));
    addWedge(world, squareOnePieceFace(piece), [
      [
        world[1]!,
        world[2]!,
        CUBE_COLORS[squareOnePieceSide(piece)] ?? CUBE_COLORS.F,
      ],
    ]);
  };

  const addCorner = (firstSlot: number, secondSlot: number) => {
    const first = state.pieces[firstSlot] ?? firstSlot;
    const second = state.pieces[secondSlot] ?? secondSlot;
    const center =
      squareOneSlotAngle(firstSlot) + (isTopLayer ? TAU / 24 : -TAU / 24);
    const base = isTopLayer ? SQUARE1_CORNER_SHAPE : SQUARE1_CORNER_MIRROR;
    const world = squareOneRotate(base, center - TAU / 8);
    addWedge(world, squareOnePieceFace(first), [
      [
        world[1]!,
        world[2]!,
        CUBE_COLORS[squareOnePieceSide(first)] ?? CUBE_COLORS.F,
      ],
      [
        world[2]!,
        world[3]!,
        CUBE_COLORS[squareOnePieceSide(second)] ?? CUBE_COLORS.F,
      ],
    ]);
  };

  for (const piece of squareOneLayerPieces(state.pieces, layerStart)) {
    if (piece.second === null) addEdge(piece.firstSlot);
    else addCorner(piece.firstSlot, piece.secondSlot ?? piece.firstSlot);
  }
  return layer;
}

export function squareOneObject(THREE: ThreeModule, state: SquareOneState) {
  const root = new THREE.Group();
  const halfBelt = SQUARE1_BELT_THICKNESS / 2;
  const top = squareOneLayer(THREE, state, 0, halfBelt);
  const bottom = squareOneLayer(THREE, state, 12, -halfBelt);
  top.scale.set(SQUARE1_FOOTPRINT_SCALE, 1, SQUARE1_FOOTPRINT_SCALE);
  bottom.scale.set(SQUARE1_FOOTPRINT_SCALE, 1, SQUARE1_FOOTPRINT_SCALE);
  const belt = new THREE.Group();
  const beltCore = new THREE.Mesh(
    new THREE.BoxGeometry(
      SQUARE1_CHORD * 2,
      SQUARE1_BELT_THICKNESS,
      SQUARE1_CHORD * 2
    ),
    new THREE.MeshLambertMaterial({
      color: SQUARE1_PLASTIC,
    })
  );
  belt.add(beltCore);
  belt.scale.set(SQUARE1_FOOTPRINT_SCALE, 1, SQUARE1_FOOTPRINT_SCALE);
  belt.rotation.y = state.middle * Math.PI;
  root.add(top, bottom, belt);
  root.scale.y = SQUARE1_HEIGHT_SCALE;
  root.userData.squareAnimation = { top, bottom, belt };
  return root;
}
