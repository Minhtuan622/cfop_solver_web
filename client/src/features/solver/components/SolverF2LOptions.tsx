import { useLanguage } from "@/contexts/LanguageContext";
import { F2L_SLOTS } from "@/lib/solverPresentation";
import type { F2LSlot } from "@/lib/solverRuntime";
import { cn } from "@/lib/utils";
import { SolverDetails } from "./SolverDetails";
import { Button } from "@/components/ui/Button";

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
export function SolverF2LOptions({
  preferredSlot,
  excludedSlots,
  onPreferredSlotChange,
  onExcludedSlotsChange,
}: SolverF2LOptionsProps) {
  const { t } = useLanguage();

  return (
    <SolverDetails summary={t("home.f2lSettings")}>
      <p className="text-sm font-semibold mb-2">{t("home.f2lPriority")}</p>
      <div
        className="inline-flex flex-wrap items-center gap-1 w-full"
        role="group"
        aria-label={t("home.f2lPriority")}
      >
        <Button
          type="button"
          variant={!preferredSlot ? "primary" : "secondary"}
          size="sm"
          aria-pressed={!preferredSlot}
          onClick={() => onPreferredSlotChange(undefined)}
        >
          {t("home.f2lAny")}
        </Button>
        {F2L_SLOTS.map(slot => (
          <Button
            key={slot}
            type="button"
            variant={preferredSlot === slot ? "primary" : "secondary"}
            size="sm"
            aria-pressed={preferredSlot === slot}
            disabled={excludedSlots.includes(slot)}
            onClick={() =>
              onPreferredSlotChange(preferredSlot === slot ? undefined : slot)
            }
          >
            {slot}
          </Button>
        ))}
      </div>

      <p className="text-sm font-semibold mt-4 mb-2">{t("home.f2lExclude")}</p>
      <div
        className="inline-flex flex-wrap items-center gap-1 w-full"
        role="group"
        aria-label={t("home.f2lExclude")}
      >
        {F2L_SLOTS.map(slot => (
          <Button
            key={`exclude-${slot}`}
            type="button"
            variant={excludedSlots.includes(slot) ? "dangerSolid" : "secondary"}
            size="sm"
            aria-pressed={excludedSlots.includes(slot)}
            onClick={() => {
              onExcludedSlotsChange(
                excludedSlots.includes(slot)
                  ? excludedSlots.filter(value => value !== slot)
                  : [...excludedSlots, slot]
              );
              if (preferredSlot === slot) onPreferredSlotChange(undefined);
            }}
          >
            {slot}
          </Button>
        ))}
      </div>
    </SolverDetails>
  );
}
