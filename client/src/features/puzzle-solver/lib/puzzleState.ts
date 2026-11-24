export type KPuzzleId = "2x2x2" | "3x3x3" | "pyraminx" | "skewb" | "megaminx";

export type StateSticker = {
  id: string;
  orbit: string;
  slot: number;
  k: number;
  face: string;
  fill: string;
  points: string;
};

export type StateOrbit = { name: string; numPieces: number; numOrientations: number };

export type StateModel = {
  viewBox: string;
  stickers: StateSticker[];
  faces: Array<{ name: string; fill: string }>;
  orbits: StateOrbit[];
  groups: Record<string, string[]>;
  orientSign: 1 | -1;
};

export type Painting = Record<string, string>;

export type PatternData = Record<
  string,
  { pieces: number[]; orientation: number[] }
>;

export type PaintingProblem =
  | { code: "no-piece"; orbit: string; slot: number }
  | { code: "duplicate-piece"; orbit: string; piece: number }
  | { code: "twist"; orbit: string };

export function parseStateSvg(svg: string, orbits: StateOrbit[]): StateModel {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? "0 0 800 500";
  const stickers: StateSticker[] = [];
  const faces: StateModel["faces"] = [];
  const faceRe = /<g><title>([^<]*)<\/title>([\s\S]*?)<\/g>/g;
  const polyRe =
    /<polygon id="([A-Z_0-9]+)-l(\d+)-o(\d+)"[^>]*style="fill: (#[0-9a-fA-F]+)"[^>]*points="([^"]*)"/g;
  for (let face = faceRe.exec(svg); face; face = faceRe.exec(svg)) {
    if (!faces.some(item => item.name === face![1])) faces.push({ name: face[1], fill: "" });
    polyRe.lastIndex = 0;
    for (let poly = polyRe.exec(face[2]); poly; poly = polyRe.exec(face[2])) {
      const [, orbit, slot, k, fill, points] = poly;
      stickers.push({ id: `${orbit}-l${slot}-o${k}`, orbit, slot: +slot, k: +k, face: face[1], fill, points });
      const entry = faces.find(item => item.name === face![1])!;
      if (!entry.fill) entry.fill = fill;
    }
  }
  return finishModel(viewBox, stickers, faces, orbits, 1);
}

const HAND_FACES: Record<string, string> = {
  white: "U",
  yellow: "D",
  limegreen: "F",
  "#26f": "B",
  red: "R",
  orange: "L",
};

const numbers = (text: string) => (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

export function parseHandSvg(svg: string, orbits: StateOrbit[]): StateModel {
  const shapes = new Map<string, Array<[number, number]>>();
  const shapeRe = /<g id="(sticker[\w-]*)"([^>]*)>([\s\S]*?)<\/g>/g;
  for (let shape = shapeRe.exec(svg); shape; shape = shapeRe.exec(svg)) {
    const scale = /scale\(([^)]*)\)/.exec(shape[2]);
    const [sx = 1, sy = sx] = scale ? numbers(scale[1]) : [];
    const rect =
      /<rect[^>]*x="([-\d.]+)"[^>]*y="([-\d.]+)"[^>]*width="([-\d.]+)"[^>]*height="([-\d.]+)"/.exec(
        shape[3]
      );
    if (!rect) continue;
    const [x, y, w, h] = rect.slice(1).map(Number);
    const points: Array<[number, number]> = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
    shapes.set(shape[1], points.map(([px, py]) => [px * sx, py * sy]));
  }
  const group = /<g id="puzzle"[^>]*transform="([^"]*)"/.exec(svg)?.[1] ?? "";
  const groupScale = /scale\(([^)]*)\)/.exec(group);
  const [gx = 1, gy = gx] = groupScale ? numbers(groupScale[1]) : [];

  const orbitNames = new Set(orbits.map(orbit => orbit.name));
  const stickers: StateSticker[] = [];
  const faces: StateModel["faces"] = [];
  const useRe =
    /<use id="([A-Z_0-9]+)-l(\d+)-o(\d+)"\s+href="#(sticker[\w-]*)"\s+transform="translate\(([^)]*)\)"\s+style="fill: ([^"]+)"/g;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let use = useRe.exec(svg); use; use = useRe.exec(svg)) {
    const [, orbit, slot, k, shapeId, translate, color] = use;
    const shape = shapes.get(shapeId);
    const face = HAND_FACES[color.trim()];
    if (!orbitNames.has(orbit) || !shape || !face) continue;
    const [tx, ty] = numbers(translate);
    const pixels = shape.map(([x, y]) => [(x + tx) * gx, (y + ty) * gy] as const);
    for (const [x, y] of pixels) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const fill = color.trim();
    stickers.push({
      id: `${orbit}-l${slot}-o${k}`,
      orbit,
      slot: +slot,
      k: +k,
      face,
      fill,
      points: pixels.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" "),
    });
    if (!faces.some(item => item.name === face)) faces.push({ name: face, fill });
  }
  const pad = 4;
  const viewBox = `${(minX - pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${(maxX - minX + 2 * pad).toFixed(2)} ${(maxY - minY + 2 * pad).toFixed(2)}`;
  return finishModel(viewBox, stickers, faces, orbits, -1);
}

