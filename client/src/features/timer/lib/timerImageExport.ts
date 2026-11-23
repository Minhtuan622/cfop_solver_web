/** Vẽ ảnh PNG để chia sẻ: thẻ ao5 (kèm khối sau khi tráo) và thẻ một lượt giải. */
import { CUBE_COLORS, CUBE_FALLBACK_COLOR } from "@/features/puzzle-3d/lib/cubeColors";
import { exportPalette, type ExportPalette } from "./exportPalette";
import { SOLVED_FAST_STATE } from "@/lib/fastCube";
import { normalizeTimerEventId, timerEventLabel } from "@/lib/timerEvents";
import { splitSummary } from "./timerAnalysis";
import { formatSolveResult, formatSolveTime, type SolveHistoryEntry } from "@/lib/solveHistory";

import type { Translate } from "./timerLabTypes";
import { safeScrambleState } from "./timerScrambleState";

function canvasLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
function drawMetricCube(
  context: CanvasRenderingContext2D,
  state: string,
  x: number,
  y: number,
  tile: number,
  palette: ExportPalette
) {
  const safe = state.length === 54 ? state : SOLVED_FAST_STATE;
  const faces = ["U", "R", "F", "D", "L", "B"] as const;
  const positions = {
    U: [1, 0],
    L: [0, 1],
    F: [1, 1],
    R: [2, 1],
    B: [3, 1],
    D: [1, 2],
  } as const;
  const offsets = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 } as const;
  context.fillStyle = palette.ink;
  context.fillRect(x - 8, y - 8, tile * 12 + 16, tile * 9 + 16);
  for (const face of faces) {
    const [column, row] = positions[face];
    for (let index = 0; index < 9; index += 1) {
      const sticker = safe[offsets[face] + index] ?? "U";
      const sx = x + (column * 3 + (index % 3)) * tile;
      const sy = y + (row * 3 + Math.floor(index / 3)) * tile;
      context.fillStyle = CUBE_COLORS[sticker] ?? CUBE_FALLBACK_COLOR;
      context.fillRect(sx, sy, tile - 1, tile - 1);
    }
  }
}
/** Dựng ảnh Ao5 để chia sẻ: mỗi lượt một hàng, kèm scramble và CubeNet. */
export function exportAo5Image(
  entries: SolveHistoryEntry[],
  exclusions: Record<string, "best" | "worst">,
  value: number | null | undefined,
  t: Translate,
  language: "vi" | "en"
) {
  const width = 3200;
  const headerHeight = 320;
  const rowHeight = 330;
  const footerHeight = 150;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = headerHeight + entries.length * rowHeight + footerHeight;
  const context = canvas.getContext("2d");
  if (!context) return;
  const palette = exportPalette();
  const margin = 100;
  const cubeX = 690;
  const scrambleX = 1120;
  const scrambleWidth = width - scrambleX - margin;
  const dateLocale = language === "vi" ? "vi-VN" : "en-US";
  context.fillStyle = palette.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  context.fillStyle = palette.ink;
  context.fillRect(0, 0, width, 22);
  context.fillRect(margin, 62, width - margin * 2, 184);
  context.fillStyle = palette.accent;
  context.font = "700 32px monospace";
  context.fillText("CFOP SOLVER STUDIO · TIMER RECORD", 148, 118);
  context.fillStyle = palette.paper;
  context.font = "800 84px monospace";
  context.fillText(
    `AO5 · ${value == null ? "DNF" : formatSolveTime(value)}`,
    148,
    204
  );
  context.fillStyle = palette.onAccent;
  context.font = "600 24px monospace";
  context.fillText(t("timer.exportSheetNote"), 150, 236);
  entries.forEach((entry, index) => {
    const top = headerHeight + index * rowHeight;
    const exclusion = exclusions[entry.id];
    context.fillStyle = index % 2 ? palette.rowAlt : palette.row;
    context.fillRect(margin, top + 12, width - margin * 2, rowHeight - 24);
    context.strokeStyle =
      exclusion === "best"
        ? palette.accent
        : exclusion === "worst"
          ? palette.worst
          : palette.rule;
    context.lineWidth = exclusion ? 7 : 3;
    context.strokeRect(margin, top + 12, width - margin * 2, rowHeight - 24);
    context.fillStyle =
      exclusion === "best"
        ? palette.accentInk
        : exclusion === "worst"
          ? palette.worstInk
          : palette.ink;
    context.font = "900 34px monospace";
    context.fillText(String(index + 1).padStart(2, "0"), 150, top + 82);
    context.font = "900 58px monospace";
    context.fillText(formatSolveResult(entry), 150, top + 153);
    context.font = "700 19px monospace";
    context.fillStyle = palette.muted;
    context.fillText(
      new Date(entry.createdAt).toLocaleDateString(dateLocale),
      152,
      top + 196
    );
    context.fillStyle =
      exclusion === "best"
        ? palette.accentInk
        : exclusion === "worst"
          ? palette.worstInk
          : palette.muted;
    context.font = "700 18px monospace";
    context.fillText(
      exclusion
        ? exclusion === "best"
          ? t("timer.exportBest")
          : t("timer.exportWorst")
        : t("timer.exportCounted"),
      150,
      top + 244
    );
    drawMetricCube(
      context,
      safeScrambleState(entry.input, entry.eventId),
      cubeX,
      top + 26,
      28,
      palette
    );
    context.fillStyle = palette.label;
    context.font = "800 20px monospace";
    context.fillText("SCRAMBLE", scrambleX, top + 64);
    context.fillStyle = palette.ink;
    context.font = "900 36px monospace";
    const scramble = canvasLines(context, entry.input, scrambleWidth).slice(
      0,
      2
    );
    scramble.forEach((line, lineIndex) =>
      context.fillText(line, scrambleX, top + 126 + lineIndex * 50)
    );
    context.fillStyle = palette.muted;
    context.font = "700 19px monospace";
    context.fillText(
      entry.phaseSplits.length
        ? splitSummary(entry)
        : t("timer.exportNoSplits"),
      scrambleX,
      top + 245
    );
    if (entry.note) {
      context.font = "600 18px monospace";
      context.fillText(
        `${t("timer.exportNote")}: ${entry.note.slice(0, 132)}`,
        scrambleX,
        top + 280
      );
    }
  });
  context.fillStyle = palette.muted;
  context.font = "600 21px monospace";
  context.fillText(t("timer.exportFooter"), margin, canvas.height - 54);
  const link = document.createElement("a");
  link.download = `cfop-ao5-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
/** Dựng ảnh thẻ lượt giải để chia sẻ: thời gian lớn, scramble, net và pha. */
export function exportSolveImage(entry: SolveHistoryEntry, language: "vi" | "en") {
  const width = 1080;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  const palette = exportPalette();
  const margin = 64;
  const innerWidth = width - margin * 2;
  const dateLocale = language === "vi" ? "vi-VN" : "en-US";

  context.fillStyle = palette.paper;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  context.fillStyle = palette.ink;
  context.fillRect(0, 0, width, 20);

  // Eyebrow row: studio mark on the left, the event on the right.
  context.fillStyle = palette.accent;
  context.font = "800 30px monospace";
  context.fillText("CFOP SOLVER STUDIO", margin, 92);
  const eventLabel = timerEventLabel(
    normalizeTimerEventId(entry.eventId),
    language
  );
  context.textAlign = "right";
  context.fillStyle = palette.muted;
  context.font = "700 22px monospace";
  context.fillText(eventLabel, width - margin, 92);
  context.textAlign = "left";

  // Ink panel with the time itself.
  context.fillStyle = palette.ink;
  context.fillRect(margin, 128, innerWidth, 250);
  context.fillStyle = palette.accent;
  context.font = "700 24px monospace";
  context.fillText("SOLVE CARD", margin + 44, 196);
  context.fillStyle = palette.onAccent;
  context.font = "900 112px monospace";
  context.fillText(formatSolveResult(entry), margin + 44, 330);
  context.fillStyle = palette.muted;
  context.font = "600 22px monospace";
  context.fillText(
    new Date(entry.createdAt).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    margin + 44,
    372
  );

  // Cube net + scramble block.
  drawMetricCube(
    context,
    safeScrambleState(entry.input, entry.eventId),
    margin,
    448,
    27,
    palette
  );
  const rightX = margin + 360;
  const rightWidth = width - margin - rightX;
  context.fillStyle = palette.muted;
  context.font = "700 20px monospace";
  context.fillText("SCRAMBLE", rightX, 490);
  context.fillStyle = palette.ink;
  context.font = "800 34px monospace";
  canvasLines(context, entry.input, rightWidth)
    .slice(0, 4)
    .forEach((line, lineIndex) =>
      context.fillText(line, rightX, 540 + lineIndex * 46)
    );
  if (entry.penalty !== "none") {
    context.fillStyle = palette.worst;
    context.font = "800 26px monospace";
    context.fillText(entry.penalty, rightX, 740);
  }

  // Phase splits (auto-detected on smart-cube solves when present).
  if (entry.phaseSplits.length) {
    context.fillStyle = palette.muted;
    context.font = "700 20px monospace";
    context.fillText("PHASES", margin, 830);
    context.fillStyle = palette.ink;
    context.font = "700 25px monospace";
    context.fillText(splitSummary(entry).slice(0, 80), margin, 868);
  }

  // Footer.
  context.textAlign = "center";
  context.fillStyle = palette.muted;
  context.font = "600 21px monospace";
  context.fillText(
    "CFOP SOLVER STUDIO · cfop-solver.studio",
    width / 2,
    height - 40
  );
  context.textAlign = "left";

  const link = document.createElement("a");
  link.download = `cfop-solve-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

