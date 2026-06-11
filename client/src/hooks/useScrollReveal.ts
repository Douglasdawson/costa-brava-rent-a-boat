import { useCallback, useEffect, useState } from "react";

export function useScrollReveal(threshold = 0.1) {
  // Callback ref instead of useRef: sections that render after a data fetch
  // (ReviewsSection, JetSkiLanding testimonials) mount their node AFTER the
  // first effect ran with ref.current = null, so a RefObject-based observer
  // was never attached and the section stayed at opacity-0 forever.
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const ref = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;

    // Fallback: if IntersectionObserver is not supported, show immediately
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin: "0px 0px 100px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [node, threshold]);

  return { ref, isVisible };
}
