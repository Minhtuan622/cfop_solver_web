type MetricButtonProps = {
  label: string;
  value: string;
  enabled: boolean;
  onClick: () => void;
};

export function MetricButton({
  label,
  value,
  enabled,
  onClick,
}: MetricButtonProps) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="h-full w-full rounded-panel border border-line/70 bg-surface-2 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <small className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </small>
      <strong className="mt-1 block text-2xl font-bold tabular-nums tracking-tight text-ink">
        {value}
      </strong>
    </button>
  );
}
