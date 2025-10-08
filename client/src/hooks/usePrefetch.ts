import { useEffect } from 'react';

export function usePrefetchCriticalRoutes() {
  useEffect(() => {
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
