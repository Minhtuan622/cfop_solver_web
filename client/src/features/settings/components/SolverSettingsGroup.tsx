import { SettingRow } from "./SettingRow";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronRight, Info } from "@/components/ui/Icon";
import { SectionCard, Switch } from "@/components/ui/StudioUI";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import type { SolverSettings } from "@/lib/appSettings";
import type { F2LSlot } from "../lib/useSettingsState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";

const COLORS: {
  value: SolverSettings["crossColor"];
  hex: string;
  labelKey: string;
}[] = [
  { value: "U", hex: CUBE_COLORS.U, labelKey: "settings.color.yellow" },
  { value: "D", hex: CUBE_COLORS.D, labelKey: "settings.color.white" },
  { value: "F", hex: CUBE_COLORS.F, labelKey: "settings.color.green" },
  { value: "B", hex: CUBE_COLORS.B, labelKey: "settings.color.blue" },
  { value: "R", hex: CUBE_COLORS.R, labelKey: "settings.color.orange" },
  { value: "L", hex: CUBE_COLORS.L, labelKey: "settings.color.red" },
];

const SLOTS: F2LSlot[] = ["FR", "FL", "BL", "BR"];

/** The defaults of the CFOP solver: the Cross color, the opening and the last layer. */
export function SolverSettingsGroup({
  solver,
  onChange,
  onToggleExcluded,
}: {
  solver: SolverSettings;
  onChange: (next: Partial<SolverSettings>) => void;
  onToggleExcluded: (slot: F2LSlot) => void;
}) {
  const { t } = useLanguage();

  const openingOptions: { value: SolverSettings["opening"]; label: string }[] =
    [
      { value: "cross", label: t("settings.opening.cross") },
      { value: "auto", label: t("settings.opening.auto") },
      { value: "xcross", label: t("settings.opening.xcross") },
      { value: "xxcross", label: t("settings.opening.xxcross") },
      { value: "xxxcross", label: t("settings.opening.xxxcross") },
      { value: "xxxxcross", label: t("settings.opening.xxxxcross") },
    ];
  const lastLayerOptions: {
    value: SolverSettings["lastLayer"];
    label: string;
  }[] = [
    { value: "auto", label: t("settings.lastLayer.auto") },
    { value: "oll_pll", label: t("settings.lastLayer.ollpll") },
    { value: "zbll", label: t("settings.lastLayer.zbll") },
    { value: "1lll", label: t("settings.lastLayer.oneLll") },
  ];

  return (
    <SectionCard
      title={t("settings.group.solver")}
      description={t("settings.group.solverHelp")}
    >
      <div className="flex flex-col gap-6">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {t("settings.crossColor")}
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={t("settings.crossColor")}
          >
            {COLORS.map(color => (
              <Button
                variant={
                  solver.crossColor === color.value ? "primary" : "soft"
                }
                size="md"
                className="p-1"
                key={color.value}
                type="button"
                role="radio"
                aria-checked={solver.crossColor === color.value}
                onClick={() => onChange({ crossColor: color.value })}

                title={t(color.labelKey)}
                aria-label={t(color.labelKey)}
              >
                <span
                  className="block rounded-xl"
                  style={{
                    backgroundColor: color.hex,
                    width: "1.5rem",
                    height: "1.5rem",
                  }}
                />
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted mb-0 mt-2">
            {t("settings.crossColorHint")}
          </p>
        </div>

        <SettingRow
          label={t("settings.opening")}
          help={t("settings.openingHint")}
          htmlFor="setting-opening"
        >
          <Select
            id="setting-opening"
            className="w-full sm:w-72"
            value={solver.opening}
            onChange={event =>
              onChange({
                opening: event.target.value as SolverSettings["opening"],
              })
            }
          >
            {openingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </SettingRow>

        {solver.opening !== "cross" ? (
          <>
            <div className="grid grid-cols-12 gap-4">
              <label className="col-span-12 md:col-span-6">
                <span className="mb-1.5 block text-sm font-medium text-ink flex justify-between">
                  {t("settings.openingDepth")}
                  <strong>{solver.openingDepth}</strong>
                </span>
                <input
                  aria-label={t("settings.openingDepth")}
                  type="range"
                  min="4"
                  max="12"
                  step="1"
                  value={solver.openingDepth}
                  onChange={event =>
                    onChange({ openingDepth: Number(event.target.value) })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
                />
                <small className="text-muted">
                  {t("settings.openingDepthHint")}
                </small>
              </label>
              <label className="col-span-12 md:col-span-6">
                <span className="mb-1.5 block text-sm font-medium text-ink flex justify-between">
                  {t("settings.nodeBudget")}
                  <strong>{solver.directNodeBudget.toLocaleString()}</strong>
                </span>
                <input
                  aria-label={t("settings.nodeBudget")}
                  type="range"
                  min="500"
                  max="2000000"
                  step="500"
                  value={solver.directNodeBudget}
                  onChange={event =>
                    onChange({ directNodeBudget: Number(event.target.value) })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
                />
                <small className="text-muted">
                  {t("settings.nodeBudgetHint")}
                </small>
              </label>
            </div>
            <Switch
              id="setting-direct-only"
              checked={solver.openingFindResult}
              onChange={openingFindResult => onChange({ openingFindResult })}
              label={t("settings.directOnly")}
              help={t("settings.directOnlyHelp")}
            />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("settings.preferredSlot")}
              </span>
              <div
                className="inline-flex flex-wrap items-center gap-1 w-full"
                role="group"
              >
                <Button
                  variant={!solver.preferredSlot ? "primary" : "soft"}
                  size="md"
                  type="button"
                  onClick={() => onChange({ preferredSlot: undefined })}
                >
                  {t("settings.auto")}
                </Button>
                {SLOTS.map(slot => (
                  <Button
                    variant={
                      solver.preferredSlot === slot ? "primary" : "soft"
                    }
                    size="md"
                    key={slot}
                    type="button"
                    disabled={solver.excludedSlots.includes(slot)}
                    onClick={() =>
                      onChange({
                        preferredSlot:
                          solver.preferredSlot === slot ? undefined : slot,
                      })
                    }
                  >
                    {slot}
                  </Button>
                ))}
              </div>
              <span className="mb-1.5 block text-sm font-medium text-ink mt-4">
                {t("settings.excludeSlots")}
              </span>
              <div
                className="inline-flex flex-wrap items-center gap-1 w-full"
                role="group"
              >
                {SLOTS.map(slot => (
                  <Button
                    variant={
                      solver.excludedSlots.includes(slot)
                        ? "dangerSolid"
                        : "soft"
                    }
                    size="md"
                    key={`exclude-${slot}`}
                    type="button"
                    onClick={() => onToggleExcluded(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <SettingRow
          label={t("settings.lastLayer")}
          help={t("settings.lastLayerHint")}
          htmlFor="setting-last-layer"
        >
          <Select
            id="setting-last-layer"
            className="w-full sm:w-72"
            value={solver.lastLayer}
            onChange={event =>
              onChange({
                lastLayer: event.target.value as SolverSettings["lastLayer"],
              })
            }
          >
            {lastLayerOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </SettingRow>

        <details className="group rounded-panel bg-surface-2 text-sm text-muted">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight
              aria-hidden="true"
              className="text-base text-muted transition-transform group-open:rotate-90"
            />
            {t("settings.directNote")}
          </summary>
          <p className="mb-0 mt-2 px-4 py-3">
            <Info className="text-base mr-1" />
            {t("settings.directNoteDetail")}
          </p>
        </details>
      </div>
    </SectionCard>
  );
}
