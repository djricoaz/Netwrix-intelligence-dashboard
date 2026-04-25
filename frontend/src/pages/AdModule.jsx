import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import api from "../services/api";
import ModulePage from "../components/shared/ModulePage";
import EventsBarChart from "../components/charts/EventsBarChart";
import EventsTable from "../components/tables/EventsTable";
import UsersRiskTable from "../components/tables/UsersRiskTable";
import SensitiveDataHeatmap from "../components/charts/SensitiveDataHeatmap";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";
import PingCastlePanel from "../components/dashboard/PingCastlePanel";

export default function AdModule() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis", "ad"],
    queryFn: () => api.get("/ad/kpis").then(r => r.data),
    refetchInterval: 60_000
  });

  const kpiCards = [
    { label: "Events (7d)",         value: kpis?.total_events_7d,    color: "blue" },
    { label: "Failed Logins (24h)", value: kpis?.failed_logins_24h,  color: "red",    trend: "up" },
    { label: "Privileged Changes",  value: kpis?.privileged_changes,  color: "orange" },
    { label: "GPO Changes",         value: kpis?.gpo_changes,         color: "yellow" },
    { label: "Critical Users",      value: kpis?.critical_users,      color: "red",    trend: "up" },
    { label: "PingCastle Score",    value: kpis?.pingcastle_score,    color: "orange", forecast: "Trend tracked" },
  ];

  const tabs = [
    {
      key: "overview", label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Events by Severity — Last 30 Days</p>
            <EventsBarChart moduleKey="ad" days={30} height={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PingCastlePanel compact />
            <ForecastTimeline moduleDefault="ad" />
          </div>
        </div>
      )
    },
    {
      key: "events", label: "Events",
      content: <EventsTable moduleKey="ad" extraColumns={[{ key: "action", label: "Action" }]} />
    },
    {
      key: "users", label: "User Risk",
      content: <UsersRiskTable moduleKey="ad" />
    },
    {
      key: "gpo", label: "GPO & Logons",
      content: (
        <div className="space-y-4">
          <EventsTable moduleKey="ad" endpoint="/ad/gpo/risky" extraColumns={[{ key: "object_name", label: "GPO" }]} />
          <EventsTable moduleKey="ad" endpoint="/ad/logons/failed" extraColumns={[{ key: "source_ip", label: "Source IP" }]} />
        </div>
      )
    },
    {
      key: "predictions", label: "Predictions",
      content: <ForecastTimeline moduleDefault="ad" fullView />
    },
  ];

  return (
    <ModulePage
      title="Active Directory"
      subtitle="On-premises AD events, GPO changes, logon activity, and PingCastle assessment"
      icon={Shield}
      moduleKey="ad"
      kpis={kpis}
      kpiCards={kpiCards}
      tabs={tabs}
      liveCount={kpis?.total_events_7d}
    />
  );
}
