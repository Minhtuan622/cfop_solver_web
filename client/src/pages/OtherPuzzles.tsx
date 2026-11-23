import { PageHeader } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { OtherPuzzleSolver } from "@/features/puzzle-solver";

/** Trang giải 2×2×2, Pyraminx và Skewb bằng bộ giải riêng. */
export default function OtherPuzzles() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={t("otherPuzzles.eyebrow")}
        title={t("otherPuzzles.title")}
        description={t("otherPuzzles.subtitle")}
      />
      <OtherPuzzleSolver />
    </div>
  );
}
