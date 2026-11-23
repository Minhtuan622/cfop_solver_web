import { ChevronDown } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { PlayKeyMap } from "./PlayKeyMap";

/** Thẻ gập chứa bảng phím của trang Chơi. */
export function PlayKeysPanel({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card bg-surface p-5 sm:p-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-panel text-left text-base font-semibold tracking-tight text-ink focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        {t("play.keysTitle")}
        <ChevronDown
          className={cn("text-lg text-muted transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="mt-4">
          <PlayKeyMap />
        </div>
      ) : null}
    </div>
  );
}
