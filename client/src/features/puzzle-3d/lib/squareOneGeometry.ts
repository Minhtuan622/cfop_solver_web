import type { ThreeModule } from "./sideEventShared";
import { CUBE_COLORS } from "./cubeColors";
import {
  SQUARE1_SOLVED_WEDGES,
  SQUARE_CORNER_SIDE,
  SQUARE_EDGE_SIDE,
  type SquareOneState,
} from "./squareOneState";

const SQUARE1_SQA = Math.sqrt(3) / 2 + 1;
const SQUARE1_FOOTPRINT_SCALE = 0.5;
const SQUARE1_LAYER_THICKNESS = 1.08;
const SQUARE1_LAYER_BASE = SQUARE1_LAYER_THICKNESS / 2;
const SQUARE1_HEIGHT_SCALE = 5 / 9;

type SquarePoint = [number, number];

function squareOneSideColor(piece: number, cornerFace = 0) {
  const index = ((piece % 16) + 16) % 16;
  const face = piece % 2 ? SQUARE_CORNER_SIDE[(index - 1 + cornerFace + 16) % 16] : SQUARE_EDGE_SIDE[index];
  return CUBE_COLORS[face] ?? CUBE_COLORS.F;
}

function rotateSquarePoints(points: SquarePoint[], angle: number): SquarePoint[] {
  return points.map(([x, z]) => [x * Math.cos(angle) - z * Math.sin(angle), x * Math.sin(angle) + z * Math.cos(angle)]);
}

function makeSquareShape(THREE: ThreeModule, points: SquarePoint[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z));
  shape.closePath();
  return shape;
}

function squareOneVerticalPanel(THREE: ThreeModule, from: SquarePoint, to: SquarePoint, lowerY: number, upperY: number, color: string) {
  const [ax, az] = from;
  const [bx, bz] = to;
  const midpointX = (ax + bx) / 2;
  const midpointZ = (az + bz) / 2;
  const midpointLength = Math.max(0.0001, Math.hypot(midpointX, midpointZ));
  const outward = 0.006;
  const offsetX = (midpointX / midpointLength) * outward;
  const offsetZ = (midpointZ / midpointLength) * outward;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    ax + offsetX, lowerY, az + offsetZ,
    bx + offsetX, lowerY, bz + offsetZ,
    bx + offsetX, upperY, bz + offsetZ,
    ax + offsetX, upperY, az + offsetZ,
  ], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02, side: THREE.DoubleSide }));
}

function squareOneCubieOutline(THREE: ThreeModule, geometry: InstanceType<ThreeModule["ExtrudeGeometry"]>, rotation: number, verticalBase: number) {
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 22),
    new THREE.LineBasicMaterial({ color: "#0a0d10", transparent: true, opacity: 0.9 }),
  );
  outline.rotation.x = rotation;
  outline.position.y = verticalBase;
  return outline;
}

function squareOneLayer(THREE: ThreeModule, state: SquareOneState, startIndex: number, verticalBase: number) {
  const layer = new THREE.Group();
  const isTopLayer = verticalBase > 0;
  const thickness = SQUARE1_LAYER_THICKNESS;
  const lowerY = isTopLayer ? verticalBase : verticalBase - thickness;
  const upperY = isTopLayer ? verticalBase + thickness : verticalBase;
  const stickerY = isTopLayer ? upperY + 0.004 : lowerY - 0.004;
  const neutralPiece = new THREE.MeshStandardMaterial({ color: "#59636a", roughness: 0.62, metalness: 0.01 });
  const edge: SquarePoint[] = [[0, 0], [-0.5, -SQUARE1_SQA], [0.5, -SQUARE1_SQA]];
  const corner: SquarePoint[] = [[0, 0], [-0.5, -SQUARE1_SQA], [-SQUARE1_SQA, -SQUARE1_SQA], [-SQUARE1_SQA, -0.5]];
  for (let position = 0; position < 12; position += 1) {
    const piece = state.wedges[startIndex + position] ?? SQUARE1_SOLVED_WEDGES[startIndex + position]!;
    const isCorner = piece % 2 === 1;
    const rotation = isCorner
      ? -(startIndex === 0 ? position - 1 : position - 6) * Math.PI / 6
      : -(startIndex === 0 ? position : position - 5) * Math.PI / 6;
    const points = rotateSquarePoints(isCorner ? corner : edge, rotation);
    const shape = makeSquareShape(THREE, points);
    const cubieGeometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const body = new THREE.Mesh(cubieGeometry, neutralPiece);
    body.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    body.position.y = verticalBase;
    const sticker = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: CUBE_COLORS[piece >= 8 ? "D" : "U"], roughness: 0.48, metalness: 0.01 }));
    sticker.rotation.x = isTopLayer ? -Math.PI / 2 : Math.PI / 2;
    sticker.position.y = stickerY;
    sticker.scale.set(1.012, 1.012, 1);
    layer.add(body, sticker, squareOneCubieOutline(THREE, cubieGeometry, body.rotation.x, verticalBase));
    const panels: Array<[SquarePoint, SquarePoint, string]> = isCorner
      ? [[points[1]!, points[2]!, squareOneSideColor(piece)], [points[2]!, points[3]!, squareOneSideColor(piece, 1)]]
      : [[points[1]!, points[2]!, squareOneSideColor(piece)]];
    panels.forEach(([from, to, color]) => layer.add(squareOneVerticalPanel(THREE, from, to, lowerY, upperY, color)));
    if (isCorner) position += 1;
  }
  return layer;
}

export function squareOneObject(THREE: ThreeModule, state: SquareOneState) {
  const root = new THREE.Group();
  const top = squareOneLayer(THREE, state, 0, SQUARE1_LAYER_BASE);
  const bottom = squareOneLayer(THREE, state, 12, -SQUARE1_LAYER_BASE);
  top.scale.set(SQUARE1_FOOTPRINT_SCALE, 1, SQUARE1_FOOTPRINT_SCALE);
  bottom.scale.set(SQUARE1_FOOTPRINT_SCALE, 1, SQUARE1_FOOTPRINT_SCALE);
  const belt = new THREE.Group();
  const beltCore = new THREE.Mesh(new THREE.BoxGeometry(3.31, SQUARE1_LAYER_THICKNESS, 3.31), new THREE.MeshStandardMaterial({ color: "#171d23", roughness: 0.5, metalness: 0.26 }));
  belt.add(beltCore);
  const beltFaces: Array<[number, number, number, string, boolean]> = [
    [0, 1.705, 0, CUBE_COLORS.R, true], [0, -1.705, 0, CUBE_COLORS.L, true],
    [1.705, 0, 0, CUBE_COLORS.F, false], [-1.705, 0, 0, CUBE_COLORS.B, false],
  ];
  beltFaces.forEach(([x, z, rotation, color, side]) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.22, SQUARE1_LAYER_THICKNESS - 0.08, 0.035), new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.03 }));
    band.position.set(x, 0, z);
    band.rotation.y = side ? rotation : Math.PI / 2;
    belt.add(band);
  });
  belt.rotation.y = state.middle * Math.PI;
  belt.scale.set(SQUARE1_FOOTPRINT_SCALE, 1, SQUARE1_FOOTPRINT_SCALE);
  root.add(top, bottom, belt);
  root.scale.y = SQUARE1_HEIGHT_SCALE;
  root.userData.squareAnimation = { top, bottom, belt };
  return root;
}
