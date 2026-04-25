import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import api from "../services/api";
import ModulePage from "../components/shared/ModulePage";
import EventsBarChart from "../components/charts/EventsBarChart";
import EventsTable from "../components/tables/EventsTable";
import SensitiveDataTable from "../components/tables/SensitiveDataTable";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";

export default function TeamsModule() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis", "teams"],
    queryFn: () => api.get("/teams/kpis").then(r => r.data),
    refetchInterval: 60_000
  });

  const kpiCards = [
    { label: "Events (7d)",       value: kpis?.total_events_7d,   color: "blue" },
    { label: "Guest Activity",    value: kpis?.guest_activity,    color: "orange", trend: "up" },
    { label: "External Access",   value: kpis?.external_access,   color: "red" },
    { label: "Sensitive Messages",value: kpis?.sensitive_messages, color: "red",    trend: "up" },
    { label: "Channels Created",  value: kpis?.channels_created,  color: "blue" },
    { label: "Alerts",            value: kpis?.active_alerts,     color: "red" },
  ];

  const tabs = [
    {
      key: "overview", label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Teams Activity — Last 30 Days</p>
            <EventsBarChart moduleKey="teams" days={30} height={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-orange-500/20 rounded-xl p-4">
              <p className="text-xs text-orange-400 mb-3 uppercase tracking-wider font-medium">Guest & External Users</p>
              <EventsTable moduleKey="teams" endpoint="/teams/guest_activity" />
            </div>
            <ForecastTimeline moduleDefault="teams" />
          </div>
        </div>
      )
    },
    { key: "events",    label: "Events",           content: <EventsTable moduleKey="teams" extraColumns={[{ key: "object_name", label: "Channel" }]} /> },
    { key: "external",  label: "External Access",   content: <EventsTable moduleKey="teams" endpoint="/teams/external_access" /> },
    { key: "sensitive", label: "Sensitive Content", content: <SensitiveDataTable moduleKey="teams" /> },
    { key: "predict",   label: "Predictions",       content: <ForecastTimeline moduleDefault="teams" fullView /> },
  ];

  return (
    <ModulePage
      title="Microsoft Teams"
      subtitle="Collaboration activity, guest access, external sharing, and sensitive message detection"
      icon={MessageSquare}
      moduleKey="teams"
      kpis={kpis}
      kpiCards={kpiCards}
      tabs={tabs}
    />
  );
}
