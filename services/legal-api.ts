import axios from "axios";

const legalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LEGAL_API_URL || "/legal-api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

legalApi.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const { supabase } = await import("@/lib/supabase/client");
    const { data } = await supabase().auth.getSession();
    const token = data.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

legalApi.interceptors.response.use(
  (res) => res,
  (err) => {
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
