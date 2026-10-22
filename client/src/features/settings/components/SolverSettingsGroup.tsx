import { useLanguage } from "@/contexts/LanguageContext";
import { Info } from "@/components/ui/BootstrapIcon";
import { SectionCard, Switch } from "@/components/ui/BootstrapUI";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import type { SolverSettings } from "@/lib/appSettings";
import type { F2LSlot } from "../lib/useSettingsState";

const COLORS: { value: SolverSettings["crossColor"]; hex: string; labelKey: string }[] = [
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

  const openingOptions: { value: SolverSettings["opening"]; label: string }[] = [
    { value: "cross", label: t("settings.opening.cross") },
    { value: "auto", label: t("settings.opening.auto") },
    { value: "xxcross", label: t("settings.opening.xxcross") },
    { value: "xxxcross", label: t("settings.opening.xxxcross") },
    { value: "xxxxcross", label: t("settings.opening.xxxxcross") },
  ];
  const lastLayerOptions: { value: SolverSettings["lastLayer"]; label: string }[] = [
    { value: "auto", label: t("settings.lastLayer.auto") },
    { value: "oll_pll", label: t("settings.lastLayer.ollpll") },
    { value: "zbll", label: t("settings.lastLayer.zbll") },
    { value: "1lll", label: t("settings.lastLayer.oneLll") },
  ];

  return (
    <SectionCard title={t("settings.group.solver")} description={t("settings.group.solverHelp")}>
      <div className="vstack gap-4">
        <div>
          <span className="form-label d-block">{t("settings.crossColor")}</span>
          <div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label={t("settings.crossColor")}>
            {COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                role="radio"
                aria-checked={solver.crossColor === color.value}
                onClick={() => onChange({ crossColor: color.value })}
                className={solver.crossColor === color.value ? "btn btn-primary p-1" : "btn btn-outline-secondary p-1"}
                title={t(color.labelKey)}
                aria-label={t(color.labelKey)}
              >
                <span className="d-block rounded" style={{ backgroundColor: color.hex, width: "1.5rem", height: "1.5rem" }} />
              </button>
            ))}
          </div>
          <p className="small text-body-secondary mb-0 mt-2">{t("settings.crossColorHint")}</p>
        </div>

        <div>
          <label className="form-label" htmlFor="setting-opening">{t("settings.opening")}</label>
          <select id="setting-opening" value={solver.opening} onChange={event => onChange({ opening: event.target.value as SolverSettings["opening"] })} className="form-select">
            {openingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="small text-body-secondary mb-0 mt-2">{t("settings.openingHint")}</p>
        </div>

        {solver.opening !== "cross" ? (
          <>
            <div className="row g-3">
              <label className="col-12 col-md-6">
                <span className="form-label d-flex justify-content-between">{t("settings.openingDepth")}<strong>{solver.openingDepth}</strong></span>
                <input aria-label={t("settings.openingDepth")} type="range" min="4" max="10" step="1" value={solver.openingDepth} onChange={event => onChange({ openingDepth: Number(event.target.value) })} className="form-range" />
                <small className="text-body-secondary">{t("settings.openingDepthHint")}</small>
              </label>
              <label className="col-12 col-md-6">
                <span className="form-label d-flex justify-content-between">{t("settings.nodeBudget")}<strong>{solver.directNodeBudget.toLocaleString()}</strong></span>
                <input aria-label={t("settings.nodeBudget")} type="range" min="500" max="50000" step="500" value={solver.directNodeBudget} onChange={event => onChange({ directNodeBudget: Number(event.target.value) })} className="form-range" />
                <small className="text-body-secondary">{t("settings.nodeBudgetHint")}</small>
              </label>
            </div>
            <Switch id="setting-direct-only" checked={solver.openingFindResult} onChange={openingFindResult => onChange({ openingFindResult })} label={t("settings.directOnly")} help={t("settings.directOnlyHelp")} />
            <div>
              <span className="form-label d-block">{t("settings.preferredSlot")}</span>
              <div className="btn-group w-100" role="group">
                <button type="button" onClick={() => onChange({ preferredSlot: undefined })} className={!solver.preferredSlot ? "btn btn-primary" : "btn btn-outline-secondary"}>{t("settings.auto")}</button>
                {SLOTS.map(slot => (
                  <button key={slot} type="button" disabled={solver.excludedSlots.includes(slot)} onClick={() => onChange({ preferredSlot: solver.preferredSlot === slot ? undefined : slot })} className={solver.preferredSlot === slot ? "btn btn-primary" : "btn btn-outline-secondary"}>{slot}</button>
                ))}
              </div>
              <span className="form-label d-block mt-3">{t("settings.excludeSlots")}</span>
              <div className="btn-group w-100" role="group">
                {SLOTS.map(slot => (
                  <button key={`exclude-${slot}`} type="button" onClick={() => onToggleExcluded(slot)} className={solver.excludedSlots.includes(slot) ? "btn btn-danger" : "btn btn-outline-secondary"}>{slot}</button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div>
          <label className="form-label" htmlFor="setting-last-layer">{t("settings.lastLayer")}</label>
          <select id="setting-last-layer" value={solver.lastLayer} onChange={event => onChange({ lastLayer: event.target.value as SolverSettings["lastLayer"] })} className="form-select">
            {lastLayerOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="small text-body-secondary mb-0 mt-2">{t("settings.lastLayerHint")}</p>
        </div>

        <details className="cfop-settings-note small text-body-secondary">
          <summary className="fw-semibold">{t("settings.directNote")}</summary>
          <p className="mb-0 mt-2">
            <Info className="fs-6 me-1" />
            {t("settings.directNoteDetail")}
          </p>
        </details>
      </div>
    </SectionCard>
  );
}
