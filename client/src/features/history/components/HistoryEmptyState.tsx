import { Link } from "wouter";
import { BarChart3, FileUp, Play } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";

export function HistoryEmptyState({
  onImportCstimer,
  onImportJson,
}: {
  onImportCstimer: () => void;
  onImportJson: () => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="rounded-card bg-surface p-5 sm:p-6">
      <EmptyState
        icon={<BarChart3 />}
        title={t("history.emptyTitle")}
        description={t("history.emptyDetail")}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/timer"
              className={`${buttonClass("primary", "sm")}`}
            >
              <Play className="text-base" />
              {t("history.openTimer")}
            </Link>
            <button
              type="button"
              onClick={onImportCstimer}
              className={`${buttonClass("secondary", "sm")}`}
            >
              <FileUp className="text-base" />
              {t("history.importCstimer")}
            </button>
            <button
              type="button"
              onClick={onImportJson}
              className={`${buttonClass("secondary", "sm")}`}
            >
              <FileUp className="text-base" />
              {t("history.importJson")}
            </button>
          </div>
        }
      />
    </section>
  );
}
