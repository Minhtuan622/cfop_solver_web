/* Tailwind-only Study support: evidence-linked, beginner-friendly 3-Style practice tips. */
import { useState } from "react";
import { BoxArrowRight } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
type LearningTip = {
  titleVi: string;
  titleEn: string;
  bodyVi: string;
  bodyEn: string;
  practiceVi: string;
  practiceEn: string;
};

const tips: LearningTip[] = [
  {
    titleVi: "Hiểu nhịp setup → tác động → hoàn tác",
    titleEn: "Understand setup → action → undo",
    bodyVi:
      "Đừng cố thuộc cả catalog ngay. Với mỗi case, gọi tên hai target, đưa chúng vào vị trí thuận lợi, thực hiện commutator rồi hoàn tác setup.",
    bodyEn:
      "Do not try to memorize the whole catalog at once. Name the two targets, set them up to a friendly position, execute the commutator, then undo the setup.",
    practiceVi: "Xem Cube 3D một lần chậm trước khi thử target scramble.",
    practiceEn:
      "Watch the 3D Cube slowly once before attempting the target scramble.",
  },
  {
    titleVi: "Ghi góc bằng hình, cạnh bằng nhịp",
    titleEn: "Use images for corners, rhythm for edges",
    bodyVi:
      "Dùng hình ảnh lạ hoặc câu chuyện ngắn cho cặp chữ góc. Với cạnh, thử từ ngắn và lặp theo nhịp âm thanh nếu cách đó dễ giữ hơn.",
    bodyEn:
      "Use unusual images or a short story for corner letter pairs. For edges, try short words repeated as a sound rhythm when that is easier to retain.",
    practiceVi:
      "Giữ một liên tưởng cố định cho từng cặp chữ trong ít nhất một tuần.",
    practiceEn:
      "Keep one fixed association for each letter pair for at least one week.",
  },
  {
    titleVi: "Giữ một thứ tự memo cố định",
    titleEn: "Keep one consistent memo order",
    bodyVi:
      "Một gợi ý phổ biến là memo góc → memo cạnh → thực hiện cạnh → thực hiện góc. Đây không phải luật bắt buộc; chọn thứ tự giúp bạn ít quên hơn.",
    bodyEn:
      "A common suggestion is corners memo → edges memo → edges execution → corners execution. It is not mandatory; use the order that makes you forget less.",
    practiceVi: "Ghi lại thứ tự đã dùng bên cạnh lần drill đầu tiên.",
    practiceEn: "Write down the order used beside your first drill attempt.",
  },
  {
    titleVi: "Chọn cycle mới dễ gọi lại",
    titleEn: "Start a new cycle where recall is easy",
    bodyVi:
      "Khi một cycle kết thúc, ưu tiên target có setup ngắn hoặc một setup bạn quen tay. Điều này giúp việc khôi phục memo ít bị ngắt quãng.",
    bodyEn:
      "When a cycle ends, prefer a target with a short setup or a setup you already know well. This makes memo recovery less disruptive.",
    practiceVi:
      "Trong lần học đầu, ưu tiên case có setup đơn giản thay vì case dài nhất.",
    practiceEn:
      "For a first session, choose a case with a simple setup instead of the longest case.",
  },
  {
    titleVi: "Chấm đúng trước, tăng tốc sau",
    titleEn: "Score accuracy first, speed up later",
    bodyVi:
      "Làm chậm và hoàn thành đúng nhiều lần trước khi rút ngắn thời gian. Khi sai, quay lại một lần với Cube 3D rồi đánh dấu chưa nhớ để SRS đưa case trở lại.",
    bodyEn:
      "Move slowly and finish correctly many times before shortening the time. When you miss, revisit the 3D Cube once, then mark not remembered so SRS brings the case back.",
    practiceVi:
      "Dùng self-check AUF năm lần; chỉ tăng nhịp khi cả năm lần đều về solved.",
    practiceEn:
      "Use the AUF self-check five times; raise the pace only when all five return to solved.",
  },
];

