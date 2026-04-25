import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import api from "../services/api";
import ModulePage from "../components/shared/ModulePage";
import EventsBarChart from "../components/charts/EventsBarChart";
import EventsTable from "../components/tables/EventsTable";
import SensitiveDataTable from "../components/tables/SensitiveDataTable";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";

export default function ExchangeModule() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis", "exchange"],
    queryFn: () => api.get("/exchange/kpis").then(r => r.data),
    refetchInterval: 60_000
  });

  const kpiCards = [
    { label: "Events (7d)",       value: kpis?.total_events_7d,   color: "blue" },
    { label: "DLP Violations",    value: kpis?.dlp_violations,    color: "red",    trend: "up" },
    { label: "Forwarding Rules",  value: kpis?.forwarding_rules,  color: "red",    trend: "up" },
    { label: "Sensitive Emails",  value: kpis?.sensitive_emails,  color: "orange" },
    { label: "Mailbox Access",    value: kpis?.mailbox_access,    color: "yellow" },
    { label: "Alerts",            value: kpis?.active_alerts,     color: "red" },
  ];

  const tabs = [
    {
      key: "overview", label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Exchange Activity — Last 30 Days</p>
            <EventsBarChart moduleKey="exchange" days={30} height={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-400 mb-3 uppercase tracking-wider font-medium">⚠ Forwarding Rules (Exfil Risk)</p>
              <EventsTable moduleKey="exchange" endpoint="/exchange/forwarding_rules" />
            </div>
            <ForecastTimeline moduleDefault="exchange" />
          </div>
        </div>
      )
    },
    { key: "events",    label: "Events",        content: <EventsTable moduleKey="exchange" extraColumns={[{ key: "object_name", label: "Mailbox" }]} /> },
    { key: "dlp",       label: "DLP Violations", content: <EventsTable moduleKey="exchange" endpoint="/exchange/dlp_violations" /> },
    { key: "sensitive", label: "Sensitive Email", content: <SensitiveDataTable moduleKey="exchange" /> },
    { key: "predict",   label: "Predictions",    content: <ForecastTimeline moduleDefault="exchange" fullView /> },
  ];

  return (
    <ModulePage
      title="Exchange Online"
      subtitle="Mail flow, DLP violations, forwarding rules, and sensitive email classification"
      icon={Mail}
      moduleKey="exchange"
      kpis={kpis}
      kpiCards={kpiCards}
      tabs={tabs}
    />
  );
}
