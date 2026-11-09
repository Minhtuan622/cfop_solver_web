/* Tailwind-only Study checklist: persistent, explicit completion state for the five BLD stages. */
import type { BldLearningPathProgress } from "@/features/bld";

type Item = {
  key:
    | "orientationDone"
    | "sightedDone"
    | "memoDone"
    | "selfCheckDone"
    | "reviewDone";
  vi: string;
  en: string;
};
const items: Item[] = [
  {
    key: "orientationDone",
    vi: "Tôi hiểu buffer, cycle và ba nhịp của một lượt BLD.",
    en: "I understand the buffer, cycle, and three beats of a BLD solve.",
  },
  {
    key: "sightedDone",
    vi: "Tôi đã chạy một commutator mở mắt từ đầu đến cuối.",
    en: "I have run one sighted commutator from start to finish.",
  },
  {
    key: "memoDone",
    vi: "Tôi đã tạo và đọc lại một dòng memo cạnh/góc.",
    en: "I have created and recalled one edge/corner memo line.",
  },
  {
    key: "selfCheckDone",
    vi: "Tôi đã tự kiểm target AUF hoặc một special case.",
    en: "I have self-checked an AUF target or one special case.",
  },
  {
    key: "reviewDone",
    vi: "Tôi đã hoàn thành một lượt ôn và tự chấm trong SRS.",
    en: "I have completed one review and self-grade in SRS.",
  },
];

export function BldStageChecklist({
  path,
  onPath,
  language,
}: {
  path: BldLearningPathProgress;
  onPath: (next: BldLearningPathProgress) => void;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const done = items.filter(item => path[item.key]).length;
  return (
    <section className="border border-line rounded-xl p-4 mb-6 bg-surface-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            {vi ? "CHECKLIST LỘ TRÌNH" : "PATH CHECKLIST"}
          </p>
          <h3 className="text-sm font-semibold tracking-tight mb-0">
            {vi
              ? "Đánh dấu việc bạn đã thực hiện."
              : "Mark what you have completed."}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
          {done}/5
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-3 mt-4"
        aria-label={vi ? "Tiến độ checklist BLD" : "BLD checklist progress"}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${done * 20}%` }}
        />
      </div>
      <div className="grid grid-cols-12 gap-2 mt-1">
        {items.map((item, index) => (
          <div className="col-span-12 md:col-span-6" key={item.key}>
            <label className="border border-line rounded-xl p-2 flex items-start gap-2 w-full bg-surface">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line accent-primary mt-1"
                checked={path[item.key]}
                onChange={event =>
                  onPath({ ...path, [item.key]: event.target.checked })
                }
              />
              <span>
                <strong className="text-sm block">
                  {index + 1}.{" "}
                  {vi
                    ? [
                        "Bắt đầu",
                        "Một case",
                        "Memo có nhìn",
                        "Củng cố",
                        "Ôn và mở rộng",
                      ][index]
                    : [
                        "Start",
                        "One case",
                        "Sighted memo",
                        "Consolidate",
                        "Review and grow",
                      ][index]}
                </strong>
                <span className="text-sm text-muted">
                  {vi ? item.vi : item.en}
                </span>
              </span>
            </label>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted mt-4 mb-0">
        {vi
          ? "Checklist theo dõi tiến độ học; SRS chỉ cập nhật khi bạn tự chấm case."
          : "The checklist tracks progress; SRS updates only when you self-grade a case."}
      </p>
    </section>
  );
}
