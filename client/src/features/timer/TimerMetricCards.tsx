type MetricButtonProps = {
  label: string;
  value: string;
  enabled: boolean;
  onClick: () => void;
};

export function MetricButton({ label, value, enabled, onClick }: MetricButtonProps) {
  return (
    <button type="button" disabled={!enabled} onClick={onClick} className="ds-metric w-100 text-start h-100">
      <small className="ds-metric-label d-block">{label}</small>
      <strong className="ds-metric-value d-block mt-1">{value}</strong>
    </button>
  );
}
