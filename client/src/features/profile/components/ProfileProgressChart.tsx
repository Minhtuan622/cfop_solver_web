import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatSolveTime } from "@/lib/solveHistory";
import { ProfileProgressPoint } from "@/features/profile";

export function ProfileProgressChart({ data }: { data: ProfileProgressPoint[] }) {
  if (!data.length) return <p className="text-body-secondary mb-0">Hoàn thành vài lượt solve để xem đường tiến bộ Best và Ao5 theo ngày.</p>;
  return <div style={{ height: 270 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 4 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}s`} width={42} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => typeof value === "number" ? formatSolveTime(value) : "—"} /><Legend /><Line type="monotone" dataKey="best" name="Best" stroke="#0d6efd" strokeWidth={2} dot={false} connectNulls /><Line type="monotone" dataKey="ao5" name="Ao5" stroke="#198754" strokeWidth={2} dot={false} connectNulls /></LineChart></ResponsiveContainer></div>;
}
