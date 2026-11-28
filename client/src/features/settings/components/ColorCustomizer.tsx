import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { normalizeHex } from "@/lib/colorScale";
import {
  COLOR_PRESETS,
  CUSTOM_COLOR_PRESET_ID,
  customColors,
  isDefaultColors,
  presetColors,
} from "@/lib/themeColors";

type ColorField = "primary" | "accent";

function HexField({
  field,
  value,
  onCommit,
}: {
  field: ColorField;
  value: string;
  onCommit: (field: ColorField, hex: string) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const label = t(`settings.colors.${field}`);
  const commitText = (text: string) => {
    setDraft(text);
    const hex = normalizeHex(text);
    if (hex && text.trim().replace("#", "").length === 6) onCommit(field, hex);
  };

  return (
    <div className="flex items-center gap-3">
      <Input
        type="color"
        aria-label={label}
        value={value}
        onChange={event => onCommit(field, event.target.value)}
        className="h-10 w-14 shrink-0 cursor-pointer p-1"
      />
      <div className="min-w-0">
        <p className="mb-1 text-sm font-medium text-ink">{label}</p>
        <Input
          type="text"
          aria-label={`${label} — ${t("settings.colors.hex")}`}
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={event => commitText(event.target.value)}
          onBlur={() => setDraft(value)}
          className="w-28 font-mono"
        />
      </div>
    </div>
  );
}

export function ColorCustomizer() {
  const { t } = useLanguage();
  const { colors, setColors, resetColors } = useTheme();

  const commit = (field: ColorField, hex: string) => {
    const next = customColors(
      field === "primary" ? hex : colors.primary,
      field === "accent" ? hex : colors.accent
    );
    if (next) setColors(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("settings.colors")}>
        {COLOR_PRESETS.map(preset => {
          const selected = colors.preset === preset.id;
          return (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={selected ? "primary" : "soft"}
              aria-pressed={selected}
              onClick={() => {
                const next = presetColors(preset.id);
                if (next) setColors(next);
              }}
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ backgroundColor: preset.primary }}
              />
              {t(`settings.colors.preset.${preset.id}`)}
            </Button>
          );
        })}
        {colors.preset === CUSTOM_COLOR_PRESET_ID ? (
          <Button type="button" size="sm" variant="primary" aria-pressed>
            {t("settings.colors.preset.custom")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <HexField field="primary" value={colors.primary} onCommit={commit} />
        <HexField field="accent" value={colors.accent} onCommit={commit} />
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label={t("settings.colors.preview")} role="group">
        <Button type="button" size="sm" variant="primary">
          {t("settings.colors.previewButton")}
        </Button>
        <Button type="button" size="sm" variant="outline">
          {t("settings.colors.previewOutline")}
        </Button>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          {t("settings.colors.previewChip")}
        </span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {t("settings.colors.previewChip")}
        </span>
      </div>

      {isDefaultColors(colors) ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="mb-0 text-xs text-muted">{t("settings.colors.adjusted")}</p>
          <Button type="button" size="sm" variant="ghost" onClick={resetColors}>
            {t("settings.colors.reset")}
          </Button>
        </div>
      )}
    </div>
  );
}
