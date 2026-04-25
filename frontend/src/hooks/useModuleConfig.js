import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export function useModuleConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ["module-config"],
    queryFn: () => api.get("/dashboard/summary").then(r => r.data),
    staleTime: 30 * 60 * 1000 // 30 min — matches server cache TTL
  });

  return {
    modules: data?.configured_modules ?? {},
    isLoading
  };
}
