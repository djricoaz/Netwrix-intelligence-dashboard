import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../../services/api";

const SEVERITY_COLOR = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e", info: "#3b82f6" };

export default function EventsBarChart({ moduleKey, days = 30, height = 180 }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["events-chart", moduleKey, days],
    queryFn: () => api.get(`/${moduleKey}/events/timeline?days=${days}`).then(r => r.data),
    staleTime: 5 * 60_000
  });

  if (isLoading) return <div className="animate-pulse bg-gray-800 rounded-lg" style={{ height }} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={6}>
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} />
        <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} width={28} />
        <Tooltip
          contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: "#9ca3af" }}
        />
        <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLOR.critical} />
        <Bar dataKey="high"     stackId="a" fill={SEVERITY_COLOR.high} />
        <Bar dataKey="medium"   stackId="a" fill={SEVERITY_COLOR.medium} />
        <Bar dataKey="low"      stackId="a" fill={SEVERITY_COLOR.low} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
