/**
 * The one source of truth for the six sticker colours of the studio cube.
 *
 * The palette is plain data — no JSX, no Three.js — so the eager 2D views, the
 * lazy 3D side events and the settings swatches all read the same values
 * without dragging a renderer into the eager bundle.
 */
export const CUBE_COLORS: Record<string, string> = {
  U: "#f7f3e9",
  R: "#d95743",
  F: "#1ba77a",
  D: "#e7c34f",
  L: "#ed8e42",
  B: "#3b6fc7",
};

/** The colour used when a sticker letter is unknown. */
export const CUBE_FALLBACK_COLOR = "#888";
