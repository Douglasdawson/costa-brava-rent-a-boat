import { useEffect } from 'react';

export function usePrefetchCriticalRoutes() {
  useEffect(() => {
    // Check for network constraints before prefetching
    const shouldPrefetch = () => {
      // Check for Save-Data mode (user has requested reduced data usage)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
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

    // Prefetch critical lazy-loaded chunks after initial load
    const timer = setTimeout(() => {
      // Prefetch BookingFlow (most likely next interaction)
      import('../components/BookingFlow');
      
      // Prefetch popular boat detail pages
      import('../components/BoatDetailPage');
    }, 2000); // Wait 2s after initial load to avoid blocking

    return () => clearTimeout(timer);
  }, []);
}
