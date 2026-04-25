import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import api from "../../services/api";

const MODULES = [
  { key: "ad",         label: "Active Directory", color: "#3b82f6" },
  { key: "entra",      label: "Entra ID",         color: "#8b5cf6" },
  { key: "fileserver", label: "File Server",       color: "#f97316" },
  { key: "sharepoint", label: "SharePoint",        color: "#06b6d4" },
  { key: "exchange",   label: "Exchange",          color: "#10b981" },
  { key: "teams",      label: "Teams",             color: "#6366f1" },
];

export default function ActivitySparklines() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {MODULES.map(m => <Sparkline key={m.key} {...m} />)}
    </div>
  );
}

function Sparkline({ key: moduleKey, label, color }) {
  const { data = [] } = useQuery({
    queryKey: ["sparkline", moduleKey],
    queryFn: () => api.get(`/${moduleKey}/events/timeline?days=14`).then(r => r.data),
    staleTime: 5 * 60_000
  });

  const total = data.reduce((s, d) => s + (d.total || 0), 0);

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-3">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white tabular-nums">{total.toLocaleString()}</p>
      <p className="text-[9px] text-gray-600 mb-2">14 days</p>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`g-${moduleKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ background: "#111827", border: "none", borderRadius: 4, fontSize: 10 }}
            itemStyle={{ color: "#d1d5db" }}
          />
          <Area type="monotone" dataKey="total" stroke={color} strokeWidth={1.5}
            fill={`url(#g-${moduleKey})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
