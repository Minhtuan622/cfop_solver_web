import { useLanguage } from "@/contexts/LanguageContext";
import { F2L_SLOTS } from "@/lib/solverPresentation";
import type { F2LSlot } from "@/lib/solverRuntime";
import { cn } from "@/lib/utils";
import { SolverDetails } from "./SolverDetails";

export type SolverF2LOptionsProps = {
  preferredSlot: F2LSlot | undefined;
  excludedSlots: F2LSlot[];
  onPreferredSlotChange: (slot: F2LSlot | undefined) => void;
  onExcludedSlotsChange: (slots: F2LSlot[]) => void;
};

/**
 * The F2L slot preferences. They only matter once the opening is wider than
 * a plain cross, so they stay folded away until they are needed.
 */
export function SolverF2LOptions({ preferredSlot, excludedSlots, onPreferredSlotChange, onExcludedSlotsChange }: SolverF2LOptionsProps) {
  const { t } = useLanguage();

  return (
    <SolverDetails summary={t("home.f2lSettings")}>
      <p className="small fw-semibold mb-2">{t("home.f2lPriority")}</p>
      <div className="btn-group w-100" role="group" aria-label={t("home.f2lPriority")}>
        <button type="button" aria-pressed={!preferredSlot} onClick={() => onPreferredSlotChange(undefined)} className={cn("btn btn-sm", !preferredSlot ? "btn-primary" : "btn-outline-secondary")}>
          {t("home.f2lAny")}
        </button>
        {F2L_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            aria-pressed={preferredSlot === slot}
            disabled={excludedSlots.includes(slot)}
            onClick={() => onPreferredSlotChange(preferredSlot === slot ? undefined : slot)}
            className={cn("btn btn-sm", preferredSlot === slot ? "btn-primary" : "btn-outline-secondary")}
          >
            {slot}
          </button>
        ))}
      </div>

      <p className="small fw-semibold mt-3 mb-2">{t("home.f2lExclude")}</p>
      <div className="btn-group w-100" role="group" aria-label={t("home.f2lExclude")}>
        {F2L_SLOTS.map((slot) => (
          <button
            key={`exclude-${slot}`}
            type="button"
            aria-pressed={excludedSlots.includes(slot)}
            onClick={() => {
              onExcludedSlotsChange(excludedSlots.includes(slot) ? excludedSlots.filter((value) => value !== slot) : [...excludedSlots, slot]);
              if (preferredSlot === slot) onPreferredSlotChange(undefined);
            }}
            className={cn("btn btn-sm", excludedSlots.includes(slot) ? "btn-danger" : "btn-outline-secondary")}
          >
            {slot}
          </button>
        ))}
      </div>
    </SolverDetails>
  );
}
