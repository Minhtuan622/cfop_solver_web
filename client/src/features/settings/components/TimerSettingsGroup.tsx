import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard, Switch } from "@/components/ui/StudioUI";

/** The preferences of the timer: the inspection sound, the Cross highlight and the speed splits. */
export function TimerSettingsGroup({
  sound,
  splits,
  highlight,
  onSoundChange,
  onSplitsChange,
  onHighlightChange,
}: {
  sound: boolean;
  splits: boolean;
  highlight: boolean;
  onSoundChange: (next: boolean) => void;
  onSplitsChange: (next: boolean) => void;
  onHighlightChange: (next: boolean) => void;
}) {
  const { t } = useLanguage();

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
      </div>
    </SectionCard>
  );
}
