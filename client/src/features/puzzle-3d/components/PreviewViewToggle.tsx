import { PillBar, PillGroup } from "@/components/ui/DesignSystem";
import { BoxIcon, Grid } from "@/components/ui/Icon";
import type { PreviewView } from "../lib/previewView";

export function PreviewViewToggle({
  value,
  onChange,
  language,
}: {
  value: PreviewView;
  onChange: (view: PreviewView) => void;
  language: "vi" | "en";
}) {
  return (
    <PillBar variant="soft" className="absolute left-3 top-3 z-10 bg-surface">
      <PillGroup<PreviewView>
        size="sm"
        label={language === "vi" ? "Kiểu hiển thị" : "Display mode"}
        value={value}
        onChange={onChange}
        options={[
          { value: "3d", label: "3D", icon: <BoxIcon aria-hidden="true" /> },
          { value: "2d", label: "2D", icon: <Grid aria-hidden="true" /> },
        ]}
      />
    </PillBar>
  );
}
