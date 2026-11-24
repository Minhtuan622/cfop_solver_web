import { describe, expect, it } from "vitest";
import { invertAlgorithm } from "./puzzleSolve";

describe("invertAlgorithm", () => {
  it("reverses the order and flips every turn", () => {
    expect(invertAlgorithm("R U R' U' F2")).toBe("F2 U R U' R'");
  });

  it("is its own inverse", () => {
    const alg = "x R U' L2 Rw D'";
    expect(invertAlgorithm(invertAlgorithm(alg))).toBe(alg);
  });

  it("tolerates extra whitespace and an empty algorithm", () => {
    expect(invertAlgorithm("  R   U ")).toBe("U' R'");
    expect(invertAlgorithm("")).toBe("");
  });
});

describe("invertAlgorithm cho Megaminx", () => {
  it("đảo ++ và --, và \"2\" là 2/5 vòng nên đảo thành 2'", () => {
    expect(invertAlgorithm("R++ D-- U")).toBe("U' D++ R--");
    expect(invertAlgorithm("DR2 FL2'", { fifthTurns: true })).toBe("FL2 DR2'");
    expect(invertAlgorithm("R2")).toBe("R2");
  });
});
