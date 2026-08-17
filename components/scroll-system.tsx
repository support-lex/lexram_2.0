"use client";

/**
 * ScrollSystem — animation-only layer.
 *
 * This component sits on top of the existing UI without modifying it.
 * It drives:
 *   • Lenis    — smooth wheel/touch scroll
 *   • GSAP     — ScrollTrigger reveal / stagger / parallax
 *
 * Elements are targeted via data-attributes added alongside (not replacing)
 * their existing class names. A CSS failsafe forces visibility after 2.5s
 * so content is always readable even if GSAP loads slowly.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Animation presets ─────────────────────────────────────────────── */
const FROM: Record<string, gsap.TweenVars> = {
  "fade-up":    { opacity: 0, y: 48 },
  "fade-down":  { opacity: 0, y: -48 },
  "fade-left":  { opacity: 0, x: -56 },
  "fade-right": { opacity: 0, x: 56 },
  "scale-in":   { opacity: 0, scale: 0.88 },
  "blur-in":    { opacity: 0, y: 20, filter: "blur(12px)" },
};

export function ScrollSystem() {
  const pathname = usePathname();

  useEffect(() => {
    /* Skip dashboard / auth routes */
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/admin")
    ) return;

    let mounted = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = null;
    let lenis: { raf(t: number): void; on(e: string, cb: unknown): void; destroy(): void } | null = null;

    /* CSS failsafe — if GSAP hasn't fired within 2.5 s, show everything */
    const failsafeId = window.setTimeout(() => {
      document.querySelectorAll("[data-animate], [data-stagger] > *").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
        (el as HTMLElement).style.filter = "none";
      });
    }, 2500);

    const init = async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);

      if (!mounted) return;
      gsap.registerPlugin(ScrollTrigger);

      /* ── Lenis smooth scroll ─────────────────────────────────── */
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }) as typeof lenis;

      lenis!.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis!.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      /* ── GSAP context ────────────────────────────────────────── */
      ctx = gsap.context(() => {

        /* Reveal: [data-animate="..."] ─────────────────────────── */
        gsap.utils.toArray<HTMLElement>("[data-animate]").forEach((el) => {
          const key   = el.dataset.animate ?? "fade-up";
          const delay = parseFloat(el.dataset.delay ?? "0");
          const from  = FROM[key] ?? FROM["fade-up"];

          gsap.from(el, {
            ...from,
            duration: 0.85,
            delay,
            ease: "power2.out",
            clearProps: "filter,transform",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
              once: true,
            },
          });
        });

        /* Stagger: [data-stagger] ───────────────────────────────── */
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((wrap) => {
          const key   = (wrap.dataset.staggerFrom ?? "fade-up") as string;
          const gap   = parseFloat(wrap.dataset.staggerDelay ?? "0.08");
          const from  = FROM[key] ?? FROM["fade-up"];

          gsap.from(Array.from(wrap.children) as HTMLElement[], {
            ...from,
            duration: 0.72,
            stagger: gap,
            ease: "power2.out",
            clearProps: "filter,transform",
            scrollTrigger: {
              trigger: wrap,
              start: "top 88%",
              toggleActions: "play none none none",
              once: true,
            },
          });
        });

        /* Parallax: [data-parallax="speed"] ────────────────────── */
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const speed = parseFloat(el.dataset.parallax ?? "0.25");
          gsap.to(el, {
            yPercent: speed * -100,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        });

      });

      ScrollTrigger.refresh();
      clearTimeout(failsafeId);
    };

    init();

    return () => {
      mounted = false;
      clearTimeout(failsafeId);
      lenis?.destroy();
      ctx?.revert?.();
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}