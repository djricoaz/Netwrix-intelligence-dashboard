import { Radio } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import SocLiveFeed from "../components/soc/SocLiveFeed";
import AlertsTable from "../components/tables/AlertsTable";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export default function SocPage() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts-soc"],
    queryFn: () => api.get("/dashboard/alerts").then(r => r.data),
    refetchInterval: 15_000
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="SOC Live Feed"
        subtitle="Real-time event stream from all monitored systems"
        icon={Radio}
        live
      />

      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4 p-4">
        {/* Live stream */}
        <div className="col-span-7 flex flex-col min-h-0">
          <SocLiveFeed maxEvents={500} />
        </div>

        {/* Active alerts panel */}
        <div className="col-span-5 flex flex-col min-h-0 overflow-auto">
          <AlertsTable alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
