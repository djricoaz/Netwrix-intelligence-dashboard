import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 30_000
});

api.interceptors.response.use(
  res => res,
  err => {
    console.error("[API Error]", err.response?.status, err.config?.url);
    return Promise.reject(err);
  }
);

export default api;
