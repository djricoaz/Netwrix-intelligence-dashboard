import { Shield, Users, Server, Share2, Mail, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const MODULE_META = {
  ad:         { label: "Active Directory", icon: Shield,        path: "/ad" },
  entra:      { label: "Entra ID",         icon: Users,         path: "/entra" },
  fileserver: { label: "File Server",      icon: Server,        path: "/fileserver" },
  sharepoint: { label: "SharePoint",       icon: Share2,        path: "/sharepoint" },
  exchange:   { label: "Exchange Online",  icon: Mail,          path: "/exchange" },
  teams:      { label: "Teams",            icon: MessageSquare, path: "/teams" },
};

const RISK_STYLE = {
  critical: "border-red-500/40 bg-red-500/5 hover:bg-red-500/10",
  high:     "border-orange-400/40 bg-orange-400/5 hover:bg-orange-400/10",
  medium:   "border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10",
  low:      "border-green-500/30 bg-green-500/5 hover:bg-green-500/10",
  unknown:  "border-gray-700 bg-gray-800/30 hover:bg-gray-800/50",
};

const SCORE_COLOR = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-green-400",
  unknown: "text-gray-500",
};

export default function ModuleRiskGrid({ modules = {} }) {
  const navigate = useNavigate();

  const entries = Object.entries(modules).filter(([_, data]) => data);

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 grid grid-cols-3 gap-3 h-full">
      {entries.map(([key, data]) => {
        const meta   = MODULE_META[key] || {};
        const Icon   = meta.icon || Shield;
        const level  = data?.risk_level || "unknown";
        const score  = data?.risk_score ?? data?.ai_risk_score ?? "—";
        const alerts = data?.active_alerts ?? 0;

        return (
          <button
            key={key}
            onClick={() => navigate(meta.path || "/")}
            className={clsx("rounded-xl border p-3 text-left transition-all cursor-pointer", RISK_STYLE[level] || RISK_STYLE.unknown)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} className="text-gray-400" />
              <span className="text-[10px] text-gray-400">{meta.label}</span>
            </div>
            <div className={clsx("text-xl font-bold tabular-nums", SCORE_COLOR[level])}>{score}</div>
            <div className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">{level}</div>
            {alerts > 0 && (
              <div className="mt-2 text-[9px] text-red-400">{alerts} active alert{alerts !== 1 ? "s" : ""}</div>
            )}
          </button>
        );
      })}
      {entries.length === 0 && (
        <div className="col-span-3 flex items-center justify-center text-gray-600 text-xs py-8">
          No modules configured
        </div>
      )}
    </div>
  );
}