function finishModel(
  viewBox: string,
  stickers: StateSticker[],
  faces: StateModel["faces"],
  orbits: StateOrbit[],
  orientSign: 1 | -1
): StateModel {
  const byPiece = new Map<string, StateSticker[]>();
  for (const sticker of stickers) {
    const key = `${sticker.orbit}-l${sticker.slot}`;
    byPiece.set(key, [...(byPiece.get(key) ?? []), sticker]);
  }
  const groups: Record<string, string[]> = {};
  for (const members of byPiece.values()) {
    if (members.length > 1 && members.every(item => item.face === members[0].face))
      for (const item of members) groups[item.id] = members.map(other => other.id);
  }
  return { viewBox, stickers, faces, orbits, groups, orientSign };
}

export function solvedPainting(model: StateModel): Painting {
  return Object.fromEntries(model.stickers.map(sticker => [sticker.id, sticker.face]));
}

const wrap = (value: number, m: number) => ((value % m) + m) % m;

function solvedFace(model: StateModel) {
  const lookup = new Map(model.stickers.map(sticker => [sticker.id, sticker.face]));
  return (orbit: string, piece: number, k: number) => lookup.get(`${orbit}-l${piece}-o${k}`);
}

export function patternToPainting(model: StateModel, data: PatternData): Painting {
  const solved = solvedFace(model);
  const painting: Painting = {};
  for (const orbit of model.orbits) {
    const { pieces, orientation } = data[orbit.name];
    const m = orbit.numOrientations;
    for (let slot = 0; slot < orbit.numPieces; slot += 1) {
      for (let k = 0; k < m; k += 1) {
        const face = solved(orbit.name, pieces[slot], wrap(k + model.orientSign * orientation[slot], m));
        if (face) painting[`${orbit.name}-l${slot}-o${k}`] = face;
      }
    }
  }
  return painting;
}

export function paintingToPatternData(
  model: StateModel,
  painting: Painting
): { ok: true; data: PatternData } | { ok: false; problem: PaintingProblem } {
  const solved = solvedFace(model);
  const data: PatternData = {};
  for (const orbit of model.orbits) {
    const m = orbit.numOrientations;
    const pieces: number[] = [];
    const orientation: number[] = [];
    const used = new Set<number>();
    for (let slot = 0; slot < orbit.numPieces; slot += 1) {
      let found: [number, number] | null = null;
      for (let piece = 0; piece < orbit.numPieces && !found; piece += 1) {
        for (let d = 0; d < m && !found; d += 1) {
          let match = true;
          for (let k = 0; k < m && match; k += 1)
            match =
              solved(orbit.name, piece, wrap(k + model.orientSign * d, m)) ===
              painting[`${orbit.name}-l${slot}-o${k}`];
          if (match && !used.has(piece)) found = [piece, d];
        }
      }
      if (!found) {
        const anyMatch = Array.from({ length: orbit.numPieces }, (_, piece) => piece).some(
          piece =>
            Array.from({ length: m }, (_, d) => d).some(d =>
              Array.from({ length: m }, (_, k) => k).every(
                k =>
                  solved(orbit.name, piece, wrap(k + model.orientSign * d, m)) ===
                  painting[`${orbit.name}-l${slot}-o${k}`]
              )
            )
        );
        return {
          ok: false,
          problem: anyMatch
            ? { code: "duplicate-piece", orbit: orbit.name, piece: slot }
            : { code: "no-piece", orbit: orbit.name, slot },
        };
      }
      used.add(found[0]);
      pieces.push(found[0]);
      orientation.push(found[1]);
    }
    data[orbit.name] = { pieces, orientation };
  }
  return { ok: true, data };
}

export function colorCountsMatch(model: StateModel, painting: Painting) {
  const count = (source: (sticker: StateSticker) => string | undefined) => {
    const map = new Map<string, number>();
    for (const sticker of model.stickers) {
      const face = source(sticker);
      if (face) map.set(face, (map.get(face) ?? 0) + 1);
    }
    return map;
  };
  const want = count(sticker => sticker.face);
  const have = count(sticker => painting[sticker.id]);
  return Array.from(want).every(([face, total]) => have.get(face) === total);
}
