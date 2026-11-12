/* Tailwind-only Study guide: one plain-language objective per beginner 3-Style stage. */
import { Button } from "@/components/ui/Button";
type Guide = {
  labelVi: string;
  labelEn: string;
  titleVi: string;
  titleEn: string;
  bodyVi: string;
  bodyEn: string;
  actionVi?: string;
  actionEn?: string;
};

const guides: Guide[] = [
  {
    labelVi: "BƯỚC ĐẦU",
    labelEn: "FIRST STEP",
    titleVi: "Chưa cần bịt mắt vội.",
    titleEn: "Do not blindfold yet.",
    bodyVi:
      "Trước hết, hiểu buffer là vị trí bắt đầu và cycle là đường các mảnh đi qua. Chỉ cần xem Cube 3D và gọi tên ba nhịp: nhìn → ghi → thực hiện.",
    bodyEn:
      "First, understand that the buffer is your starting position and a cycle is the path pieces follow. Watch the 3D Cube and name the three beats: inspect → memo → execute.",
  },
  {
    labelVi: "MỤC TIÊU HÔM NAY",
    labelEn: "TODAY'S GOAL",
    titleVi: "Chọn một case, không mở catalog lớn.",
    titleEn: "Choose one case; do not open the large catalog yet.",
    bodyVi:
      "Học nhịp setup → commutator → hoàn tác trên đúng một case. Làm chậm, xem minh họa, rồi dùng target AUF để kiểm tra lại.",
    bodyEn:
      "Learn the setup → commutator → undo rhythm on exactly one case. Go slowly, watch the demonstration, then verify with the AUF target.",
  },
  {
    labelVi: "LUYỆN CÓ NHÌN",
    labelEn: "SIGHTED PRACTICE",
    titleVi: "Viết memo trước, chạy khối sau.",
    titleEn: "Write the memo first; execute second.",
    bodyVi:
      "Tạo hai dòng cạnh/góc, đọc thành từ hoặc hình quen thuộc, rồi thực hiện khi vẫn nhìn khối. Bạn chỉ cần bịt mắt khi cách này đã ổn định.",
    bodyEn:
      "Build the two edge/corner lines, read them as familiar words or images, then execute while still looking at the cube. Blindfold only after this feels steady.",
  },
  {
    labelVi: "CỦNG CỐ",
    labelEn: "CONSOLIDATE",
    titleVi: "Tự kiểm case chính trước; special case là bài bổ sung.",
    titleEn: "Verify the main case first; special cases are an add-on.",
    bodyVi:
      "Hoàn thành target AUF vài lần trước khi luyện parity, flip hoặc twist bên dưới. Các case đặc biệt giúp mở rộng, nhưng không phải điều kiện để học 3-cycle đầu tiên.",
    bodyEn:
      "Complete the AUF target several times before practicing parity, flip, or twist below. Special cases expand your skill, but are not required for a first 3-cycle.",
    actionVi: "Quay lại Công thức",
    actionEn: "Return to algorithms",
  },
  {
    labelVi: "ÔN VÀ MỞ RỘNG",
    labelEn: "REVIEW AND EXPAND",
    titleVi: "Ôn case đã chắc, rồi mới thêm một case mới.",
    titleEn: "Review a reliable case, then add one new case.",
    bodyVi:
      "Dùng SRS để nhắc lại case từng quên. Khi target AUF và memo đều ổn, chọn thêm một case cùng nhóm hoặc mở thư viện đầy đủ để tra cứu có chủ đích.",
    bodyEn:
      "Use SRS to revisit cases you once forgot. When both AUF targets and memo are steady, add one case in the same group or browse the full library with a purpose.",
  },
];

export function BldBeginnerGuide({
  stage,
  language,
  onFormula,
}: {
  stage: number;
  language: "vi" | "en";
  onFormula: () => void;
}) {
  const vi = language === "vi";
  const guide = guides[Math.min(Math.max(stage, 0), guides.length - 1)];
  return (
    <div
      className="border-l border-line border-4 border-primary bg-surface-2 px-4 py-2 mb-6"
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            {guide.labelVi && (vi ? guide.labelVi : guide.labelEn)}
          </p>
          <strong className="block mb-1">
            {vi ? guide.titleVi : guide.titleEn}
          </strong>
          <span className="text-sm text-muted">
            {vi ? guide.bodyVi : guide.bodyEn}
          </span>
        </div>
        {guide.actionVi && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            type="button"
            onClick={onFormula}
          >
            {vi ? guide.actionVi : guide.actionEn}
          </Button>
        )}
      </div>
    </div>
  );
}
