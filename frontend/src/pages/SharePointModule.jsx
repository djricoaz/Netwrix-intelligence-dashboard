import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import api from "../services/api";
import ModulePage from "../components/shared/ModulePage";
import EventsBarChart from "../components/charts/EventsBarChart";
import EventsTable from "../components/tables/EventsTable";
import SensitiveDataHeatmap from "../components/charts/SensitiveDataHeatmap";
import SensitiveDataTable from "../components/tables/SensitiveDataTable";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";

export default function SharePointModule() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis", "sharepoint"],
    queryFn: () => api.get("/sharepoint/kpis").then(r => r.data),
    refetchInterval: 60_000
  });

  const kpiCards = [
    { label: "Events (7d)",       value: kpis?.total_events_7d,   color: "blue" },
    { label: "External Sharing",  value: kpis?.external_sharing,  color: "red",    trend: "up" },
    { label: "Sensitive Items",   value: kpis?.sensitive_items,    color: "orange" },
    { label: "High-Risk Items",   value: kpis?.high_risk_items,    color: "red",    trend: "up" },
    { label: "Overshared Sites",  value: kpis?.overshared_sites,   color: "orange" },
    { label: "Alerts",            value: kpis?.active_alerts,      color: "red" },
  ];

  const tabs = [
    {
      key: "overview", label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">SharePoint Activity — Last 30 Days</p>
            <EventsBarChart moduleKey="sharepoint" days={30} height={200} />
          </div>
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Sensitive Data by Site</p>
            <SensitiveDataHeatmap moduleKey="sharepoint" />
          </div>
        </div>
      )
    },
    { key: "events",    label: "Events",          content: <EventsTable moduleKey="sharepoint" extraColumns={[{ key: "object_name", label: "Item" }]} /> },
    { key: "external",  label: "External Sharing", content: <EventsTable moduleKey="sharepoint" endpoint="/sharepoint/external_sharing" /> },
    { key: "sensitive", label: "Sensitive Data",   content: <SensitiveDataTable moduleKey="sharepoint" /> },
    { key: "predict",   label: "Predictions",      content: <ForecastTimeline moduleDefault="sharepoint" fullView /> },
  ];

  return (
    <ModulePage
      title="SharePoint Online"
      subtitle="Cloud document activity, external sharing, and sensitive content classification"
      icon={Share2}
      moduleKey="sharepoint"
      kpis={kpis}
      kpiCards={kpiCards}
      tabs={tabs}
    />
  );
}
