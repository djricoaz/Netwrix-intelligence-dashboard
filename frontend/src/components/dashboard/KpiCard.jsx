import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import clsx from "clsx";

const COLOR_MAP = {
  red:    "border-red-500/30 bg-red-500/5",
  orange: "border-orange-400/30 bg-orange-400/5",
  yellow: "border-yellow-400/30 bg-yellow-400/5",
  blue:   "border-blue-500/30 bg-blue-500/5",
  green:  "border-green-500/30 bg-green-500/5",
};

const TREND_ICON = {
  up:     <TrendingUp size={14} className="text-red-400" />,
  down:   <TrendingDown size={14} className="text-green-400" />,
  stable: <Minus size={14} className="text-gray-400" />
};

export default function KpiCard({ label, value, trend = "stable", color = "blue", delta, forecast }) {
  return (
    <div className={clsx("rounded-xl border p-4 flex flex-col gap-3", COLOR_MAP[color] || COLOR_MAP.blue)}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white tabular-nums">
          {value ?? "—"}
        </span>
        <div className="flex items-center gap-1">
          {TREND_ICON[trend]}
          {delta != null && (
            <span className="text-xs text-gray-400">{delta > 0 ? `+${delta}` : delta}</span>
          )}
        </div>
      </div>
      {forecast && (
        <p className="text-[10px] text-gray-500 border-t border-gray-700 pt-2">
          Forecast 30d: <span className="text-gray-300">{forecast}</span>
        </p>
      )}
    </div>
  );
}
