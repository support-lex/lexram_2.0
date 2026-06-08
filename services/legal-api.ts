import axios from "axios";
import { begin as activityBegin, end as activityEnd } from "@/lib/api-activity";

const legalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LEGAL_API_BASE || "/legal-api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

legalApi.interceptors.request.use(async (config) => {
  // Bump the global in-flight counter so the top progress bar in research-2
  // shows during axios calls. Decremented in the matching response/error
  // handlers below.
  activityBegin();
  if (typeof window !== "undefined") {
    // Single auth source — awaits session hydration so this can't fire before
    // the JWT is ready (the cold-load 401 that silently emptied /cases etc.).
    const { getAccessToken } = await import("@/lib/auth-store");
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

legalApi.interceptors.response.use(
  (res) => {
    activityEnd();
    return res;
  },
  (err) => {
    activityEnd();
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Request failed";
    return Promise.reject(
      new Error(typeof message === "string" ? message : JSON.stringify(message))
    );
  }
);

export default legalApi;
