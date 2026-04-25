import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, CheckCircle, XCircle, Zap, ArrowRight, Loader } from "lucide-react";
import clsx from "clsx";
import api from "../services/api";
import PageHeader from "../components/shared/PageHeader";

const DIRECTION_LABEL = { inbound: "Inbound ↓", outbound: "Outbound ↑" };
const DIRECTION_COLOR  = { inbound: "text-green-400 bg-green-400/10 border-green-400/20", outbound: "text-blue-400 bg-blue-400/10 border-blue-400/20" };

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [configuring, setConfiguring] = useState(null);
  const [testing, setTesting]         = useState(null);
  const [form, setForm]               = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["integrations-catalog"],
    queryFn: () => api.get("/integrations/connectors").then(r => r.data)
  });

  const save = useMutation({
    mutationFn: ({ name, enabled, settings }) =>
      api.put(`/integrations/connectors/${name}`, { enabled, settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations-catalog"] });
      setConfiguring(null);
    }
  });

  const testConnector = async (name) => {
    setTesting(name);
    try {
      const { data: result } = await api.post(`/integrations/connectors/${name}/test`);
      alert(`Connection test ${result.status === "ok" ? "✓ succeeded" : "✗ failed"}: ${JSON.stringify(result.result)}`);
    } catch (e) {
      alert(`Connection test failed: ${e.response?.data?.message || e.message}`);
    }
    setTesting(null);
  };

  const allConnectors = [
    ...(data?.inbound  || []).map(c => ({ ...c, direction: "inbound" })),
    ...(data?.outbound || []).map(c => ({ ...c, direction: "outbound" })),
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Integrations"
        subtitle="Connect SIEMs, ticketing systems, and other platforms"
        icon={Settings}
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading && <div className="text-gray-500 text-sm">Loading connectors...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allConnectors.map(connector => (
            <ConnectorCard
              key={connector.name}
              connector={connector}
              onConfigure={() => { setConfiguring(connector); setForm(connector.settings || {}); }}
              onTest={() => testConnector(connector.name)}
              testing={testing === connector.name}
            />
          ))}
        </div>
      </div>

      {/* Configure modal */}
      {configuring && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-base font-semibold text-white mb-1">{configuring.label}</h2>
            <p className="text-xs text-gray-500 mb-5">{configuring.description}</p>

            <div className="space-y-4">
              {Object.entries(configuring.schema || {}).map(([key, meta]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{meta.label}</label>
                  {meta.type === "select" ? (
                    <select value={form[key] || meta.default || ""}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
                      {(meta.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={meta.type === "password" ? "password" : "text"}
                      value={form[key] || meta.default || ""}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={meta.label}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfiguring(null)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:bg-gray-800">
                Cancel
              </button>
              <button
                onClick={() => save.mutate({ name: configuring.name, enabled: true, settings: form })}
                disabled={save.isPending}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
                {save.isPending ? "Saving..." : "Save & Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectorCard({ connector, onConfigure, onTest, testing }) {
  return (
    <div className={clsx("bg-[#0d1117] border rounded-xl p-4 flex flex-col gap-3 transition-colors",
      connector.enabled ? "border-blue-600/30" : "border-gray-800"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white">{connector.label}</p>
          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{connector.description}</p>
        </div>
        <div className={clsx("text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase flex-shrink-0 ml-2", DIRECTION_COLOR[connector.direction])}>
          {DIRECTION_LABEL[connector.direction]}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <div className="flex items-center gap-1.5">
          {connector.enabled
            ? <><CheckCircle size={11} className="text-green-400" /><span className="text-[10px] text-green-400">Enabled</span></>
            : <><XCircle size={11} className="text-gray-500" /><span className="text-[10px] text-gray-500">Disabled</span></>
          }
        </div>
        {connector.last_sync && (
          <span className="text-[10px] text-gray-600 ml-auto">
            Last sync: {new Date(connector.last_sync).toLocaleTimeString("en-GB")}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onConfigure}
          className="flex-1 text-xs py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center gap-1">
          <Settings size={11} />
          Configure
        </button>
        {connector.enabled && (
          <button onClick={onTest} disabled={testing}
            className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 hover:bg-blue-600/30 text-blue-400 flex items-center justify-center gap-1 disabled:opacity-40">
            {testing ? <Loader size={11} className="animate-spin" /> : <Zap size={11} />}
            Test
          </button>
        )}
      </div>
    </div>
  );
}
