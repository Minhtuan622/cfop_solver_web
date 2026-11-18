import { describe, expect, it } from "vitest";
import { stateFromScramble } from "@/lib/fastCube";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import {
  kpatternToFacelets,
  patternFromAlg,
  getSolvedPattern,
} from "./kpatternFacelets";

describe("kpatternToFacelets", () => {
  it("converts the solved pattern to the app's solved state", async () => {
    const pattern = await getSolvedPattern();
    expect(kpatternToFacelets(pattern)).toBe(
      "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
    );
  });

  it("matches the app's model after 60 random scrambles", async () => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const scramble = randomThreeByThreeScramble();
      const pattern = await patternFromAlg(scramble);
      const converted = kpatternToFacelets(pattern);
      const reference = stateFromScramble(scramble);
      expect(converted, `scramble: ${scramble}`).toBe(reference);
    }
  });

  it("matches after each of the 18 single moves", async () => {
    for (const move of [
      "U", "U'", "U2", "R", "R'", "R2",
      "F", "F'", "F2", "D", "D'", "D2",
      "L", "L'", "L2", "B", "B'", "B2",
    ]) {
      const pattern = await patternFromAlg(move);
      expect(
        kpatternToFacelets(pattern),
        `move: ${move}`,
      ).toBe(stateFromScramble(move));
    }
  });
});
