/**
 * The one source of truth for the six sticker colours of the studio cube.
 *
 * The palette is plain data — no JSX, no Three.js — so the eager 2D views,
 * the lazy 3D side events and the settings swatches all read the same
 * values without dragging a renderer into the eager bundle.
 *
 * The colours follow the standard Western (WCA) scheme instead of a custom
 * studio palette: they match the classic Rubik look every other 3D cube in
 * the app is rendered with (Cubing.js `<twisty-player>`), so the 3×3 cube
 * reads as the same family as 2×2×2, 4×4×4 and the rest.
 */
export const CUBE_COLORS: Record<string, string> = {
  U: "#f2f2f2",
  R: "#b71234",
  F: "#009b48",
  D: "#ffd500",
  L: "#ff5800",
  B: "#0046ad",
};

/** The colour used when a sticker letter is unknown. */
export const CUBE_FALLBACK_COLOR = "#888";
