import { useState, useCallback } from 'react';

/**
 * useSearch Hook
 * Manages search state with debouncing
 */
export const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const handleSearch = useCallback((newQuery) => {
    setQuery(newQuery);
    // Debounced value will be updated by the component using setTimeout
    setDebouncedQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    setQuery: handleSearch,
    clearSearch
  };
};
