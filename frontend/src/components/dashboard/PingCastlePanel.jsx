import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Play, Upload, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import clsx from "clsx";
import api from "../../services/api";

export default function PingCastlePanel({ compact = false }) {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [tab, setTab]         = useState("overview");

  const { data: report, isLoading } = useQuery({
    queryKey: ["pingcastle-latest"],
    queryFn: () => api.get("/ad/pingcastle/latest").then(r => r.data),
    staleTime: 5 * 60_000
  });

  const { data: compare } = useQuery({
    queryKey: ["pingcastle-compare"],
    queryFn: () => api.get("/ad/pingcastle/compare").then(r => r.data),
    enabled: !compact
  });

  const { data: correlate } = useQuery({
    queryKey: ["pingcastle-correlate"],
    queryFn: () => api.get("/ad/pingcastle/correlate").then(r => r.data),
    enabled: tab === "correlate"
  });

  const runScan = async () => {
    setRunning(true);
    try {
      await api.post("/ad/pingcastle/run");
      qc.invalidateQueries({ queryKey: ["pingcastle-latest"] });
      qc.invalidateQueries({ queryKey: ["pingcastle-compare"] });
    } finally {
      setRunning(false);
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await api.post("/ad/pingcastle/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
    qc.invalidateQueries({ queryKey: ["pingcastle-latest"] });
  };

  if (isLoading) return <div className="animate-pulse bg-gray-800 rounded-xl h-32" />;

  const scores = report?.scores || {};
  const ScoreBar = ({ label, value, max = 100 }) => (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-500"
          style={{ width: `${Math.min((value || 0) / max * 100, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-300 w-8 text-right">{value ?? "—"}</span>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">PingCastle AD Score</p>
          <div className="flex gap-2">
            <button onClick={runScan} disabled={running}
              className="flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded hover:bg-blue-600/30 disabled:opacity-40">
              <Play size={9} className={running ? "animate-pulse" : ""} />
              {running ? "Scanning..." : "Run Scan"}
            </button>
            <label className="flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-800 border border-gray-700 text-gray-400 rounded hover:bg-gray-700 cursor-pointer">
              <Upload size={9} />
              Upload XML
              <input type="file" accept=".xml" className="hidden" onChange={uploadFile} />
            </label>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-white">{scores.global ?? "—"}</div>
          <div className="space-y-1 flex-1">
            <ScoreBar label="Stale"      value={scores.stale}      max={100} />
            <ScoreBar label="Privileged" value={scores.privileged} max={100} />
            <ScoreBar label="Trust"      value={scores.trust}      max={100} />
            <ScoreBar label="Anomaly"    value={scores.anomaly}    max={100} />
          </div>
        </div>
        {report?.generated_at && <p className="text-[10px] text-gray-600">Last scan: {new Date(report.generated_at).toLocaleString("en-GB")}</p>}
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-blue-400" />
          <p className="text-sm font-medium text-white">PingCastle AD Assessment</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runScan} disabled={running}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-40 transition-colors">
            <Play size={11} className={running ? "animate-pulse" : ""} />
            {running ? "Running scan..." : "Run PingCastle"}
          </button>
          <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 cursor-pointer">
            <Upload size={11} />
            Upload XML
            <input type="file" accept=".xml" className="hidden" onChange={uploadFile} />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1 border-b border-gray-800">
        {[["overview","Overview"],["rules","Risk Rules"],["correlate","AD Correlation"],["history","Score History"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={clsx("px-3 py-2.5 text-xs border-b-2 transition-colors",
              tab === k ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300")}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 overflow-auto flex-1">
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-bold text-white">{scores.global ?? "—"}</span>
                <span className={clsx("text-sm mb-1", scores.global >= 50 ? "text-red-400" : "text-green-400")}>
                  {scores.global >= 50 ? "High Risk" : "Acceptable"}
                </span>
              </div>
              <div className="space-y-3">
                <ScoreBar label="Stale Objects" value={scores.stale}      max={100} />
                <ScoreBar label="Privileged"    value={scores.privileged} max={100} />
                <ScoreBar label="Trust"         value={scores.trust}      max={100} />
                <ScoreBar label="Anomaly"       value={scores.anomaly}    max={100} />
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-gray-500 uppercase tracking-wider text-[10px]">AD Summary</p>
              {[
                ["Domain", report?.summary?.functional_level],
                ["Users", report?.summary?.user_count?.toLocaleString()],
                ["Computers", report?.summary?.computer_count?.toLocaleString()],
                ["Admins", report?.summary?.admin_count],
                ["Stale Users (180d)", report?.stale_objects?.inactive_users_180d],
                ["Disabled Users", report?.stale_objects?.disabled_users],
                ["Never Logged In", report?.stale_objects?.never_logged_in],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-800 pb-1">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-200">{v ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div className="space-y-2">
            {(report?.critical_rules || []).map((rule, i) => (
              <div key={i} className={clsx("rounded-lg border p-3 text-xs",
                rule.points >= 15 ? "border-red-500/30 bg-red-500/5" : rule.points >= 10 ? "border-orange-400/30 bg-orange-400/5" : "border-gray-700 bg-gray-800/30"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={11} className={rule.points >= 15 ? "text-red-400" : "text-orange-400"} />
                  <span className="font-medium text-gray-200">{rule.rule_id}</span>
                  <span className="ml-auto font-bold tabular-nums">{rule.points} pts</span>
                  <span className="text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded text-[9px]">{rule.category}</span>
                </div>
                <p className="text-gray-400 leading-relaxed">{rule.rationale}</p>
                {rule.details && <p className="text-gray-600 mt-1 text-[10px]">{rule.details}</p>}
              </div>
            ))}
            {!report?.critical_rules?.length && <p className="text-gray-600 text-center py-8">No critical rules found</p>}
          </div>
        )}

        {tab === "correlate" && (
          <div className="space-y-4">
            {(correlate?.correlated_findings || []).map((finding, i) => (
              <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={12} className="text-orange-400" />
                  <span className="text-sm text-gray-200">{finding.rule_id}</span>
                  <span className="text-xs text-gray-500">— {finding.category}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{finding.rationale}</p>
                {finding.related_events?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider">Related NA events</p>
                    {finding.related_events.slice(0, 3).map((evt, j) => (
                      <div key={j} className="text-[11px] text-gray-500 border-l-2 border-gray-700 pl-2 mb-1">
                        {evt.Who} — {evt.Action} — {evt.ObjectName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">Global score trend across scans</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={report?.score_trend || []}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#6b7280" }} width={28} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }} />
                <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
