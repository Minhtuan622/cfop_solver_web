/**
 * The one source of truth for the six sticker colours of the studio cube.
 *
 * The palette is plain data — no JSX, no Three.js — so the eager 2D views,
 * the lazy 3D side events and the settings swatches all read the same
 * values without dragging a renderer into the eager bundle.
 *
 * Players solve the white cross first, so the studio views always show the
 * cube the way it is held during a CFOP solve: yellow up, white down. To
 * keep the chirality of the real cube the whole scheme is the z2 flip of
 * the classic Western WCA layout: F green and B blue stay put while the
 * white/yellow layer and the orange/red flank swap with them. The 3×3 cube
 * still reads as the same family as 2×2×2, 4×4×4 and the rest (the lazy
 * 3D preview mirrors these swaps onto the Cubing.js sticker colours).
 */
export const CUBE_COLORS: Record<string, string> = {
  U: "#ffd500",
  R: "#ff5800",
  F: "#009b48",
  D: "#f2f2f2",
  L: "#b71234",
  B: "#0046ad",
};

/** The colour used when a sticker letter is unknown. */
export const CUBE_FALLBACK_COLOR = "#888";
