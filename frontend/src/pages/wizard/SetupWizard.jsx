import { useState } from "react";
import { Shield, CheckCircle, XCircle, Loader, ChevronRight, Wifi } from "lucide-react";
import api from "../../services/api";

const STEPS = [
  { key: "na",           label: "Netwrix Auditor",          desc: "Connect to your Netwrix Auditor server" },
  { key: "ndc",          label: "Data Classification",       desc: "Connect to Netwrix Data Classification" },
  { key: "sources",      label: "Discovered Modules",        desc: "Review what we found in your environment" },
  { key: "integrations", label: "SIEM Integrations",         desc: "Optional: connect your SIEM" },
  { key: "sync",         label: "Initial Sync",              desc: "Pull your first batch of data" },
];

export default function SetupWizard({ onComplete }) {
  const [step, setStep]     = useState(0);
  const [naForm, setNaForm] = useState({ na_url: "https://", na_username: "", na_password: "" });
  const [ndcForm, setNdcForm] = useState({ ndc_url: "http://", ndc_username: "", ndc_password: "" });
  const [naStatus, setNaStatus]   = useState(null);   // null | "testing" | "ok" | "fail"
  const [ndcStatus, setNdcStatus] = useState(null);
  const [sources, setSources]     = useState(null);
  const [syncing, setSyncing]     = useState(false);

  const testNA = async () => {
    setNaStatus("testing");
    try {
      const { data } = await api.post("/settings/test_na", naForm);
      setNaStatus(data.connected ? "ok" : "fail");
    } catch { setNaStatus("fail"); }
  };

  const saveNA = async () => {
    await api.put("/settings/na", naForm);
    setStep(1);
  };

  const testNDC = async () => {
    setNdcStatus("testing");
    try {
      const { data } = await api.post("/settings/test_ndc", ndcForm);
      setNdcStatus(data.connected ? "ok" : "fail");
    } catch { setNdcStatus("fail"); }
  };

  const saveNDC = async () => {
    await api.put("/settings/ndc", ndcForm);
    const { data } = await api.post("/api/v1/sync/discover");
    setSources(data);
    setStep(2);
  };

  const startSync = async () => {
    setSyncing(true);
    await api.post("/settings/complete_setup");
    setTimeout(() => onComplete(), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Netwrix Co-Dashboard</p>
            <p className="text-gray-500 text-xs">Setup Wizard</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? "bg-green-500" : "bg-gray-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">{STEPS[step].label}</h2>
          <p className="text-gray-500 text-sm mb-8">{STEPS[step].desc}</p>

          {/* Step 0 — Netwrix Auditor */}
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Server URL" placeholder="https://na-server:9699/netwrix/api/v1"
                value={naForm.na_url} onChange={v => setNaForm(f => ({ ...f, na_url: v }))} />
              <Field label="Username" placeholder="DOMAIN\serviceaccount"
                value={naForm.na_username} onChange={v => setNaForm(f => ({ ...f, na_username: v }))} />
              <Field label="Password" type="password" placeholder="••••••••"
                value={naForm.na_password} onChange={v => setNaForm(f => ({ ...f, na_password: v }))} />
              <StatusBadge status={naStatus} />
              <div className="flex gap-3 pt-2">
                <button onClick={testNA} disabled={naStatus === "testing" || !naForm.na_url || !naForm.na_username || !naForm.na_password}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
                  <Wifi size={13} /> Test Connection
                </button>
                <button onClick={saveNA} disabled={naStatus !== "ok"}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1 — NDC */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 mb-4">
                <CheckCircle size={12} className="text-green-400" />
                Using same credentials as Netwrix Auditor
                <button onClick={() => setNdcForm(f => ({ ...f, ndc_username: naForm.na_username, ndc_password: naForm.na_password }))}
                  className="ml-auto text-blue-400 hover:text-blue-300">Apply</button>
              </div>
              <Field label="NDC Server URL" placeholder="http://ndc-server"
                value={ndcForm.ndc_url} onChange={v => setNdcForm(f => ({ ...f, ndc_url: v }))} />
              <Field label="Username" placeholder="DOMAIN\serviceaccount"
                value={ndcForm.ndc_username} onChange={v => setNdcForm(f => ({ ...f, ndc_username: v }))} />
              <Field label="Password" type="password" placeholder="••••••••"
                value={ndcForm.ndc_password} onChange={v => setNdcForm(f => ({ ...f, ndc_password: v }))} />
              <StatusBadge status={ndcStatus} />
              <div className="flex gap-3 pt-2">
                <button onClick={testNDC} disabled={ndcStatus === "testing" || !ndcForm.url}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-40">
                  <Wifi size={13} /> Test Connection
                </button>
                <button onClick={saveNDC} disabled={ndcStatus !== "ok"}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
                  Discover Modules <ChevronRight size={14} />
                </button>
              </div>
              <button onClick={() => { setStep(2); setSources({ modules: {} }); }}
                className="text-xs text-gray-600 hover:text-gray-400 w-full text-center mt-2">
                Skip NDC (File Server + SharePoint + Exchange + Teams won't have classification data)
              </button>
            </div>
          )}

          {/* Step 2 — Discovered modules */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(sources?.modules || {}).map(([mod, enabled]) => (
                  <div key={mod} className={`flex items-center gap-3 p-3 rounded-xl border ${enabled ? "border-green-500/30 bg-green-500/5" : "border-gray-700 bg-gray-800/30 opacity-50"}`}>
                    {enabled ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-gray-500" />}
                    <span className="text-sm text-gray-200 capitalize">{mod.replace("_", " ")}</span>
                    <span className="ml-auto text-[10px] text-gray-500">{enabled ? "Active" : "Not found"}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Modules are detected from your NA/NDC configuration. You can re-run discovery anytime from Settings.</p>
              <button onClick={() => setStep(3)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white">
                Continue <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 3 — Integrations (optional) */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">SIEM integrations are optional and can be configured later from the Integrations page.</p>
              <div className="grid grid-cols-2 gap-3">
                {["Splunk", "Microsoft Sentinel", "IBM QRadar", "Elastic SIEM", "Generic Webhook", "CEF TCP"].map(name => (
                  <div key={name} className="flex items-center gap-2 p-3 rounded-xl border border-gray-700 text-sm text-gray-400 opacity-60">
                    <div className="w-2 h-2 rounded-full bg-gray-600" />
                    {name}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800">
                  Skip for now
                </button>
                <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white">
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Sync */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              {!syncing ? (
                <>
                  <p className="text-gray-400 text-sm">Everything is configured. Click below to pull your first batch of audit data and generate AI risk scores.</p>
                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                    {["Activity Records", "Sensitive Data", "User Risk Scores", "AI Predictions", "Breach Score", "Alerts"].map(item => (
                      <div key={item} className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">{item}</div>
                    ))}
                  </div>
                  <button onClick={startSync}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">
                    Start Initial Sync & Open Dashboard
                  </button>
                </>
              ) : (
                <div className="py-8 space-y-4">
                  <Loader size={32} className="animate-spin text-blue-400 mx-auto" />
                  <p className="text-white font-medium">Syncing data from Netwrix...</p>
                  <p className="text-gray-500 text-sm">This runs in the background. Opening dashboard now.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const cfg = {
    testing: { icon: <Loader size={12} className="animate-spin" />, text: "Testing connection...", cls: "text-gray-400 bg-gray-800 border-gray-700" },
    ok:      { icon: <CheckCircle size={12} />, text: "Connected successfully", cls: "text-green-400 bg-green-400/10 border-green-400/20" },
    fail:    { icon: <XCircle size={12} />, text: "Connection failed — check URL and credentials", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
  }[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${cfg.cls}`}>
      {cfg.icon} {cfg.text}
    </div>
  );
}
