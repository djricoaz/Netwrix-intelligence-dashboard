import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";
import api from "../services/api";
import ModulePage from "../components/shared/ModulePage";
import EventsBarChart from "../components/charts/EventsBarChart";
import EventsTable from "../components/tables/EventsTable";
import SensitiveDataHeatmap from "../components/charts/SensitiveDataHeatmap";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";
import SensitiveDataTable from "../components/tables/SensitiveDataTable";

export default function FileServerModule() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis", "fileserver"],
    queryFn: () => api.get("/fileserver/kpis").then(r => r.data),
    refetchInterval: 60_000
  });

  const kpiCards = [
    { label: "Events (7d)",        value: kpis?.total_events_7d,    color: "blue" },
    { label: "Sensitive Exposed",  value: kpis?.sensitive_exposed,   color: "red",    trend: "up" },
    { label: "Externally Shared",  value: kpis?.externally_shared,   color: "orange", trend: "up" },
    { label: "Failed Access",      value: kpis?.failed_access,       color: "yellow" },
    { label: "Off-Hours Events",   value: kpis?.off_hours_events,    color: "orange" },
    { label: "Active Alerts",      value: kpis?.active_alerts,       color: "red" },
  ];

  const tabs = [
    {
      key: "overview", label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">File Server Activity — Last 30 Days</p>
            <EventsBarChart moduleKey="fileserver" days={30} height={200} />
          </div>
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Sensitive Data Heatmap by Share</p>
            <SensitiveDataHeatmap moduleKey="fileserver" />
          </div>
        </div>
      )
    },
    { key: "events",    label: "Events",         content: <EventsTable moduleKey="fileserver" extraColumns={[{ key: "object_name", label: "File/Folder" }]} /> },
    { key: "sensitive", label: "Sensitive Data",  content: <SensitiveDataTable moduleKey="fileserver" /> },
    { key: "predict",   label: "Predictions",     content: <ForecastTimeline moduleDefault="fileserver" fullView /> },
  ];

  return (
    <ModulePage
      title="File Server"
      subtitle="File access events, sensitive data exposure, and share risk analysis"
      icon={Server}
      moduleKey="fileserver"
      kpis={kpis}
      kpiCards={kpiCards}
      tabs={tabs}
    />
  );
}
