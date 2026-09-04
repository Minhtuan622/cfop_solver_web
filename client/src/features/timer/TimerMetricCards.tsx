type MetricButtonProps = {
  label: string;
  value: string;
  enabled: boolean;
  onClick: () => void;
};

export function MetricButton({ label, value, enabled, onClick }: MetricButtonProps) {
  return (
    <button type="button" disabled={!enabled} onClick={onClick} className="btn btn-outline-secondary w-100 text-start h-100">
      <small className="text-body-secondary d-block">{label}</small>
      <strong className="fs-5">{value}</strong>
    </button>
  );
}

export function MetricDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="card bg-dark text-white">
      <div className="card-body">
        <small className="text-white-50">{label}</small>
        <strong className="fs-5 d-block">{value}</strong>
      </div>
    </div>
  );
}
