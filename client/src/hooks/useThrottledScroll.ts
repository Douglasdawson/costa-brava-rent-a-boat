import { useEffect, useRef } from "react";

/**
 * Throttled scroll listener — fires callback at most once per `delay` ms.
 * Uses requestAnimationFrame for smooth 60fps-aligned updates.
 */
export function useThrottledScroll(callback: (scrollY: number) => void, delay = 250) {
  const lastRun = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const handler = () => {
      const now = performance.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(window.scrollY);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(handler);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [callback, delay]);
}
