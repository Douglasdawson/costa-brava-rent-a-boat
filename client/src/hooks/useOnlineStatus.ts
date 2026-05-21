import { useEffect, useState } from "react";

// Reactive wrapper around `navigator.onLine`. SSR-safe: defaults to `true`
// on the server (where there's no network signal to act on) so optimistic
// UI doesn't flash an offline state during hydration. Subscribes to the
// browser `online`/`offline` events so consumers re-render when the
// connection state flips.
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
