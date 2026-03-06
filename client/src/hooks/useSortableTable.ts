import { useState, useCallback } from "react";

export function useSortableTable(defaultSortBy = "createdAt", defaultOrder: "asc" | "desc" = "desc") {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultOrder);

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  }, [sortBy]);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  return { currentPage, setCurrentPage, sortBy, sortOrder, handleSort, resetPage };
}
