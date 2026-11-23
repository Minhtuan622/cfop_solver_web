import { useState, type ReactNode } from "react";
import { ChevronUp, ListUl } from "@/components/ui/Icon";
import { PanelHeader, RoundButton, Surface } from "@/components/ui/DesignSystem";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Cột phải của trang Giải Rubik: tiêu đề "Lời giải" có nút thu gọn, bên trong
 * là báo cáo CFOP/BLD (truyền vào `children`) hoặc trạng thái chưa có lời giải.
 */
export function SolverSolutionSidebar({ children }: { children?: ReactNode }) {
  const { t } = useLanguage();
  const [solutionOpen, setSolutionOpen] = useState(true);
  return (
    <aside className="col-span-12 xl:col-span-4">
      <Surface
        className="p-4 lg:p-6 xl:sticky"
        style={{ top: "6rem" }}
        aria-label={t("home.solutionTitle")}
      >
        <PanelHeader
          className="mb-4"
          icon={<ListUl />}
          title={t("home.solutionTitle")}
          actions={
            <RoundButton
              tone="plain"
              size="sm"
              label={t("home.toggleSolution")}
              aria-expanded={solutionOpen}
              onClick={() => setSolutionOpen(open => !open)}
              icon={
                <ChevronUp
                  style={{
                    transform: solutionOpen ? "none" : "rotate(180deg)",
                    transition: "transform .15s",
                  }}
                />
              }
            />
          }
        />
        {solutionOpen ? (
          <>
            {children ?? (
              <div className="rounded-2xl bg-surface-2 p-6 text-center text-muted">
                <p className="font-semibold mb-0">
                  {t("home.noSolutionYet")}
                </p>
              </div>
            )}
          </>
        ) : null}
      </Surface>
    </aside>
  );
}
