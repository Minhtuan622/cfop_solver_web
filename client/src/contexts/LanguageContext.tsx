/** Simple bilingual vocabulary shared by the entire CFOP Studio interface. */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "vi" | "en";
type Dictionary = Record<string, [string, string]>;

const words: Dictionary = {
  "app.title": ["CFOP Solver Studio", "CFOP Solver Studio"],
  "app.tagline": ["Xem từng bước, làm theo dễ dàng.", "See each step, follow with ease."],
  "language.vi": ["VI", "VI"], "language.en": ["EN", "EN"],
  "input.title": ["Nhập khối Rubik", "Enter your Rubik's Cube"],
  "input.scramble": ["Chuỗi xoay", "Move sequence"], "input.state": ["Màu 6 mặt", "6-face colors"],
  "input.label": ["Nhập các bước xoay", "Enter move sequence"], "input.solve": ["Tạo hướng dẫn", "Create guide"],
  "input.loading": ["Đang chuẩn bị…", "Preparing…"],
  "input.camera": ["Dùng camera", "Use camera"],
  "guide.title": ["Hướng dẫn từng bước", "Step-by-step guide"],
  "guide.ready": ["Sẵn sàng bắt đầu", "Ready to begin"],
  "guide.help": ["Bấm Phát để xem cube xoay từng bước.", "Press Play to watch the cube turn one step at a time."],
  "guide.previous": ["Trước", "Previous"], "guide.next": ["Sau", "Next"],
  "guide.play": ["Phát", "Play"], "guide.pause": ["Dừng", "Pause"], "guide.reset": ["Làm lại", "Reset"],
  "guide.move": ["Nước xoay", "Move"], "guide.step": ["Bước", "Step"], "guide.moves": ["nước xoay", "moves"],
  "guide.list": ["Danh sách bước", "Step list"],
  "timer.title": ["Timer giải Rubik", "Rubik solve timer"],
  "timer.help": ["Nhấn Space hoặc nút bên dưới để bắt đầu.", "Press Space or use the button below to start."],
  "timer.start": ["Bắt đầu", "Start"], "timer.stop": ["Dừng lại", "Stop"], "timer.reset": ["Đặt lại", "Reset"],
  "timer.saveHint": ["Bấm Dừng để lưu lượt giải vào Lịch sử.", "Press Stop to save this solve to History."],
  "camera.title": ["Quét bằng camera", "Scan with camera"],
  "camera.help": ["Quét lần lượt 6 mặt theo ký hiệu hiển thị.", "Scan the 6 faces in the order shown."],
  "camera.open": ["Mở camera", "Open camera"], "camera.capture": ["Chụp mặt", "Capture face"],
  "camera.stop": ["Tắt camera", "Stop camera"], "camera.reset": ["Quét lại", "Scan again"],
  "practice.title": ["Luyện OLL / PLL", "OLL / PLL practice"],
  "practice.help": ["Nhìn tên case, làm trên cube thật, rồi tự chấm.", "See the case, try it on your cube, then rate yourself."],
  "practice.show": ["Xem cách làm", "Show moves"], "practice.correct": ["Đúng", "Correct"], "practice.wrong": ["Chưa đúng", "Not yet"],
  "practice.new": ["Case mới", "New case"], "practice.attempts": ["LẦN LUYỆN", "ATTEMPTS"],
  "practice.accuracy": ["ĐỘ CHÍNH XÁC", "ACCURACY"], "practice.average": ["THỜI GIAN TB", "AVG TIME"],
  "practice.progress": ["Tiến độ gần đây", "Recent progress"], "practice.noData": ["Hoàn thành vài case để xem biểu đồ tốc độ.", "Complete a few cases to see your speed chart."],
  "practice.reset": ["Xóa số liệu", "Clear stats"],
  "pdf.title": ["Lưu hướng dẫn", "Save your guide"],
  "pdf.help": ["Tải file PDF với toàn bộ bước giải đơn giản.", "Download a PDF with all simple solution steps."],
  "pdf.export": ["Tải PDF", "Download PDF"],
  "pdf.wait": ["Hãy tạo hướng dẫn trước", "Create a guide first"],
  "pdf.sheet": ["Lưu hướng dẫn", "Save your guide"],
  "pdf.sheetHelp": ["Tải file PDF với các bước giải đơn giản, dễ xem lại.", "Download a PDF with simple steps to review later."],
  "pdf.ready": ["SẴN SÀNG TẢI", "READY TO DOWNLOAD"],
  "pdf.waiting": ["CHƯA CÓ HƯỚNG DẪN", "NO GUIDE YET"],
  "status.title": ["Tình trạng", "Status"], "status.ready": ["Đã sẵn sàng", "Ready"],
  "status.moves": ["NƯỚC XOAY", "MOVES"], "status.steps": ["BƯỚC", "STEPS"], "status.ok": ["ĐÃ XONG", "DONE"],
  "check.title": ["Kiểm tra lời giải", "Solution check"],
  "check.oll": ["Các bước mặt trên", "Top-face cases"], "check.pll": ["Các bước cuối", "Final-step cases"],
  "check.turns": ["Mọi hướng xoay", "All turn directions"],
  "simple.note": ["Mọi xử lý diễn ra trên thiết bị của bạn.", "Everything runs on your device."],
};

const Context = createContext<{ language: Language; setLanguage: (value: Language) => void; t: (key: string) => string }>({
  language: "vi", setLanguage: () => undefined, t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("cfop-language") as Language) || "vi");
  const value = useMemo(() => ({ language, setLanguage: (next: Language) => { localStorage.setItem("cfop-language", next); setLanguage(next); }, t: (key: string) => words[key]?.[language === "vi" ? 0 : 1] ?? key }), [language]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLanguage() { return useContext(Context); }

export function simplePhase(name: string, language: Language) {
  const values: Record<string, [string, string]> = {
    cross: ["Tạo dấu cộng", "Make the cross"],
    f2l_FR: ["Xong góc đầu", "Finish first corner"], f2l_FL: ["Xong góc thứ hai", "Finish second corner"],
    f2l_BL: ["Xong góc thứ ba", "Finish third corner"], f2l_BR: ["Xong mặt đầu", "Finish first layer"],
    oll: ["Đưa mặt trên cùng màu", "Make the top one color"], pll: ["Đặt đúng các mảnh cuối", "Place the final pieces"],
  };
  return values[name]?.[language === "vi" ? 0 : 1] ?? name;
}
