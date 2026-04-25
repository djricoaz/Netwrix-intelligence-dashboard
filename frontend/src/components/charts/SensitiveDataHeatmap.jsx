import { useQuery } from "@tanstack/react-query";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import api from "../../services/api";

export default function SensitiveDataHeatmap({ moduleKey }) {
  const { data, isLoading } = useQuery({
    queryKey: ["heatmap", moduleKey],
    queryFn: () => api.get(`/${moduleKey}/sensitive_data/heatmap`).then(r => r.data),
    staleTime: 10 * 60_000
  });

  if (isLoading) return <div className="animate-pulse bg-gray-800 rounded-lg h-48" />;
  if (!data?.length) return <p className="text-xs text-gray-500 py-8 text-center">No sensitive data detected</p>;

  // Nivo heatmap expects: [{id, data: [{x, y}]}]
  const formatted = data.map(row => ({
    id: row.share || row.site || row.path,
    data: (row.classifications || []).map(c => ({ x: c.label, y: c.count }))
  }));

  return (
    <div style={{ height: Math.max(200, formatted.length * 40) }}>
      <ResponsiveHeatMap
        data={formatted}
        margin={{ top: 20, right: 20, bottom: 60, left: 160 }}
        colors={{ type: "sequential", scheme: "reds" }}
        axisBottom={{ tickRotation: -35, tickSize: 0, legendOffset: 50, legendPosition: "middle" }}
        axisLeft={{ tickSize: 0 }}
        theme={{
          axis:   { ticks: { text: { fontSize: 10, fill: "#9ca3af" } } },
          labels: { text: { fontSize: 9, fill: "#fff" } }
        }}
        borderRadius={2}
        labelTextColor="#fff"
        tooltip={({ cell }) => (
          <div className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200">
            {cell.serieId} / {cell.data.x}: <b>{cell.value}</b> items
          </div>
        )}
      />
    </div>
  );
}
