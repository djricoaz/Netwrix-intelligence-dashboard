import { Shield } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import PingCastlePanel from "../components/dashboard/PingCastlePanel";

export default function PingCastleUpload() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="PingCastle AD Assessment"
        subtitle="Run on-demand scan or upload an existing XML report for AD health analysis and NA event correlation"
        icon={Shield}
      />
      <div className="flex-1 overflow-auto p-6">
        <PingCastlePanel compact={false} />
      </div>
    </div>
  );
}
