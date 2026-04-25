import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp, Bot } from "lucide-react";
import clsx from "clsx";
import api from "../../services/api";

const RISK_BAR_COLOR = { critical: "bg-red-500", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-green-400", unknown: "bg-gray-600" };

export default function UsersRiskTable({ moduleKey = "ad" }) {
  const [search, setSearch]   = useState("");
  const [sortKey, setSortKey] = useState("ai_risk_score");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["users-risk", moduleKey],
    queryFn: () => api.get(`/${moduleKey}/users/risky`).then(r => r.data),
    staleTime: 2 * 60_000
  });

  const filtered = data.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) ||
               u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey] ?? 0; const vb = b[sortKey] ?? 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const analyzeUser = async (username) => {
    setAnalyzing(username);
    await api.post(`/ai/analyze_user`, { username });
    await refetch();
    setAnalyzing(null);
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)
    : <ChevronDown size={10} className="opacity-20" />;

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-gray-500 ml-auto">{sorted.length} users</span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0d1117]">
              {[["display_name","User"],["department","Dept"],["ai_risk_score","Risk Score"],
                ["ai_risk_level","Level"],["event_count_7d","Events 7d"],
                ["failed_logins_7d","Failed Logins"],["sensitive_accesses","Sensitive Access"],["off_hours_events","Off-Hours"]
              ].map(([k, label]) => (
                <th key={k} onClick={() => toggleSort(k)}
                  className="px-3 py-2 text-left cursor-pointer hover:text-gray-300 select-none">
                  <span className="flex items-center gap-1">{label}<SortIcon k={k} /></span>
                </th>
              ))}
              <th className="px-3 py-2 text-left text-gray-500">AI</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="py-12 text-center text-gray-600">Loading...</td></tr>
            )}
            {sorted.map((user, i) => (
              <>
                <tr key={i}
                  className="border-b border-gray-800/40 hover:bg-gray-800/20 cursor-pointer"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <td className="px-3 py-2">
                    <div>
                      <p className="text-gray-200">{user.display_name || user.username}</p>
                      <p className="text-[10px] text-gray-500">{user.username}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-400">{user.department || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className={clsx("h-full rounded-full", RISK_BAR_COLOR[user.ai_risk_level] || "bg-gray-600")}
                          style={{ width: `${user.ai_risk_score || 0}%` }} />
                      </div>
                      <span className="text-gray-300 tabular-nums">{user.ai_risk_score ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={clsx("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border",
                      user.ai_risk_level === "critical" ? "risk-critical"
                      : user.ai_risk_level === "high" ? "risk-high"
                      : user.ai_risk_level === "medium" ? "risk-medium"
                      : "risk-low"
                    )}>{user.ai_risk_level || "unknown"}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{(user.event_count_7d || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{user.failed_logins_7d || 0}</td>
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{user.sensitive_accesses || 0}</td>
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{user.off_hours_events || 0}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={e => { e.stopPropagation(); analyzeUser(user.username); }}
                      disabled={analyzing === user.username}
                      className="p-1 rounded hover:bg-blue-600/20 text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-40"
                      title="Re-run AI risk analysis"
                    >
                      <Bot size={12} className={analyzing === user.username ? "animate-spin" : ""} />
                    </button>
                  </td>
                </tr>
                {expanded === i && user.ai_indicators?.length > 0 && (
                  <tr key={`${i}-x`} className="bg-gray-900/60 border-b border-gray-800">
                    <td colSpan={9} className="px-5 py-3 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {user.ai_indicators.map((ind, j) => (
                          <span key={j} className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{ind}</span>
                        ))}
                      </div>
                      {user.ai_recommendation && (
                        <p className="text-[11px] text-blue-300 border-l-2 border-blue-600 pl-3 italic">{user.ai_recommendation}</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
