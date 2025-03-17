
import { useState, useEffect } from "react";

export function useProjectFilters() {
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reset scroll position when filters change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [clientFilter, searchQuery]);

  return {
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery
  };
}
