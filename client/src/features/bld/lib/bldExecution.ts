import { fetchBldCatalogFile, type BldCatalogFile } from "./bldCatalogSource";
import { firstCatalogAlgorithm } from "./bldFullCatalog";

export type BldAlgorithmCatalog = Record<string, string>;
export type BldRuntimeCatalogs = {
  edge: BldAlgorithmCatalog;
  corner: BldAlgorithmCatalog;
  parity: BldAlgorithmCatalog;
  flip: BldAlgorithmCatalog;
  twist: BldAlgorithmCatalog;
  parityEdge: Record<string, string>;
  parityCorner: Record<string, string>;
  edgeCode: Record<string, string>;
  cornerCode: Record<string, string>;
};

const POSITIONS = [
  "UBL", "UB", "UBR", "UR", "U", "UF", "UFR", "UL", "UFL",
  "LUB", "LU", "LUF", "LF", "L", "LD", "LDF", "LB", "LDB",
  "FUL", "FU", "FUR", "FR", "F", "FD", "FDR", "FL", "FDL",
  "RUF", "RU", "RUB", "RB", "R", "RD", "RDB", "RF", "RDF",
  "BUR", "BU", "BUL", "BL", "B", "BD", "BDL", "BR", "BDR",
  "DFL", "DF", "DFR", "DR", "D", "DB", "DBR", "DL", "DBL",
];
const CHICHU = "DEGC GAAJEDCX TQLMBBLS QNJYKHIR ZZPSHFFY WTNPWIXK OOMR";
const SPEFFZ = "AABD BDCCEEFH FHGGIIJL JLKKMMNP NPOOQQRT RTSSUUVX VXWW";
export const EDGE_POSITIONS = [
  "UF", "UL", "UB", "UR", "DF", "DL", "DB", "DR", "FR", "FL", "BL", "BR",
];
export const CORNER_POSITIONS = [
  "UFR", "UBR", "UFL", "UBL", "DFR", "DBR", "DFL", "DBL",
];
const FLIP_CODE: Record<string, string> = {
  UR: "H",
  UF: "B",
  UL: "D",
  UB: "F",
  DR: "P",
  DL: "L",
  FR: "R",
  FL: "T",
  BR: "Z",
  DF: "J",
  BL: "X",
  DB: "N",
};
const FLIP_ORDER = [
  "UF", "UL", "UB", "UR", "DF", "DL", "DB", "DR", "FR", "FL", "BL", "BR",
];
const TWIST_ORDER = ["UFL", "UBL", "UBR", "UFR", "DFL", "DBL", "DBR", "DFR"];
const TWIST_CODE: Record<string, Record<"cw" | "ccw", string>> = {
  UFR: { cw: "L", ccw: "K" },
  UBR: { cw: "I", ccw: "H" },
  UFL: { cw: "C", ccw: "B" },
  UBL: { cw: "F", ccw: "E" },
  DFR: { cw: "Z", ccw: "Y" },
  DBR: { cw: "T", ccw: "S" },
  DFL: { cw: "N", ccw: "M" },
  DBL: { cw: "Q", ccw: "P" },
};

export function sourceToSpeffz(kind: "edge" | "corner") {
  const map = new Map<string, string>();
  POSITIONS.forEach((position, index) => {
    if (position.length === (kind === "edge" ? 2 : 3) && CHICHU[index] !== " ")
      map.set(CHICHU[index], SPEFFZ[index]);
  });
  return (key: string) =>
    Array.from(key, letter => map.get(letter) ?? letter).join("");
}

export function parseCatalog(
  raw: Record<string, unknown>,
  convert?: (key: string) => string
): BldAlgorithmCatalog {
  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, variants]) => [
        convert ? convert(key) : key,
        firstCatalogAlgorithm(variants),
      ])
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
  );
}

export async function loadBldRuntimeCatalogs(): Promise<BldRuntimeCatalogs> {
  const request = <T,>(file: BldCatalogFile) => fetchBldCatalogFile<T>(file);
  const [
    edge,
    corner,
    parity,
    flip,
    twist,
    parityEdge,
    parityCorner,
    edgeCode,
    cornerCode,
  ] = await Promise.all([
    request<Record<string, unknown>>("edge"),
    request<Record<string, unknown>>("corner"),
    request<Record<string, unknown>>("parity"),
    request<Record<string, unknown>>("flip"),
    request<Record<string, unknown>>("twist"),
    request<Record<string, string>>("parityEdge"),
    request<Record<string, string>>("parityCorner"),
    request<Record<string, string>>("edgeCode"),
    request<Record<string, string>>("cornerCode"),
  ]);
  return {
    edge: parseCatalog(edge, sourceToSpeffz("edge")),
    corner: parseCatalog(corner, sourceToSpeffz("corner")),
    parity: parseCatalog(parity),
    flip: parseCatalog(flip),
    twist: parseCatalog(twist),
    parityEdge,
    parityCorner,
    edgeCode,
    cornerCode,
  };
}

export function flipPairsOf(edgeFlips: string[]) {
  return [...edgeFlips]
    .sort((left, right) => FLIP_ORDER.indexOf(left) - FLIP_ORDER.indexOf(right))
    .reduce<{ key: string; positions: string }[]>(
      (pairs, position, index, all) => {
        if (index % 2 === 0 && all[index + 1])
          pairs.push({
            key: `${FLIP_CODE[position]}${FLIP_CODE[all[index + 1]]}`,
            positions: `${position} ↔ ${all[index + 1]}`,
          });
        return pairs;
      },
      []
    );
}

export function twistKeyOf(
  cornerTwists: { position: string; direction: "cw" | "ccw" }[]
) {
  return TWIST_ORDER.map(position => {
    const twist = cornerTwists.find(item => item.position === position);
    return twist ? TWIST_CODE[position][twist.direction] : "";
  }).join("");
}

export function parityKeyOf(
  catalogs: BldRuntimeCatalogs | null,
  parityEdges: [string, string],
  parityCorners: [string, string]
) {
  if (
    !catalogs ||
    parityEdges[0] === parityEdges[1] ||
    parityCorners[0] === parityCorners[1]
  )
    return "";
  const edge =
    catalogs.parityEdge[
      `${catalogs.edgeCode[parityEdges[0]] ?? ""}${catalogs.edgeCode[parityEdges[1]] ?? ""}`
    ];
  const corner =
    catalogs.parityCorner[
      `${catalogs.cornerCode[parityCorners[0]] ?? ""}${catalogs.cornerCode[parityCorners[1]] ?? ""}`
    ];
  return edge && corner ? `${edge}${corner}` : "";
}
