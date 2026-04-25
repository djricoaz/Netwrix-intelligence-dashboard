import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, CheckCircle, XCircle, Wifi, Loader, RefreshCw, Bot, Clock } from "lucide-react";
import clsx from "clsx";
import api from "../../services/api";
import PageHeader from "../../components/shared/PageHeader";

const TABS = [
  { key: "na",    label: "Netwrix Auditor" },
  { key: "ndc",   label: "Data Classification" },
  { key: "ai",    label: "AI / Ollama" },
  { key: "sync",  label: "Sync Schedule" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("na");

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Manage connections, AI, and sync configuration" icon={Settings} />

      <div className="px-6 border-b border-gray-800 flex gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx("px-4 py-2.5 text-sm border-b-2 transition-colors",
              tab === t.key ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
            )}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        {tab === "na"   && <NaSettings />}
        {tab === "ndc"  && <NdcSettings />}
        {tab === "ai"   && <AiSettings />}
        {tab === "sync" && <SyncSettings />}
      </div>
    </div>
  );
}

function NaSettings() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const [form, setForm] = useState({ na_url: "", na_username: "", na_password: "" });
  const [status, setStatus] = useState(null);

  const test = async () => {
    setStatus("testing");
    try {
      const { data } = await api.post("/settings/test_na", { na_url: form.na_url || cfg?.na_url, na_username: form.na_username || cfg?.na_username, na_password: form.na_password || "(stored)" });
      setStatus(data.connected ? "ok" : "fail");
    } catch { setStatus("fail"); }
  };

  const save = useMutation({
    mutationFn: () => api.put("/settings/na", { na_url: form.na_url || cfg?.na_url, na_username: form.na_username || cfg?.na_username, na_password: form.na_password }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setStatus("ok"); }
  });

  return (
    <div className="space-y-5">
      <ConnectionStatus connected={cfg?.na_connected} lastTest={cfg?.na_last_test} label="Netwrix Auditor" />
      <Field label="Server URL" placeholder={cfg?.na_url || "https://na-server:9699/netwrix/api/v1"}
        value={form.na_url} onChange={v => setForm(f => ({ ...f, na_url: v }))} />
      <Field label="Username" placeholder={cfg?.na_username || "DOMAIN\\serviceaccount"}
        value={form.na_username} onChange={v => setForm(f => ({ ...f, na_username: v }))} />
      <Field label="Password" type="password" placeholder={cfg?.na_password_set ? "••••••• (stored)" : "Enter password"}
        value={form.na_password} onChange={v => setForm(f => ({ ...f, na_password: v }))} />
      <StatusBadge status={status} />
      <div className="flex gap-3">
        <button onClick={test} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800">
          {status === "testing" ? <Loader size={12} className="animate-spin" /> : <Wifi size={12} />} Test
        </button>
        <button onClick={() => save.mutate()} disabled={save.isPending}
          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
          {save.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function NdcSettings() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const [form, setForm] = useState({ ndc_url: "", ndc_username: "", ndc_password: "" });
  const [status, setStatus] = useState(null);

  const test = async () => {
    setStatus("testing");
    try {
      const { data } = await api.post("/settings/test_ndc", { ndc_url: form.ndc_url || cfg?.ndc_url, ndc_username: form.ndc_username || cfg?.ndc_username, ndc_password: form.ndc_password });
      setStatus(data.connected ? "ok" : "fail");
    } catch { setStatus("fail"); }
  };

  const save = useMutation({
    mutationFn: () => api.put("/settings/ndc", { ndc_url: form.ndc_url || cfg?.ndc_url, ndc_username: form.ndc_username || cfg?.ndc_username, ndc_password: form.ndc_password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] })
  });

  return (
    <div className="space-y-5">
      <ConnectionStatus connected={cfg?.ndc_connected} lastTest={cfg?.ndc_last_test} label="Netwrix Data Classification" />
      <Field label="NDC Server URL" placeholder={cfg?.ndc_url || "http://ndc-server"} value={form.ndc_url} onChange={v => setForm(f => ({ ...f, ndc_url: v }))} />
      <Field label="Username" placeholder={cfg?.ndc_username || "DOMAIN\\serviceaccount"} value={form.ndc_username} onChange={v => setForm(f => ({ ...f, ndc_username: v }))} />
      <Field label="Password" type="password" placeholder={cfg?.ndc_password_set ? "••••••• (stored)" : "Enter password"} value={form.ndc_password} onChange={v => setForm(f => ({ ...f, ndc_password: v }))} />
      <StatusBadge status={status} />
      <div className="flex gap-3">
        <button onClick={test} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800">
          {status === "testing" ? <Loader size={12} className="animate-spin" /> : <Wifi size={12} />} Test
        </button>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
          {save.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function AiSettings() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const [form, setForm] = useState({ ollama_url: "", ollama_model: "" });

  const save = useMutation({
    mutationFn: () => api.put("/settings/ai", { ollama_url: form.ollama_url || cfg?.ollama_url, ollama_model: form.ollama_model || cfg?.ollama_model }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] })
  });

  return (
    <div className="space-y-5">
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 text-xs text-blue-300">
        <Bot size={12} className="inline mr-1.5" />
        Ollama runs locally inside Docker — no data leaves your network. Model is downloaded once on first boot.
      </div>
      <Field label="Ollama URL" placeholder={cfg?.ollama_url || "http://ollama:11434"} value={form.ollama_url} onChange={v => setForm(f => ({ ...f, ollama_url: v }))} />
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">Model</label>
        <select value={form.ollama_model || cfg?.ollama_model || "llama3.2"}
          onChange={e => setForm(f => ({ ...f, ollama_model: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
          {["llama3.2", "llama3.1", "mistral", "mistral-nemo", "gemma2"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
        {save.isPending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function SyncSettings() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then(r => r.data) });
  const [interval, setInterval] = useState("");
  const [syncing, setSyncing] = useState(null);

  const save = useMutation({
    mutationFn: () => api.put("/settings/sync", { sync_interval_minutes: interval || cfg?.sync_interval_minutes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] })
  });

  const triggerSync = async (module) => {
    setSyncing(module);
    await api.post(`/sync/${module}`);
    setSyncing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">Sync Interval (minutes)</label>
        <select value={interval || cfg?.sync_interval_minutes || 15}
          onChange={e => setInterval(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500">
          {[5, 10, 15, 30, 60].map(v => <option key={v} value={v}>Every {v} minutes</option>)}
        </select>
      </div>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white disabled:opacity-40">
        {save.isPending ? "Saving..." : "Save Schedule"}
      </button>

      <div className="border-t border-gray-800 pt-6">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Manual Sync</p>
        <div className="grid grid-cols-2 gap-2">
          {["ad", "entra", "fileserver", "sharepoint", "exchange", "teams"].map(mod => (
            <button key={mod} onClick={() => triggerSync(mod)} disabled={syncing === mod}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-40 capitalize">
              {syncing === mod ? <Loader size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Sync {mod}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus({ connected, lastTest, label }) {
  return (
    <div className={clsx("flex items-center gap-3 p-3 rounded-xl border text-xs",
      connected ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-red-500/30 bg-red-500/5 text-red-400"
    )}>
      {connected ? <CheckCircle size={13} /> : <XCircle size={13} />}
      <span>{label}: {connected ? "Connected" : "Not connected"}</span>
      {lastTest && <span className="ml-auto text-gray-500">Last tested: {new Date(lastTest).toLocaleString("en-GB")}</span>}
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
    testing: { icon: <Loader size={11} className="animate-spin" />, text: "Testing...",   cls: "text-gray-400 bg-gray-800 border-gray-700" },
    ok:      { icon: <CheckCircle size={11} />, text: "Connected",   cls: "text-green-400 bg-green-400/10 border-green-400/20" },
    fail:    { icon: <XCircle size={11} />,     text: "Failed — check URL and credentials", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
  }[status];
  return <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${cfg.cls}`}>{cfg.icon}{cfg.text}</div>;
}
