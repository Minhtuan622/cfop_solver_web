import { useLanguage } from "@/contexts/LanguageContext";
import { Info } from "@/components/ui/Icon";
import { SectionCard, Switch } from "@/components/ui/StudioUI";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import type { SolverSettings } from "@/lib/appSettings";
import type { F2LSlot } from "../lib/useSettingsState";

const COLORS: {
  value: SolverSettings["crossColor"];
  hex: string;
  labelKey: string;
}[] = [
  { value: "U", hex: CUBE_COLORS.U, labelKey: "settings.color.white" },
  { value: "D", hex: CUBE_COLORS.D, labelKey: "settings.color.yellow" },
  { value: "F", hex: CUBE_COLORS.F, labelKey: "settings.color.green" },
  { value: "B", hex: CUBE_COLORS.B, labelKey: "settings.color.blue" },
  { value: "R", hex: CUBE_COLORS.R, labelKey: "settings.color.red" },
  { value: "L", hex: CUBE_COLORS.L, labelKey: "settings.color.orange" },
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
              <button
                key={color.value}
                type="button"
                role="radio"
                aria-checked={solver.crossColor === color.value}
                onClick={() => onChange({ crossColor: color.value })}
                className={
                  solver.crossColor === color.value
                    ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover p-1"
                    : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 p-1"
                }
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
              </button>
            ))}
          </div>
          <p className="text-sm text-muted mb-0 mt-2">
            {t("settings.crossColorHint")}
          </p>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-ink"
            htmlFor="setting-opening"
          >
            {t("settings.opening")}
          </label>
          <select
            id="setting-opening"
            value={solver.opening}
            onChange={event =>
              onChange({
                opening: event.target.value as SolverSettings["opening"],
              })
            }
            className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {openingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted mb-0 mt-2">
            {t("settings.openingHint")}
          </p>
        </div>

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
                  max="10"
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
                  max="50000"
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
                <button
                  type="button"
                  onClick={() => onChange({ preferredSlot: undefined })}
                  className={
                    !solver.preferredSlot
                      ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
                      : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
                  }
                >
                  {t("settings.auto")}
                </button>
                {SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    disabled={solver.excludedSlots.includes(slot)}
                    onClick={() =>
                      onChange({
                        preferredSlot:
                          solver.preferredSlot === slot ? undefined : slot,
                      })
                    }
                    className={
                      solver.preferredSlot === slot
                        ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
                        : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
                    }
                  >
                    {slot}
                  </button>
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
                  <button
                    key={`exclude-${slot}`}
                    type="button"
                    onClick={() => onToggleExcluded(slot)}
                    className={
                      solver.excludedSlots.includes(slot)
                        ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-danger text-white shadow-sm hover:brightness-95"
                        : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
                    }
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-ink"
            htmlFor="setting-last-layer"
          >
            {t("settings.lastLayer")}
          </label>
          <select
            id="setting-last-layer"
            value={solver.lastLayer}
            onChange={event =>
              onChange({
                lastLayer: event.target.value as SolverSettings["lastLayer"],
              })
            }
            className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {lastLayerOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted mb-0 mt-2">
            {t("settings.lastLayerHint")}
          </p>
        </div>

        <details className="rounded-card border border-line/70 bg-surface-2/60 text-sm text-muted">
          <summary className="cursor-pointer rounded-t-card border-b border-line/70 px-4 py-3 font-semibold text-ink first:rounded-t-card [&::-webkit-details-marker]:hidden">
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