const sources = [
  {
    label: "J Perm · 3×3 Blindfolded: 3-Style Method Tutorial",
    href: "https://www.youtube.com/watch?v=9KPqwwKNldc",
    noteVi: "Buffer, commutator, setup/undo và parity.",
    noteEn: "Buffer, commutators, setup/undo, and parity.",
  },
  {
    label: "GuardCube · 10 Tips for Faster & Easier Memo",
    href: "https://www.youtube.com/watch?v=CFzIemRwwqI",
    noteVi: "Hình ảnh góc, nhịp cạnh và thói quen memo.",
    noteEn: "Corner imagery, edge rhythm, and memo habits.",
  },
  {
    label: "SpeedSolving · Intuitive 3-Style as a Beginner Blind Method",
    href: "https://www.speedsolving.com/threads/intuitive-3-style-as-a-beginner-blind-method.77200/",
    noteVi: "Trao đổi cộng đồng về memo và độ chính xác.",
    noteEn: "Community discussion of memo and accuracy.",
  },
];

export function BldLearningTips({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="rounded-xl mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4">
        <div>
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            {vi
              ? "MẸO HỌC · NGUỒN CỘNG ĐỒNG"
              : "LEARNING TIPS · COMMUNITY SOURCES"}
          </p>
          <h4 className="text-sm font-semibold tracking-tight mb-0">
            {vi
              ? "Năm nhịp luyện 3-Style dễ áp dụng"
              : "Five practical 3-Style practice rhythms"}
          </h4>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setExpanded(value => !value)}
        >
          {expanded
            ? vi
              ? "Thu gọn"
              : "Collapse"
            : vi
              ? "Xem mẹo"
              : "View tips"}
        </Button>
      </div>
      {expanded && (
        <div className="border-t p-4">
          <p className="text-sm text-muted">
            {vi
              ? "Các mẹo này là gợi ý thực hành từ tutorial và cộng đồng 3BLD. Giữ cách giúp bạn giải đúng; không cần đổi hệ memo chỉ vì người khác dùng nhanh hơn."
              : "These are practice suggestions from 3BLD tutorials and community discussion. Keep what helps you solve accurately; do not switch memo systems only because somebody else is faster."}
          </p>
          <div className="grid grid-cols-12 gap-2">
            {tips.map((tip, index) => (
              <article className="col-span-12 md:col-span-6" key={tip.titleVi}>
                <div className="rounded-xl p-4 bg-surface-2 h-full">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                      {index + 1}
                    </span>
                    <div>
                      <h5 className="text-sm font-semibold tracking-tight mb-1">
                        {vi ? tip.titleVi : tip.titleEn}
                      </h5>
                      <p className="text-sm mb-2">
                        {vi ? tip.bodyVi : tip.bodyEn}
                      </p>
                      <p className="text-sm text-muted mb-0">
                        <strong>{vi ? "Thử ngay:" : "Try now:"}</strong>{" "}
                        {vi ? tip.practiceVi : tip.practiceEn}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="border-t mt-4 pt-4">
            <SourceList language={language} />
          </div>
        </div>
      )}
    </section>
  );
}

function SourceList({ language }: { language: "vi" | "en" }) {
  const vi = language === "vi";
  return (
    <div>
      <p className="text-sm font-semibold mb-2">
        {vi ? "Video và bài đọc tham khảo" : "Referenced videos and reading"}
      </p>
      <div className="divide-y divide-line bg-transparent">
        {sources.map(source => (
          <a
            className="block px-4 py-3 text-sm transition-colors hover:bg-surface-2 px-0"
            href={source.href}
            target="_blank"
            rel="noreferrer"
            key={source.href}
          >
            <span className="flex items-center gap-2">
              <BoxArrowRight />
              <span>
                <strong className="block text-sm">{source.label}</strong>
                <span className="text-sm text-muted">
                  {vi ? source.noteVi : source.noteEn}
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
