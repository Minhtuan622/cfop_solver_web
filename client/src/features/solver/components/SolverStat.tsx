import type { ReactNode } from "react";

export function SolverStat({ label, value, icon }: { label: string; value: string; icon: ReactNode; compact?: boolean }) {
  return <div className="card bg-body-tertiary h-100"><div className="card-body d-flex align-items-center gap-3">{icon}<div><small className="text-body-secondary d-block">{label}</small><strong className="fs-4">{value}</strong></div></div></div>;
}
