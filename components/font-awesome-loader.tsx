"use client";

import { useEffect } from "react";

/**
 * Loads the FontAwesome CDN stylesheet without blocking first paint.
 *
 * Uses the print-media + media-swap trick: the <link> is added with
 * media="print" so the browser treats it as low-priority and never
 * blocks render; on load we flip media to "all" so the icons apply.
 *
 * Lives in its own client component because event handlers can't be
 * inlined in a Server Component.
 */
export default function FontAwesomeLoader() {
  useEffect(() => {
    const HREF = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";

    // Avoid double-injection (HMR, StrictMode double-effects).
    if (document.querySelector(`link[data-fa="1"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    link.crossOrigin = "anonymous";
    link.referrerPolicy = "no-referrer";
    link.media = "print";
    link.dataset.fa = "1";
    link.onload = () => {
      link.media = "all";
    };
    link.onerror = () => {
      link.media = "all";
    };

    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, []);

  return null;
}
