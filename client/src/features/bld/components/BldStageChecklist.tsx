/* Bootstrap-only Study checklist: persistent, explicit completion state for the five BLD stages. */
import type { BldLearningPathProgress } from "@/features/bldLearningPath";

type Item = { key: "orientationDone" | "sightedDone" | "memoDone" | "selfCheckDone" | "reviewDone"; vi: string; en: string };
const items: Item[] = [
  { key: "orientationDone", vi: "Tôi hiểu buffer, cycle và ba nhịp của một lượt BLD.", en: "I understand the buffer, cycle, and three beats of a BLD solve." },
  { key: "sightedDone", vi: "Tôi đã chạy một commutator mở mắt từ đầu đến cuối.", en: "I have run one sighted commutator from start to finish." },
  { key: "memoDone", vi: "Tôi đã tạo và đọc lại một dòng memo cạnh/góc.", en: "I have created and recalled one edge/corner memo line." },
  { key: "selfCheckDone", vi: "Tôi đã tự kiểm target AUF hoặc một special case.", en: "I have self-checked an AUF target or one special case." },
  { key: "reviewDone", vi: "Tôi đã hoàn thành một lượt ôn và tự chấm trong SRS.", en: "I have completed one review and self-grade in SRS." },
];

export function BldStageChecklist({ path, onPath, language }: { path: BldLearningPathProgress; onPath: (next: BldLearningPathProgress) => void; language: "vi" | "en" }) {
  const vi = language === "vi";
  const done = items.filter((item) => path[item.key]).length;
  return <section className="border rounded p-3 mb-4 bg-body-tertiary">
    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
      <div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "CHECKLIST LỘ TRÌNH" : "PATH CHECKLIST"}</p><h3 className="h6 mb-0">{vi ? "Đánh dấu việc bạn đã thực hiện." : "Mark what you have completed."}</h3></div>
      <span className="badge text-bg-secondary">{done}/5</span>
    </div>
    <div className="progress mt-3" aria-label={vi ? "Tiến độ checklist BLD" : "BLD checklist progress"}><div className="progress-bar" style={{ width: `${done * 20}%` }} /></div>
    <div className="row g-2 mt-1">
      {items.map((item, index) => <div className="col-12 col-md-6" key={item.key}><label className="border rounded p-2 d-flex align-items-start gap-2 w-100 bg-body"><input type="checkbox" className="form-check-input mt-1" checked={path[item.key]} onChange={(event) => onPath({ ...path, [item.key]: event.target.checked })} /><span><strong className="small d-block">{index + 1}. {vi ? ["Bắt đầu", "Một case", "Memo có nhìn", "Củng cố", "Ôn và mở rộng"][index] : ["Start", "One case", "Sighted memo", "Consolidate", "Review and grow"][index]}</strong><span className="small text-body-secondary">{vi ? item.vi : item.en}</span></span></label></div>)}
    </div>
    <p className="small text-body-secondary mt-3 mb-0">{vi ? "Checklist theo dõi tiến độ học; SRS chỉ cập nhật khi bạn tự chấm case." : "The checklist tracks progress; SRS updates only when you self-grade a case."}</p>
  </section>;
}
