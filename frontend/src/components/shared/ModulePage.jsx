import { useState } from "react";
import clsx from "clsx";
import KpiCard from "../dashboard/KpiCard";
import PageHeader from "./PageHeader";
import ForecastTimeline from "../dashboard/ForecastTimeline";

export default function ModulePage({ title, subtitle, icon, moduleKey, kpis = {}, kpiCards = [], tabs = [], liveCount }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key);

  const activeContent = tabs.find(t => t.key === activeTab)?.content;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title} subtitle={subtitle} icon={icon} live liveCount={liveCount} />

      {/* KPI strip */}
      <div className="px-6 pt-2 pb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {kpiCards.map((card, i) => (
          <KpiCard key={i} {...card} />
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-800 flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "px-4 py-2.5 text-sm border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {activeContent}
      </div>
    </div>
  );
}
