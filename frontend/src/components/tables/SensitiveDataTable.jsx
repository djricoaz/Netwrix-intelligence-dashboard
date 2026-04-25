import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink } from "lucide-react";
import clsx from "clsx";
import api from "../../services/api";

const RISK_COLOR = r => r >= 80 ? "text-red-400" : r >= 60 ? "text-orange-400" : r >= 40 ? "text-yellow-400" : "text-green-400";

export default function SensitiveDataTable({ moduleKey }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["sensitive", moduleKey],
    queryFn: () => api.get(`/${moduleKey}/sensitive_data`).then(r => r.data),
    staleTime: 5 * 60_000
  });

  const classes = ["all", ...new Set(data.map(d => d.classification).filter(Boolean))];

  const filtered = data.filter(d =>
    (classFilter === "all" || d.classification === classFilter) &&
    (!search || d.path?.toLowerCase().includes(search.toLowerCase()) || d.share?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-wrap">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search path / share..."
            className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-52" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {classes.map(c => (
            <button key={c} onClick={() => setClassFilter(c)}
              className={clsx("text-[10px] px-2 py-1 rounded capitalize", classFilter === c ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300")}>
              {c}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-500">{filtered.length} items</span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0d1117]">
              <th className="px-3 py-2 text-left">Path / Share</th>
              <th className="px-3 py-2 text-left">Classification</th>
              <th className="px-3 py-2 text-left">Risk</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Last Accessed</th>
              <th className="px-3 py-2 text-left">Flags</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="py-12 text-center text-gray-600">Loading...</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-600">No sensitive data found</td></tr>}
            {filtered.map((item, i) => (
              <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                <td className="px-3 py-2">
                  <p className="text-gray-200 max-w-xs truncate" title={item.path}>{item.path || item.share}</p>
                  {item.share && item.path && <p className="text-[10px] text-gray-500">{item.share}</p>}
                </td>
                <td className="px-3 py-2">
                  <span className="text-[10px] font-medium bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded">
                    {item.classification || "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={clsx("h-full rounded-full",
                        item.risk_score >= 80 ? "bg-red-500" : item.risk_score >= 60 ? "bg-orange-400" : item.risk_score >= 40 ? "bg-yellow-400" : "bg-green-400"
                      )} style={{ width: `${item.risk_score}%` }} />
                    </div>
                    <span className={clsx("tabular-nums font-medium", RISK_COLOR(item.risk_score))}>{item.risk_score}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-400">{item.owner || "—"}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                  {item.last_accessed_at ? new Date(item.last_accessed_at).toLocaleDateString("en-GB") : "—"}
                  {item.last_accessed_by && <p className="text-[10px] text-gray-600">{item.last_accessed_by}</p>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {item.external_access     && <span className="text-[9px] text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1 rounded">EXTERNAL</span>}
                    {item.publicly_accessible && <span className="text-[9px] text-red-400 bg-red-400/10 border border-red-400/20 px-1 rounded">PUBLIC</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
