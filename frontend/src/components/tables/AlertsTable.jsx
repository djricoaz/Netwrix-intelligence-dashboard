import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import clsx from "clsx";

const SEVERITY_CLASS = {
  critical: "risk-critical",
  high:     "risk-high",
  medium:   "risk-medium",
  low:      "risk-low"
};

const TABS = ["All", "Critical", "High", "Medium", "Low"];

export default function AlertsTable({ alerts = [] }) {
  const [activeTab, setActiveTab] = useState("All");
  const [sortKey, setSortKey]     = useState("severity");
  const [sortDir, setSortDir]     = useState("desc");
  const [expanded, setExpanded]   = useState(null);

  const filtered = activeTab === "All"
    ? alerts
    : alerts.filter(a => a.severity?.toLowerCase() === activeTab.toLowerCase());

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey] ?? ""; const vb = b[sortKey] ?? "";
    return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-sm font-medium text-white">Active Alerts</span>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx("text-[10px] px-2 py-1 rounded", activeTab === tab ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              {tab}
              {tab !== "All" && (
                <span className="ml-1 text-gray-500">
                  ({alerts.filter(a => a.severity?.toLowerCase() === tab.toLowerCase()).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              {[["severity","Severity"], ["module","Module"], ["what","Event"], ["who","Who"], ["timestamp","Time"]].map(([k, label]) => (
                <th key={k} className="px-4 py-2 text-left cursor-pointer hover:text-gray-300 select-none" onClick={() => toggleSort(k)}>
                  <span className="flex items-center gap-1">
                    {label}
                    {sortKey === k && (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-600">No alerts</td></tr>
            )}
            {sorted.map((alert, i) => (
              <>
                <tr
                  key={i}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <td className="px-4 py-2">
                    <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", SEVERITY_CLASS[alert.severity])}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400">{alert.module}</td>
                  <td className="px-4 py-2 text-gray-200 max-w-[200px] truncate">{alert.what}</td>
                  <td className="px-4 py-2 text-gray-400">{alert.who || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(alert.timestamp)}</td>
                </tr>
                {expanded === i && (
                  <tr key={`${i}-exp`} className="bg-gray-900/50 border-b border-gray-800">
                    <td colSpan={5} className="px-6 py-3 text-xs text-gray-400 space-y-1">
                      <p><span className="text-gray-500">Source:</span> {alert.source}</p>
                      <p><span className="text-gray-500">Where:</span> {alert.where || "—"}</p>
                      <p><span className="text-gray-500">Action:</span> {alert.action || "—"}</p>
                      <p><span className="text-gray-500">Object:</span> {alert.object_name || "—"}</p>
                      {alert.ai_recommendation && (
                        <p className="mt-2 text-blue-400 border-l-2 border-blue-600 pl-2">{alert.ai_recommendation}</p>
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

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
