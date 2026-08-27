import type { CrossColor, F2LSlot, LastLayerMode, OpeningMode, SolverResult } from "./solverRuntime";
import { downloadFile } from "./browserDownload";

export { downloadFile as saveBlob } from "./browserDownload";

export const PHASE_COLORS: Record<string, string> = {
  cross: "bg-[#e7c34f] text-[#17221d]",
  xcross_FR: "bg-[#1ba77a] text-[#17221d]", xcross_FL: "bg-[#1ba77a] text-[#17221d]", xcross_BL: "bg-[#1ba77a] text-[#17221d]", xcross_BR: "bg-[#1ba77a] text-[#17221d]",
  xxcross_FR_FL: "bg-[#1ba77a] text-[#17221d]", xxcross_FR_BL: "bg-[#1ba77a] text-[#17221d]", xxcross_FR_BR: "bg-[#1ba77a] text-[#17221d]", xxcross_FL_BL: "bg-[#1ba77a] text-[#17221d]", xxcross_FL_BR: "bg-[#1ba77a] text-[#17221d]", xxcross_BL_BR: "bg-[#1ba77a] text-[#17221d]",
  xxxcross_FR_FL_BL: "bg-[#1ba77a] text-[#17221d]", xxxcross_FR_FL_BR: "bg-[#1ba77a] text-[#17221d]", xxxcross_FR_BL_BR: "bg-[#1ba77a] text-[#17221d]", xxxcross_FL_BL_BR: "bg-[#1ba77a] text-[#17221d]",
  xxxxcross_FR_FL_BL_BR: "bg-[#1ba77a] text-[#17221d]",
  f2l_FR: "bg-[#ed8e42] text-[#17221d]", f2l_FL: "bg-[#d95743] text-white", f2l_BL: "bg-[#3b6fc7] text-white", f2l_BR: "bg-[#c9c2b1] text-[#17221d]",
  oll: "bg-[#f4f0e8] text-[#17221d]", pll: "bg-[#17221d] text-[#f4f0e8]", zbll: "bg-[#1ba77a] text-[#17221d]", "1lll": "bg-[#17221d] text-[#f4f0e8]",
};

export const CROSS_COLORS: { value: CrossColor; vi: string; en: string; hex: string }[] = [
  { value: "U", vi: "Trắng", en: "White", hex: "#f7f3e9" }, { value: "D", vi: "Vàng", en: "Yellow", hex: "#e7c34f" },
  { value: "F", vi: "Xanh lá", en: "Green", hex: "#1ba77a" }, { value: "B", vi: "Xanh dương", en: "Blue", hex: "#3b6fc7" },
  { value: "R", vi: "Đỏ", en: "Red", hex: "#d95743" }, { value: "L", vi: "Cam", en: "Orange", hex: "#ed8e42" },
];
export const F2L_SLOTS: F2LSlot[] = ["FR", "FL", "BL", "BR"];
export const OPENING_OPTIONS: { value: OpeningMode; vi: string; en: string; compact: string }[] = [
  { value: "cross", vi: "Cross chuẩn", en: "Standard Cross", compact: "CROSS" }, { value: "auto", vi: "XCross · Cross + 1 F2L", en: "XCross · Cross + 1 F2L", compact: "XCROSS" },
  { value: "xxcross", vi: "XXCross · Cross + 2 F2L", en: "XXCross · Cross + 2 F2L", compact: "XXCROSS" }, { value: "xxxcross", vi: "XXXCross · Cross + 3 F2L", en: "XXXCross · Cross + 3 F2L", compact: "XXXCROSS" },
  { value: "xxxxcross", vi: "XXXXCross · Full F2L", en: "XXXXCross · Full F2L", compact: "XXXXCROSS" },
];
export const LAST_LAYER_OPTIONS: { value: LastLayerMode; vi: string; en: string; compact: string }[] = [
  { value: "auto", vi: "Tự động · ZBLL → 1LLL → OLL/PLL", en: "Auto · ZBLL → 1LLL → OLL/PLL", compact: "AUTO" }, { value: "oll_pll", vi: "OLL + PLL · 2 pha", en: "OLL + PLL · 2 phases", compact: "OLL/PLL" },
  { value: "zbll", vi: "ZBLL · cần EO", en: "ZBLL · EO required", compact: "ZBLL" }, { value: "1lll", vi: "1LLL · 1 pha", en: "1LLL · 1 phase", compact: "1LLL" },
];

