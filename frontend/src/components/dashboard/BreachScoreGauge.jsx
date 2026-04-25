import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

const RISK_LABEL = score =>
  score >= 80 ? ["CRITICAL", "#ef4444"]
  : score >= 60 ? ["HIGH", "#f97316"]
  : score >= 40 ? ["MEDIUM", "#eab308"]
  : score >= 20 ? ["LOW", "#22c55e"]
  :               ["SECURE", "#10b981"];

export default function BreachScoreGauge({ score = 0, trend }) {
  const [label, color] = RISK_LABEL(score);

  return (
    <div className="bg-[#111827] rounded-xl border border-gray-800 p-5 flex flex-col items-center">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Breach Risk Score</p>

      <div className="relative">
        <RadialBarChart
          width={160} height={160}
          innerRadius={55} outerRadius={75}
          startAngle={220} endAngle={-40}
          data={[{ value: score, fill: color }]}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#1f2937" }} />
        </RadialBarChart>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-[10px]" style={{ color }}>{label}</span>
        </div>
      </div>

      {trend && (
        <p className="mt-3 text-[10px] text-gray-500 text-center">
          Trend: <span className="text-gray-300">{trend}</span>
        </p>
      )}

      <div className="mt-4 w-full space-y-1">
        {[["1M",  "—"], ["3M", "—"], ["1Y", "—"]].map(([h, v]) => (
          <div key={h} className="flex justify-between text-[10px]">
            <span className="text-gray-500">{h} forecast</span>
            <span className="text-gray-400">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
