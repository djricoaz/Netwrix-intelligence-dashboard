import { useEffect, useRef, useState } from "react";
import { Radio, AlertTriangle, Info, Shield } from "lucide-react";
import clsx from "clsx";

// SOC Live Feed — connects to Rails ActionCable WebSocket for real-time events
const WS_URL = (import.meta.env.VITE_WS_URL || "ws://localhost:3000") + "/cable";

const SEVERITY_CONFIG = {
  critical: { color: "text-red-400 border-red-500/40 bg-red-500/5",  icon: AlertTriangle },
  high:     { color: "text-orange-400 border-orange-400/40 bg-orange-400/5", icon: AlertTriangle },
  medium:   { color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/5", icon: Shield },
  low:      { color: "text-blue-400 border-blue-400/40 bg-blue-400/5",  icon: Info },
  info:     { color: "text-gray-400 border-gray-700 bg-transparent",     icon: Info },
};

export default function SocLiveFeed({ maxEvents = 200 }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState("all");
  const [paused, setPaused] = useState(false);
  const wsRef = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ command: "subscribe", identifier: JSON.stringify({ channel: "EventsChannel" }) }));
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (msg) => {
      if (paused) return;
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "ping" || !data.message) return;
        const event = data.message;
        setEvents(prev => [event, ...prev].slice(0, maxEvents));
      } catch {}
    };

    return () => ws.close();
  }, [paused]);

  const filtered = filter === "all" ? events : events.filter(e => e.severity === filter);

  return (
    <div className="bg-[#0d1117] rounded-xl border border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Radio size={14} className={connected ? "text-green-400 animate-pulse" : "text-red-400"} />
          <span className="text-sm font-medium text-white">SOC Live Feed</span>
          <span className="text-[10px] text-gray-500">{connected ? "LIVE" : "DISCONNECTED"}</span>
        </div>
        <div className="flex items-center gap-2">
          {["all", "critical", "high", "medium"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx("text-[10px] px-2 py-1 rounded capitalize", filter === f ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setPaused(p => !p)}
            className={clsx("text-[10px] px-2 py-1 rounded", paused ? "bg-yellow-500/20 text-yellow-400" : "text-gray-500 hover:text-gray-300")}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto font-mono text-xs">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-600">Waiting for events...</div>
        )}
        {filtered.map((evt, i) => {
          const cfg = SEVERITY_CONFIG[evt.severity] || SEVERITY_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div key={i} className={clsx("flex items-start gap-3 px-4 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer", cfg.color)}>
              <Icon size={11} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-gray-500">{formatTime(evt.timestamp)}</span>
                  <span className="uppercase text-[9px] font-bold tracking-wider">{evt.severity}</span>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1 rounded">{evt.module}</span>
                  <span className="text-[10px] text-gray-500">{evt.source}</span>
                </div>
                <p className="truncate text-gray-300">{evt.what || evt.event_name}</p>
                {evt.who && <p className="text-[10px] text-gray-500">by {evt.who} {evt.where ? `on ${evt.where}` : ""}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-gray-800 text-[10px] text-gray-600">
        {filtered.length} events {paused && "· paused"}
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}
