import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import KpiCard from "../components/dashboard/KpiCard";
import BreachScoreGauge from "../components/dashboard/BreachScoreGauge";
import ModuleRiskGrid from "../components/dashboard/ModuleRiskGrid";
import ForecastTimeline from "../components/dashboard/ForecastTimeline";
import AlertsTable from "../components/tables/AlertsTable";
import ActivitySparklines from "../components/charts/ActivitySparklines";
import PageHeader from "../components/shared/PageHeader";

export default function GlobalDashboard() {
  const { data: kpis }        = useQuery({ queryKey: ["dashboard-kpis"],    queryFn: () => api.get("/dashboard/kpis").then(r => r.data) });
  const { data: alerts }      = useQuery({ queryKey: ["dashboard-alerts"],   queryFn: () => api.get("/dashboard/alerts").then(r => r.data), refetchInterval: 30_000 });
  const { data: breachScore } = useQuery({ queryKey: ["breach-score"],       queryFn: () => api.get("/dashboard/breach_score").then(r => r.data) });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Security Overview"
        subtitle="Aggregate intelligence across all monitored systems"
        live
      />

      {/* Row 1 — breach score + module risk grid */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <BreachScoreGauge score={breachScore?.global_score} trend={breachScore?.trend} />
        </div>
        <div className="col-span-9">
          <ModuleRiskGrid modules={kpis?.kpis} />
        </div>
      </div>

      {/* Row 2 — KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Critical Users"     value={kpis?.kpis?.ad?.critical_users}    trend="up"   color="red" />
        <KpiCard label="Sensitive Files at Risk" value={kpis?.kpis?.fileserver?.sensitive_exposed} trend="up" color="orange" />
        <KpiCard label="Failed Logins (24h)" value={kpis?.kpis?.ad?.failed_logins_24h} trend="down" color="yellow" />
        <KpiCard label="DLP Violations"     value={kpis?.kpis?.exchange?.dlp_violations} trend="stable" color="blue" />
      </div>

      {/* Row 3 — Activity sparklines */}
      <ActivitySparklines />

      {/* Row 4 — Forecast timeline + Alerts table */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <ForecastTimeline />
        </div>
        <div className="col-span-7">
          <AlertsTable alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
