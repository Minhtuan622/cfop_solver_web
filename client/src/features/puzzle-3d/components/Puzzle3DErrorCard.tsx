import { Button } from "@/components/ui/Button";
import { BoxSeam } from "@/components/ui/Icon";

/** Thẻ báo không dựng được mô hình 3D/2D, kèm nút "Thử lại". */
export function Puzzle3DErrorCard({
  label,
  modelLabel,
  language,
  onRetry,
}: {
  label: string;
  /** "2D" hoặc "3D". */
  modelLabel: string;
  language: "vi" | "en";
  onRetry: () => void;
}) {
  return (
    <div className="rounded-card bg-surface p-5 sm:p-6 h-full flex flex-col items-center justify-center text-center">
      <BoxSeam className="text-4xl text-muted mb-4" />
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-sm text-muted mb-3">
        {language === "vi"
          ? `Không thể tạo mô hình ${modelLabel} cho scramble này.`
          : `The ${modelLabel} model could not be created for this scramble.`}
      </p>
      <Button
        variant="outline"
        size="xs"
        onClick={onRetry}
      >
        {language === "vi" ? "Thử lại" : "Try again"}
      </Button>
    </div>
  );
}
