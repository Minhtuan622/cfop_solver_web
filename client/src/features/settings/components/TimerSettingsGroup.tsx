import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard, Switch } from "@/components/ui/StudioUI";

/** The preferences of the timer: the inspection sound, the Cross highlight and the speed splits. */
export function TimerSettingsGroup({
  sound,
  splits,
  highlight,
  scrambleSize,
  onSoundChange,
  onSplitsChange,
  onHighlightChange,
  onScrambleSizeChange,
}: {
  sound: boolean;
  splits: boolean;
  highlight: boolean;
  scrambleSize: "sm" | "md" | "lg";
  onSoundChange: (next: boolean) => void;
  onSplitsChange: (next: boolean) => void;
  onHighlightChange: (next: boolean) => void;
  onScrambleSizeChange: (next: "sm" | "md" | "lg") => void;
}) {
  const { language, t } = useLanguage();

  return (
    <SectionCard
      title={t("settings.group.timer")}
      description={t("settings.group.timerHelp")}
    >
      <div className="flex flex-col gap-4">
        <Switch
          id="setting-sound"
          checked={sound}
          onChange={onSoundChange}
          label={t("settings.sound")}
          help={t("settings.soundHelp")}
        />
        <Switch
          id="setting-highlight"
          checked={highlight}
          onChange={onHighlightChange}
          label={t("settings.highlight")}
          help={t("settings.highlightHelp")}
        />
        <Switch
          id="setting-splits"
          checked={splits}
          onChange={onSplitsChange}
          label={t("settings.splits")}
          help={t("settings.splitsHelp")}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            {language === "vi" ? "Cỡ scramble" : "Scramble size"}
          </span>
          <select
            value={scrambleSize}
            onChange={event =>
              onScrambleSizeChange(event.target.value as "sm" | "md" | "lg")
            }
            className="rounded-field bg-surface px-3.5 py-2.5 text-sm text-ink"
          >
            <option value="sm">{language === "vi" ? "Nhỏ" : "Small"}</option>
            <option value="md">{language === "vi" ? "Vừa" : "Medium"}</option>
            <option value="lg">{language === "vi" ? "Lớn" : "Large"}</option>
          </select>
        </label>
      </div>
    </SectionCard>
  );
}
