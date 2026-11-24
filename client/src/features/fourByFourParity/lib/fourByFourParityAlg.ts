import { invertAlgorithm } from "@/lib/fastCube";

export function toCubingNotation(alg: string): string {
  return alg
    .split(/\s+/)
    .flatMap(token => {
      if (token === "M") return ["l", "r'"];
      if (token === "M'") return ["l'", "r"];
      if (token === "M2") return ["l2", "r2"];
      return [token];
    })
    .join(" ");
}

export function fourByFourParityScrambleOf(alg: string): string {
  return invertAlgorithm(toCubingNotation(alg));
}
