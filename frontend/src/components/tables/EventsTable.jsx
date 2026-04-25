import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import clsx from "clsx";
import api from "../../services/api";

const SEVERITY_CLASS = {
  critical: "risk-critical", high: "risk-high", medium: "risk-medium", low: "risk-low", info: "text-gray-400"
};

export default function EventsTable({ moduleKey, endpoint, extraColumns = [] }) {
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);

  const url = endpoint || `/${moduleKey}/events?page=${page}&sort=${sortKey}&dir=${sortDir}&q=${search}`;

  const { data, isLoading } = useQuery({
    queryKey: ["events-table", moduleKey, page, sortKey, sortDir, search],
    queryFn: () => api.get(url).then(r => r.data),
    keepPreviousData: true
  });

  const events  = data?.events || data || [];
  const total   = data?.total || events.length;
  const pages   = data?.pages || 1;

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)
    : null;

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-gray-500 ml-auto">{total.toLocaleString()} events</span>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-[#0d1117]">
              {[["severity","Sev"],["timestamp","Time"],["who","Who"],["what","Event"],["where","Where"],["outcome","Result"],
                ...extraColumns.map(c => [c.key, c.label])
              ].map(([k, label]) => (
                <th key={k} onClick={() => toggleSort(k)}
                  className="px-3 py-2 text-left cursor-pointer hover:text-gray-300 select-none whitespace-nowrap">
                  <span className="flex items-center gap-1">{label}<SortIcon k={k} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6 + extraColumns.length} className="py-12 text-center text-gray-600">Loading...</td></tr>
            )}
            {!isLoading && events.length === 0 && (
              <tr><td colSpan={6 + extraColumns.length} className="py-12 text-center text-gray-600">No events found</td></tr>
            )}
            {events.map((evt, i) => (
              <>
                <tr key={i}
                  className="border-b border-gray-800/40 hover:bg-gray-800/30 cursor-pointer"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <td className="px-3 py-1.5">
                    <span className={clsx("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", SEVERITY_CLASS[evt.severity] || "text-gray-400")}>
                      {evt.severity}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{fmt(evt.timestamp)}</td>
                  <td className="px-3 py-1.5 text-gray-300 max-w-[120px] truncate">{evt.who || "—"}</td>
                  <td className="px-3 py-1.5 text-gray-200 max-w-[200px] truncate">{evt.what || evt.event_name}</td>
                  <td className="px-3 py-1.5 text-gray-400 max-w-[120px] truncate">{evt.where || "—"}</td>
                  <td className="px-3 py-1.5">
                    <span className={clsx("text-[9px]", evt.outcome === "Success" ? "text-green-400" : evt.outcome === "Failure" ? "text-red-400" : "text-gray-500")}>
                      {evt.outcome || "—"}
                    </span>
                  </td>
                  {extraColumns.map(c => (
                    <td key={c.key} className="px-3 py-1.5 text-gray-400">{evt[c.key] || "—"}</td>
                  ))}
                </tr>
                {expanded === i && (
                  <tr key={`${i}-x`} className="bg-gray-900/60 border-b border-gray-800">
                    <td colSpan={6 + extraColumns.length} className="px-5 py-3 text-xs text-gray-400 grid grid-cols-3 gap-2">
                      <p><span className="text-gray-600">Source:</span> {evt.source}</p>
                      <p><span className="text-gray-600">Action:</span> {evt.action || "—"}</p>
                      <p><span className="text-gray-600">Object:</span> {evt.object_name || "—"}</p>
                      <p><span className="text-gray-600">Source IP:</span> {evt.source_ip || "—"}</p>
                      <p><span className="text-gray-600">Event ID:</span> {evt.event_id || "—"}</p>
                      <p><span className="text-gray-600">Object type:</span> {evt.object_type || "—"}</p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 rounded hover:bg-gray-800 disabled:opacity-40">← Prev</button>
          <span>Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1 rounded hover:bg-gray-800 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}