const PHASE_LESSON_URL: Record<string, string> = {
  cross: "https://www.speedsolving.com/wiki/index.php?title=Cross", f2l: "https://www.speedsolving.com/wiki/index.php?title=F2L",
  oll: "https://www.speedsolving.com/wiki/index.php?title=OLL", pll: "https://www.speedsolving.com/wiki/index.php?title=PLL",
};

export function phaseStudyNote(name: string, language: "vi" | "en") {
  const vi = language === "vi";
  if (name.startsWith("xxxxcross") || name.startsWith("xxxcross") || name.startsWith("xxcross") || name.startsWith("xcross")) return vi ? "Đây là phần mở đầu của cách giải. Ứng dụng đã kiểm tra để các bước sau vẫn khớp với khối của bạn." : "This is the beginning of the solution. The app has checked that the following steps still match your cube.";
  if (name === "cross") return vi ? "Đây là phần nền để những bước tiếp theo có thể diễn ra đúng thứ tự." : "This creates the base for the remaining steps.";
  if (name.startsWith("f2l")) return vi ? "Ứng dụng đang lần lượt đưa các mảnh về đúng chỗ." : "The app is putting the pieces back into place.";
  if (name === "oll" || name === "zbll") return vi ? "Ứng dụng đang chỉnh các màu trên mặt trên cho cùng hướng." : "The app is aligning the colors on the top side.";
  return vi ? "Đây là các bước cuối để hoàn thành toàn bộ khối." : "These are the final steps to finish the cube.";
}

export function phaseLessonUrl(name: string) {
  if (name === "zbll") return "https://www.speedsolving.com/wiki/index.php/ZBLL";
  if (name === "1lll") return "https://www.speedsolving.com/wiki/index.php/1LLL";
  return name.startsWith("f2l") || name.startsWith("xcross") || name.startsWith("xxcross") || name.startsWith("xxxcross") || name.startsWith("xxxxcross") ? PHASE_LESSON_URL.f2l : PHASE_LESSON_URL[name] ?? "https://www.speedsolving.com/wiki/index.php/CFOP_method";
}

export function openingModeLabel(mode: string, language: "vi" | "en") {
  const achieved: Record<string, { vi: string; en: string }> = { xcross: { vi: "XCross", en: "XCross" }, xxcross: { vi: "XXCross", en: "XXCross" }, xxxcross: { vi: "XXXCross", en: "XXXCross" }, xxxxcross: { vi: "XXXXCross · Full F2L", en: "XXXXCross · Full F2L" } };
  return OPENING_OPTIONS.find((option) => option.value === mode)?.[language] ?? achieved[mode]?.[language] ?? mode.toUpperCase();
}

export function lastLayerModeLabel(mode: string, language: "vi" | "en") {
  const achieved: Record<string, { vi: string; en: string }> = { oll_pll: { vi: "OLL + PLL", en: "OLL + PLL" }, zbll: { vi: "ZBLL", en: "ZBLL" }, "1lll": { vi: "1LLL", en: "1LLL" } };
  return LAST_LAYER_OPTIONS.find((option) => option.value === mode)?.[language] ?? achieved[mode]?.[language] ?? mode.toUpperCase();
}

export function exportCFOPJson(result: SolverResult) {
  downloadFile("cfop-solution-report.json", "application/json", JSON.stringify({ format: "cfop-solver-studio/report@1", exportedAt: new Date().toISOString(), totalMoves: result.trace.length, algorithm: result.algorithm, opening: result.opening, last_layer: result.last_layer, phases: result.phases, trace: result.trace }, null, 2));
}
