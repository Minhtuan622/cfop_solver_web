import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard, Switch } from "@/components/ui/StudioUI";

/** The preferences of the timer: the inspection sound, the Cross highlight and the speed splits. */
export function TimerSettingsGroup({
  sound,
  voice,
  metronome,
  metronomeBpm,
  splits,
  highlight,
  scrambleSize,
  onSoundChange,
  onVoiceChange,
  onMetronomeChange,
  onMetronomeBpmChange,
  onSplitsChange,
  onHighlightChange,
  onScrambleSizeChange,
}: {
  sound: boolean;
  voice: boolean;
  metronome: boolean;
  metronomeBpm: number;
  splits: boolean;
  highlight: boolean;
  scrambleSize: "sm" | "md" | "lg";
  onSoundChange: (next: boolean) => void;
  onVoiceChange: (next: boolean) => void;
  onMetronomeChange: (next: boolean) => void;
  onMetronomeBpmChange: (next: number) => void;
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
          id="setting-voice"
          checked={voice}
          onChange={onVoiceChange}
          label={t("settings.voice")}
          help={t("settings.voiceHelp")}
        />
        <Switch
          id="setting-metronome"
          checked={metronome}
          onChange={onMetronomeChange}
          label={t("settings.metronome")}
          help={t("settings.metronomeHelp")}
        />
        <label className="flex flex-col gap-1.5">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-ink">
            {t("settings.metronomeBpm")}
            <strong className="tabular-nums">{metronomeBpm}</strong>
          </span>
          <input
            type="range"
            min={30}
            max={240}
            step={5}
            value={metronomeBpm}
            disabled={!metronome}
            onChange={event => onMetronomeBpmChange(Number(event.target.value))}
            aria-label={t("settings.metronomeBpm")}
            className="h-2 w-full appearance-none rounded-full bg-surface-3 accent-primary disabled:opacity-40"
          />
        </label>
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
