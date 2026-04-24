// Health + root metadata for the LexRam backend.
// These two endpoints are unauthenticated, so they're cheap to poll for an
// "is the backend up?" status indicator in the UI.

import { lexramRequest } from "../api/lexram.api";

export interface HealthResponse {
  status?: string;
  service?: string;
  [k: string]: unknown;
}

export interface RootResponse {
  service?: string;
  docs?: string;
  [k: string]: unknown;
}

export const healthRepository = {
  /** GET /health — `{status:"ok", service:"lexram-legal-research-v2"}` */
  async health(): Promise<HealthResponse> {
    return lexramRequest<HealthResponse>("/health");
  },

  /** GET / — `{service, docs}` */
  async root(): Promise<RootResponse> {
    return lexramRequest<RootResponse>("/");
  },

  /**
   * Boolean convenience for status badges. Returns true if the backend
   * answers /health with `status: "ok"` within the timeout.
   */
  async isHealthy(timeoutMs = 5000): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch("/legal-api/health", {
        method: "GET",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(t);
      if (!res.ok) return false;
      const data = (await res.json()) as HealthResponse;
      return data.status === "ok";
    } catch {
      return false;
    }
  },
};
