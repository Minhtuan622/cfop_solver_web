/**
 * Bàn nút xoay cho màn hình cảm ứng (không có bàn phím): 6 mặt thuận/ngược
 * và 3 phép xoay cả khối. Phẳng: nền nhạt, chỉ đổi nền khi hover/nhấn.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const FACE_ROWS = [
  ["U", "R", "F", "D", "L", "B"],
  ["U'", "R'", "F'", "D'", "L'", "B'"],
];
const ROTATIONS = ["x", "x'", "y", "y'", "z", "z'"];

export function PlayMovePad({
  onMove,
  disabled = false,
}: {
  onMove: (move: string, rotation: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const button = (move: string, rotation: boolean) => (
    <button
      key={move}
      type="button"
      disabled={disabled}
      // Không giữ focus sau khi chạm, để Space vẫn điều khiển khối.
      onPointerDown={event => event.preventDefault()}
      onClick={() => onMove(move, rotation)}
      aria-label={t("play.padMove", { move })}
      className={cn(
        "h-11 rounded-xl font-mono text-sm font-semibold transition-colors focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40",
        rotation
          ? "bg-surface-2 text-muted hover:bg-surface-3 hover:text-ink active:bg-surface-3"
          : "bg-primary-soft text-primary hover:bg-surface-3 active:bg-surface-3"
      )}
    >
      {move}
    </button>
  );
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={t("play.padLabel")}>
      {FACE_ROWS.map(row => (
        <div key={row[0]} className="grid grid-cols-6 gap-2">
          {row.map(move => button(move, false))}
        </div>
      ))}
      <div className="grid grid-cols-6 gap-2">
        {ROTATIONS.map(move => button(move, true))}
      </div>
    </div>
  );
}
