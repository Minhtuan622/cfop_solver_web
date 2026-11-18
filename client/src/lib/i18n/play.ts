import type { Dictionary } from "./index";

/** The virtual keyboard-driven cube page (/play). */
export const playWords: Dictionary = {
  "play.eyebrow": ["Chơi ảo", "Virtual cube"],
  "play.title": ["Rubik ảo bằng bàn phím", "Virtual cube on your keyboard"],
  "play.subtitle": [
    "Xoay khối 3×3 bằng bàn phím theo bộ phím của csTimer — chế độ tự do để nghịch, hoặc chế độ giải có giờ như một solve thật.",
    "Turn a 3×3 on your keyboard with the csTimer key layout — free-play to mess around, or a timed solve like the real thing.",
  ],
  "nav.play": ["Chơi ảo", "Play"],

  "play.modeFree": ["Tự do", "Free play"],
  "play.modeRace": ["Giải có giờ", "Timed solve"],
  "play.freeHint": [
    "Bấm phím bất kỳ để xoay. Kéo chuột để xoay góc nhìn, lăn chuột để thu phóng.",
    "Press any mapped key to turn. Drag to orbit the view, scroll to zoom.",
  ],
  "play.resetCube": ["Về khối giải được", "Reset to solved"],

  "play.inspectionLabel": ["15 giây kiểm tra (WCA)", "15s inspection (WCA)"],
  "play.startHint": [
    "Bấm Space để xáo trộn và bắt đầu",
    "Press Space to scramble and start",
  ],
  "play.readyHint": [
    "Sẵn sàng — nước đi đầu tiên sẽ bắt đầu tính giờ",
    "Ready — your first turn starts the clock",
  ],
  "play.inspecting": ["Đang kiểm tra…", "Inspecting…"],
  "play.solving": ["Đang giải", "Solving"],
  "play.idleDnfHint": ["Esc để hủy ván", "Esc to cancel the attempt"],
  "play.scramble": ["Scramble", "Scramble"],
  "play.newScramble": ["Xáo trộn mới", "New scramble"],
  "play.movesLabel": ["{count} nước", "{count} moves"],
  "play.layersLabel": [
    "Tầng trái {oSl} · Tầng phải {oSr}",
    "Left layer {oSl} · Right layer {oSr}",
  ],

  "play.keysTitle": ["Bộ phím (giống csTimer)", "Key map (same as csTimer)"],
  "play.keyFaces": [
    "Mặt: I/K = R/R' · J/F = U/U' · H/G = F/F' · D/E = L/L' · S/L = D/D' · W/O = B/B'",
    "Faces: I/K = R/R' · J/F = U/U' · H/G = F/F' · D/E = L/L' · S/L = D/D' · W/O = B/B'",
  ],
  "play.keyWide": [
    "Rộng: U = r · M = r' · R = l' · V = l · , = u · C = u' · Z = d · / = d'",
    "Wide: U = r · M = r' · R = l' · V = l · , = u · C = u' · Z = d · / = d'",
  ],
  "play.keySlice": [
    "Slice: X/. = M' · 5/6 = M · 1 = S' · 0 = S · 2 = E · 9 = E'",
    "Slices: X/. = M' · 5/6 = M · 1 = S' · 0 = S · 2 = E · 9 = E'",
  ],
  "play.keyRotate": [
    "Xoay cả khối: T/Y = x · N/B = x' · ; = y · A = y' · P = z · Q = z'",
    "Rotations: T/Y = x · N/B = x' · ; = y · A = y' · P = z · Q = z'",
  ],
  "play.keyLayers": [
    "Chọn tầng: 3/4 thu/giãn tầng trái · 7/8 thu/giãn tầng phải · Space = về 1/1",
    "Layers: 3/4 shrink/extend left · 7/8 shrink/extend right · Space = reset 1/1",
  ],
  "play.keyCamera": [
    "Mũi tên = xoay góc nhìn · Space = xáo trộn / bắt đầu · Esc = hủy",
    "Arrows = orbit camera · Space = scramble / start · Esc = cancel",
  ],

  "play.historyTitle": ["Lịch sử chơi ảo", "Virtual solve history"],
  "play.historyNote": [
    "Riêng biệt hoàn toàn — không tính vào solve 3×3×3 thật.",
    "Completely separate — never counted into your real 3×3×3 solves.",
  ],
  "play.historyEmpty": [
    "Chưa có lần giải nào. Chuyển sang Giải có giờ và bấm Space để bắt đầu.",
    "No solves yet. Switch to Timed solve and press Space to start.",
  ],
  "play.clearAll": ["Xóa toàn bộ", "Clear all"],
  "play.clearTitle": ["Xóa toàn bộ lịch sử chơi ảo?", "Clear virtual solve history?"],
  "play.clearDetail": [
    "Toàn bộ {count} lần giải ảo sẽ bị xóa vĩnh viễn. Không ảnh hưởng solve thật.",
    "All {count} virtual solves will be permanently deleted. Real solves are untouched.",
  ],
  "play.clearConfirm": ["Xóa tất cả", "Clear all"],
  "play.cancel": ["Hủy", "Cancel"],
  "play.deleteSolve": ["Xóa lần giải này", "Delete this solve"],
  "play.best": ["Best", "Best"],
  "play.ao5": ["Ao5", "Ao5"],
  "play.solves": ["Lần giải", "Solves"],
  "play.count": ["{count} lần", "{count} solves"],
  "play.solveRecorded": ["Đã lưu: {time}", "Saved: {time}"],
  "play.solveDnf": ["Đã hủy — DNF", "Cancelled — DNF"],
  "play.solveButton": ["Giải có giờ", "Timed solve"],
};
