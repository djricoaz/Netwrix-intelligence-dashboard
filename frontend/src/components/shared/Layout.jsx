import { NavLink, useLocation } from "react-router-dom";
import { Shield, Users, Server, Share2, Mail, MessageSquare,
         LayoutDashboard, Bot, Radio, Settings, ChevronRight } from "lucide-react";
import clsx from "clsx";

const MODULE_NAV = [
  { key: "ad",          path: "/ad",          label: "Active Directory", icon: Shield },
  { key: "entra",       path: "/entra",        label: "Entra ID",         icon: Users },
  { key: "fileserver",  path: "/fileserver",   label: "File Server",      icon: Server },
  { key: "sharepoint",  path: "/sharepoint",   label: "SharePoint",       icon: Share2 },
  { key: "exchange",    path: "/exchange",      label: "Exchange Online",  icon: Mail },
  { key: "teams",       path: "/teams",         label: "Teams",            icon: MessageSquare },
];

export default function Layout({ modules = {}, children }) {
  return (
    <div className="flex h-screen bg-[#0a0d14] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0d1117] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">NID</p>
              <p className="text-[10px] text-gray-500">Intelligence Dashboard</p>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <SidebarItem to="/"           icon={LayoutDashboard} label="Overview" exact />
          <SidebarItem to="/ai"         icon={Bot}             label="AI Assistant" />
          <SidebarItem to="/soc"        icon={Radio}           label="SOC Live Feed" />

          <div className="mt-4 mb-2 px-4 text-[10px] uppercase tracking-widest text-gray-600">Modules</div>
          {MODULE_NAV.filter(m => modules[m.key]).map(m => (
            <SidebarItem key={m.key} to={m.path} icon={m.icon} label={m.label} />
          ))}

          {modules.ad && (
            <>
              <div className="mt-4 mb-2 px-4 text-[10px] uppercase tracking-widest text-gray-600">AD Security</div>
              <SidebarItem to="/pingcastle" icon={Shield} label="PingCastle" />
            </>
          )}

          <div className="mt-4 mb-2 px-4 text-[10px] uppercase tracking-widest text-gray-600">Platform</div>
          <SidebarItem to="/integrations" icon={Settings} label="Integrations" />
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 text-[10px] text-gray-600">
          v0.1.0 · Powered by Ollama
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function SidebarItem({ to, icon: Icon, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        clsx("flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all",
          isActive
            ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
            : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
        )
      }
    >
      <Icon size={15} />
      <span className="flex-1">{label}</span>
      <ChevronRight size={12} className="opacity-30" />
    </NavLink>
  );
}
