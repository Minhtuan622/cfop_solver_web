/** The Three.js module, injected so the side-event renderer never imports it eagerly. */
export type ThreeModule = typeof import("three");

/** One cubie orbit of a Cubing pattern: which pieces it owns and how they are turned. */
export type PatternOrbit = { pieces: number[]; orientation: number[] };
export type PatternData = Record<string, PatternOrbit>;
export type PatternState = { patternData: PatternData; applyAlg: (alg: string) => PatternState };
export type PatternLoader = { kpuzzle: () => Promise<{ defaultPattern: () => PatternState }> };

export const TAU = Math.PI * 2;
