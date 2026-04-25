import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import api from "../services/api";
import ModulePage from "../components/shared/ModulePage";
import EventsBarChart from "../components/charts/EventsBarChart";
import EventsTable from "../components/tables/EventsTable";
import UsersRiskTable from "../components/tables/UsersRiskTable";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";

export default function EntraModule() {
  const { data: kpis } = useQuery({
    queryKey: ["kpis", "entra"],
    queryFn: () => api.get("/entra/kpis").then(r => r.data),
    refetchInterval: 60_000
  });

  const kpiCards = [
    { label: "Events (7d)",       value: kpis?.total_events_7d,   color: "blue" },
    { label: "Risky Sign-ins",    value: kpis?.risky_sign_ins,    color: "red",    trend: "up" },
    { label: "MFA Failures",      value: kpis?.mfa_failures,      color: "orange", trend: "up" },
    { label: "CA Bypasses",       value: kpis?.ca_bypasses,       color: "red" },
    { label: "App Consents",      value: kpis?.app_consents,       color: "yellow" },
    { label: "MFA Disabled",      value: kpis?.disabled_mfa_users, color: "red", trend: "up" },
  ];

  const tabs = [
    {
      key: "overview", label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Entra ID Activity — Last 30 Days</p>
            <EventsBarChart moduleKey="entra" days={30} height={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <EventsTable moduleKey="entra" endpoint="/entra/sign_ins/risky" />
            <ForecastTimeline moduleDefault="entra" />
          </div>
        </div>
      )
    },
    { key: "signin",  label: "Sign-ins",           content: <EventsTable moduleKey="entra" endpoint="/entra/sign_ins" extraColumns={[{ key: "source_ip", label: "IP" }]} /> },
    { key: "users",   label: "User Risk",           content: <UsersRiskTable moduleKey="entra" /> },
    { key: "ca",      label: "Conditional Access",  content: <EventsTable moduleKey="entra" endpoint="/entra/conditional_access" /> },
    { key: "consents",label: "App Consents",        content: <EventsTable moduleKey="entra" endpoint="/entra/app_consents" /> },
    { key: "predict", label: "Predictions",         content: <ForecastTimeline moduleDefault="entra" fullView /> },
  ];

  return (
    <ModulePage
      title="Entra ID"
      subtitle="Azure AD sign-ins, MFA, conditional access, and application consents"
      icon={Users}
      moduleKey="entra"
      kpis={kpis}
      kpiCards={kpiCards}
      tabs={tabs}
    />
  );
}
