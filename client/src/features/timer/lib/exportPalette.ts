import { cssToken } from "@/lib/cssTokens";

/**
 * The colours of the exported timer record sheet.
 *
 * The sheet is painted on a canvas, so the tokens are resolved at paint time
 * instead of being referenced with `var(--token)` like the DOM would.
 */
export type ExportPalette = {
  paper: string;
  onAccent: string;
  ink: string;
  accent: string;
  accentInk: string;
  label: string;
  grid: string;
  row: string;
  rowAlt: string;
  rule: string;
  muted: string;
  worst: string;
  worstInk: string;
};

/** Reads the export sheet palette from the document tokens. */
export function exportPalette(): ExportPalette {
  return {
    paper: cssToken("--cfop-export-paper", "#f4f0e8"),
    onAccent: cssToken("--cfop-export-on-accent", "rgba(244,240,232,.72)"),
    ink: cssToken("--cfop-export-ink", "#17221d"),
    accent: cssToken("--cfop-export-accent", "#1ba77a"),
    accentInk: cssToken("--cfop-export-accent-ink", "#176d52"),
    label: cssToken("--cfop-export-label", "#1b7b5e"),
    grid: cssToken("--cfop-export-grid", "rgba(23,34,29,.12)"),
    row: cssToken("--cfop-export-row", "#fffdfa"),
    rowAlt: cssToken("--cfop-export-row-alt", "#ebe5d9"),
    rule: cssToken("--cfop-export-rule", "rgba(23,34,29,.28)"),
    muted: cssToken("--cfop-export-muted", "#65716a"),
    worst: cssToken("--cfop-export-worst", "#d95743"),
    worstInk: cssToken("--cfop-export-worst-ink", "#a33d2d"),
  };
}
