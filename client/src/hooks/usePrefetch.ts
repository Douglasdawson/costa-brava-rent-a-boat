import { useEffect } from 'react';

export function usePrefetchCriticalRoutes() {
  useEffect(() => {
    // Check for network constraints before prefetching
    const shouldPrefetch = () => {
      // Check for Save-Data mode (user has requested reduced data usage)
      if ('connection' in navigator) {
        const connection = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
        
        // Don't prefetch if Save-Data is enabled
        if (connection?.saveData) {
          return false;
        }
        
        // Don't prefetch on slow connections (2g or slow-2g)
        const effectiveType = connection?.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          return false;
        }
      }
      
      return true;
    };

    if (!shouldPrefetch()) {
      return;
    }

    // Prefetch only BookingFlow (most likely next interaction) during idle time.
    // Don't prefetch BoatDetailPage, category, or pricing — they load fast via
    // code-splitting and prefetching them adds to Lighthouse "unused JS" score.
    const prefetch = () => {
      import('../components/BookingFlow');
    };

    if ('requestIdleCallback' in window) {
      const id = (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(prefetch);
      return () => (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 3000);
    return () => clearTimeout(timer);
  }, []);
}
