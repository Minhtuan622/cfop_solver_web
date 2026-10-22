import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatSolveTime } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileProgressPoint } from "../lib/profileProgress";

export function ProfileProgressChart({ data }: { data: ProfileProgressPoint[] }) {
  const { t } = useLanguage();
  if (!data.length) return <p className="text-body-secondary mb-0">{t("profile.progressEmpty")}</p>;
  return <div style={{ height: 270 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 4 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}s`} width={42} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => typeof value === "number" ? formatSolveTime(value) : "—"} /><Legend /><Line type="monotone" dataKey="best" name="Best" stroke="var(--cfop-chart-1)" strokeWidth={2} dot={false} connectNulls /><Line type="monotone" dataKey="ao5" name="Ao5" stroke="var(--cfop-chart-2)" strokeWidth={2} dot={false} connectNulls /></LineChart></ResponsiveContainer></div>;
}
