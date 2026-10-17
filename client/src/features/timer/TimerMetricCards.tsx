type MetricButtonProps = {
  label: string;
  value: string;
  enabled: boolean;
  onClick: () => void;
};

export function MetricButton({ label, value, enabled, onClick }: MetricButtonProps) {
  return (
    <button type="button" disabled={!enabled} onClick={onClick} className="btn btn-outline-secondary w-100 text-start h-100 rounded-3 p-3">
      <small className="text-body-secondary d-block text-uppercase fw-semibold">{label}</small>
      <strong className="fs-4 d-block mt-1">{value}</strong>
    </button>
  );
}

export function MetricDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="card bg-dark text-white border-0 shadow-sm">
      <div className="card-body p-3">
        <small className="text-white-50">{label}</small>
        <strong className="fs-5 d-block">{value}</strong>
      </div>
    </div>
  );
}
