// Normalises raw upstream error bodies (FastAPI's `{ "detail": "..." }`,
// connection-refused traces, Hasura-down messages, etc.) into a small,
// caller-friendly response shape that the UI can format gracefully.
//
// We surface three buckets:
//   - `service_unavailable` — the upstream service is reachable but its
//     dependent service (Hasura, Postgres, etc.) is down. Retry shortly.
//   - `upstream_timeout` — upstream took too long. Retry shortly.
//   - `upstream_error` — fallback for anything else 5xx-shaped.
//
// `status` is the HTTP status code the proxy should return to the browser.
// We collapse the raw upstream 5xx into 503 so the client can route on a
// known semantic (Service Unavailable) instead of guessing from the body.

export type NormalizedUpstreamError = {
  status: number;
  body: {
    error: "service_unavailable" | "upstream_timeout" | "upstream_error";
    message: string;
    retry_after_seconds?: number;
  };
};

const SERVICE_DOWN_PATTERNS: RegExp[] = [
  /connection refused/i,
  /econnrefused/i,
  /max retries exceeded/i,
  /failed to establish a new connection/i,
  /127\.0\.0\.1:8080/i,
  /\/v1\/graphql/i,
  /hasura/i,
  /name or service not known/i,
];

const TIMEOUT_PATTERNS: RegExp[] = [
  /timeout/i,
  /timed out/i,
  /etimedout/i,
];

function pickDetail(parsed: unknown): string {
  if (!parsed || typeof parsed !== "object") return "";
  const obj = parsed as Record<string, unknown>;
  for (const key of ["detail", "message", "error"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/**
 * Inspects an upstream response body + status and returns a friendly,
 * client-safe error shape. Always returns `status: 503` for service-down
 * cases and `status: 504` for timeouts; otherwise mirrors a generic 502.
 */
export function normalizeUpstreamError(
  rawBody: string,
  upstreamStatus: number,
): NormalizedUpstreamError {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    /* not JSON — keep raw text */
  }
  const detail = pickDetail(parsed) || rawBody.slice(0, 500);

  if (TIMEOUT_PATTERNS.some((re) => re.test(detail))) {
    return {
      status: 504,
      body: {
        error: "upstream_timeout",
        message: "Search took too long. Try again in a moment.",
        retry_after_seconds: 15,
      },
    };
  }

  if (SERVICE_DOWN_PATTERNS.some((re) => re.test(detail))) {
    return {
      status: 503,
      body: {
        error: "service_unavailable",
        message:
          "Search service is temporarily unavailable. We're working on it — try again shortly.",
        retry_after_seconds: 30,
      },
    };
  }

  // Generic upstream failure — keep status code in the 5xx family but mask
  // the raw stack trace from the browser.
  return {
    status: upstreamStatus >= 500 && upstreamStatus < 600 ? upstreamStatus : 502,
    body: {
      error: "upstream_error",
      message: "Search failed. Try again in a moment.",
    },
  };
}

/**
 * Maps a thrown fetch error (TCP-level: ECONNREFUSED, timeout, etc.) into
 * the same shape. Used by proxy routes when the upstream call throws before
 * returning a response.
 */
export function normalizeFetchError(err: unknown): NormalizedUpstreamError {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return normalizeUpstreamError(JSON.stringify({ detail: msg }), 502);
}
