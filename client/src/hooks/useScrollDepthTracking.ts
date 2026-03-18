import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '@/utils/analytics';

export function useScrollDepthTracking(pageName: string) {
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    firedRef.current = new Set<number>();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const percentage = Math.round((window.scrollY / scrollHeight) * 100);

      const thresholds = [25, 50, 75, 100] as const;
      for (const threshold of thresholds) {
        if (percentage >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          trackScrollDepth(pageName, threshold);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageName]);
}
