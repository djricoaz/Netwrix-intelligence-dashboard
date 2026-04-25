import { Radio, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function PageHeader({ title, subtitle, icon: Icon, live, liveCount }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    window.location.reload();
  };

  return (
    <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 bg-blue-600/15 border border-blue-600/25 rounded-xl flex items-center justify-center">
            <Icon size={17} className="text-blue-400" />
          </div>
        )}
        <div>
          <h1 className="text-base font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {live && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Radio size={11} className="text-green-400 animate-pulse" />
            {liveCount != null ? <span>{liveCount} events/hr</span> : <span>LIVE</span>}
          </div>
        )}
        <button onClick={handleRefresh} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
