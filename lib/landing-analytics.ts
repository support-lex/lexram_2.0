/**
 * Lightweight analytics dispatcher used by the landing page.
 * Forwards events to:
 *  - window.dataLayer (GTM-compatible)
 *  - window.lovableAnalytics (downstream tools)
 *  - console (dev visibility)
 * Never throws — analytics must not break the UI.
 */
export type AnalyticsEvent =
  | "cta_start_research_click"
  | "cta_book_demo_click"
  | "cta_start_trial_click"
  | "cta_login_click"
  | "cta_talk_sales_click"
  | "cta_see_pricing_click"
  | "contact_form_submit"
  | "faq_toggle"
  | "pricing_plan_hover"
  | "pricing_plan_click";

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    lovableAnalytics?: Array<{ event: string; props?: Props; ts: number }>;
  }
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    const payload = { event, ...props, ts: Date.now() };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    window.lovableAnalytics = window.lovableAnalytics || [];
    window.lovableAnalytics.push({ event, props, ts: payload.ts });
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  } catch {
    /* swallow */
  }
}
