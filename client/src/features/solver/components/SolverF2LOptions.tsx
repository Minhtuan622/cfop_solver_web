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
        <button
          type="button"
          aria-pressed={!preferredSlot}
          onClick={() => onPreferredSlotChange(undefined)}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs",
            !preferredSlot
              ? "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
              : "border-line bg-surface text-ink hover:bg-surface-2"
          )}
        >
          {t("home.f2lAny")}
        </button>
        {F2L_SLOTS.map(slot => (
          <button
            key={slot}
            type="button"
            aria-pressed={preferredSlot === slot}
            disabled={excludedSlots.includes(slot)}
            onClick={() =>
              onPreferredSlotChange(preferredSlot === slot ? undefined : slot)
            }
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs",
              preferredSlot === slot
                ? "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
                : "border-line bg-surface text-ink hover:bg-surface-2"
            )}
          >
            {slot}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold mt-4 mb-2">{t("home.f2lExclude")}</p>
      <div
        className="inline-flex flex-wrap items-center gap-1 w-full"
        role="group"
        aria-label={t("home.f2lExclude")}
      >
        {F2L_SLOTS.map(slot => (
          <button
            key={`exclude-${slot}`}
            type="button"
            aria-pressed={excludedSlots.includes(slot)}
            onClick={() => {
              onExcludedSlotsChange(
                excludedSlots.includes(slot)
                  ? excludedSlots.filter(value => value !== slot)
                  : [...excludedSlots, slot]
              );
              if (preferredSlot === slot) onPreferredSlotChange(undefined);
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs",
              excludedSlots.includes(slot)
                ? "bg-danger text-white shadow-sm hover:brightness-95"
                : "border-line bg-surface text-ink hover:bg-surface-2"
            )}
          >
            {slot}
          </button>
        ))}
      </div>
    </SolverDetails>
  );
}
