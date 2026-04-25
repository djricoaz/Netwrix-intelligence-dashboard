import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import clsx from "clsx";

const HORIZONS = ["1m", "2m", "3m", "1y", "2y"];
const MODULES  = ["ad", "entra", "fileserver", "sharepoint", "exchange", "teams"];

export default function ForecastTimeline() {
  const [module, setModule]   = useState("ad");
  const [horizon, setHorizon] = useState("3m");

  const { data, isLoading } = useQuery({
    queryKey: ["forecast", module, horizon],
    queryFn:  () => api.get(`/ai/forecast/${module}?horizon=${horizon}`).then(r => r.data),
    staleTime: 10 * 60 * 1000
  });

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">AI Risk Forecast</p>
        <div className="flex gap-1">
          {HORIZONS.map(h => (
            <button key={h} onClick={() => setHorizon(h)}
              className={clsx("text-[10px] px-2 py-1 rounded uppercase", horizon === h ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300")}
            >{h}</button>
          ))}
        </div>
      </div>

      {/* Module selector */}
      <div className="flex gap-1 flex-wrap">
        {MODULES.map(m => (
          <button key={m} onClick={() => setModule(m)}
            className={clsx("text-[10px] px-2 py-0.5 rounded capitalize", module === m ? "bg-gray-700 text-white" : "text-gray-600 hover:text-gray-400")}
          >{m}</button>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-32 flex items-center justify-center text-gray-600 text-xs">Loading forecast...</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data?.chart_points || []}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#6b7280" }} width={28} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <ReferenceLine x="Today" stroke="#4b5563" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="risk_score" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="breach_probability" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>

          {/* AI summary */}
          {data?.executive_summary && (
            <p className="text-[11px] text-gray-400 border-l-2 border-blue-600 pl-3 italic leading-relaxed">
              {data.executive_summary}
            </p>
          )}

          {/* Recommended actions */}
          {data?.recommended_actions?.length > 0 && (
            <div className="space-y-1">
              {data.recommended_actions.slice(0, 3).map((a, i) => (
                <div key={i} className={clsx("text-[10px] flex items-start gap-2 px-2 py-1 rounded border",
                  a.priority === "critical" ? "border-red-500/30 text-red-400"
                  : a.priority === "high"   ? "border-orange-400/30 text-orange-400"
                  :                           "border-gray-700 text-gray-400"
                )}>
                  <span className="uppercase font-bold text-[9px] mt-0.5">{a.priority}</span>
                  <span>{a.action}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
