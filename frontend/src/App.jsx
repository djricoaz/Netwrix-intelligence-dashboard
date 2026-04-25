import { Routes, Route, Navigate } from "react-router-dom";
import { useModuleConfig } from "./hooks/useModuleConfig";
import Layout from "./components/shared/Layout";
import GlobalDashboard from "./pages/GlobalDashboard";
import AdModule from "./pages/AdModule";
import EntraModule from "./pages/EntraModule";
import FilesServerModule from "./pages/FileServerModule";
import SharePointModule from "./pages/SharePointModule";
import ExchangeModule from "./pages/ExchangeModule";
import TeamsModule from "./pages/TeamsModule";
import AiChat from "./pages/AiChat";
import PingCastleUpload from "./pages/PingCastleUpload";
import IntegrationsPage from "./pages/IntegrationsPage";
import SocPage from "./pages/SocPage";
import LoadingScreen from "./components/shared/LoadingScreen";

export default function App() {
  const { modules, isLoading } = useModuleConfig();

  if (isLoading) return <LoadingScreen />;

  return (
    <Layout modules={modules}>
      <Routes>
        <Route path="/" element={<GlobalDashboard />} />
        {modules.ad         && <Route path="/ad/*"          element={<AdModule />} />}
        {modules.entra      && <Route path="/entra/*"        element={<EntraModule />} />}
        {modules.fileserver && <Route path="/fileserver/*"   element={<FilesServerModule />} />}
        {modules.sharepoint && <Route path="/sharepoint/*"   element={<SharePointModule />} />}
        {modules.exchange   && <Route path="/exchange/*"     element={<ExchangeModule />} />}
        {modules.teams      && <Route path="/teams/*"        element={<TeamsModule />} />}
        <Route path="/ai"           element={<AiChat />} />
        <Route path="/soc"          element={<SocPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        {modules.ad         && <Route path="/pingcastle"     element={<PingCastleUpload />} />}
        <Route path="*"     element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
