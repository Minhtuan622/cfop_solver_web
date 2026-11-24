import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

const HOURS = 12;

function Dial({
  index,
  value,
  disabled,
  onChange,
}: {
  index: number;
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  const { t } = useLanguage();
  const step = (delta: number) => onChange((value + delta + HOURS) % HOURS);
  return (
    <button
      type="button"
      data-dial={index}
      disabled={disabled}
      aria-label={t("otherPuzzles.clock.dial", { n: String(index + 1), hour: String(value === 0 ? 12 : value) })}
      onClick={event => step(event.shiftKey ? -1 : 1)}
      onContextMenu={event => {
        event.preventDefault();
        step(-1);
      }}
      className="aspect-square w-full rounded-full bg-surface-2 text-ink transition hover:bg-surface-3 focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      <svg viewBox="-50 -50 100 100" aria-hidden="true" className="block size-full">
        {Array.from({ length: HOURS }, (_, hour) => (
          <line
            key={hour}
            x1="0"
            y1="-40"
            x2="0"
            y2={hour % 3 === 0 ? "-33" : "-36"}
            stroke="currentColor"
            strokeWidth={hour % 3 === 0 ? 3 : 1.5}
            opacity="0.5"
            transform={`rotate(${hour * 30})`}
          />
        ))}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-30"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${value * 30})`}
        />
        <circle r="5" fill="currentColor" />
      </svg>
    </button>
  );
}

export function ClockDialEditor({
  dials,
  onChange,
  onReset,
  disabled = false,
}: {
  dials: number[];
  onChange: (next: number[]) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const set = (index: number, value: number) => {
    const next = dials.slice();
    next[index] = value;
    onChange(next);
  };
  const side = (offset: number, label: string) => (
    <section aria-label={label} className="min-w-0 flex-1">
      <h3 className="mb-2 text-sm font-semibold tracking-tight">{label}</h3>
      <div className="mx-auto grid max-w-64 grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, cell) => {
          const index = offset + cell;
          return (
            <Dial
              key={index}
              index={index}
              value={dials[index] ?? 0}
              disabled={disabled}
              onChange={value => set(index, value)}
            />
          );
        })}
      </div>
    </section>
  );
  return (
    <div>
      <div className="flex flex-wrap items-start gap-6">
        {side(0, t("otherPuzzles.clock.front"))}
        {side(9, t("otherPuzzles.clock.back"))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="soft" size="sm" onClick={onReset} disabled={disabled}>
          {t("otherPuzzles.state.reset")}
        </Button>
        <p role="status" className="m-0 text-sm text-muted">
          {t("otherPuzzles.clock.hint")}
        </p>
      </div>
    </div>
  );
}
