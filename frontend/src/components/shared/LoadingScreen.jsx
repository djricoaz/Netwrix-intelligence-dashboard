import { Shield, Loader } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 bg-blue-600/20 border border-blue-600/30 rounded-2xl flex items-center justify-center">
        <Shield size={26} className="text-blue-400" />
      </div>
      <p className="text-sm text-gray-400">Loading Netwrix Intelligence...</p>
      <Loader size={16} className="animate-spin text-blue-500" />
    </div>
  );
}
