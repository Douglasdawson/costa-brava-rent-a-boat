import { useState, useCallback, useRef } from "react";

export function useDebounceSearch(delay = 300) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, delay);
  }, [delay]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { searchQuery, debouncedSearch, handleSearchChange, clearSearch };
}
