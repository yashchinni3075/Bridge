import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drives a paginated list fetch.
 *
 * Owns page/limit/meta plus two things that are easy to get wrong per-page:
 *  - a request-sequence guard, so a slow earlier request cannot overwrite the
 *    rows of a newer page when the user clicks quickly
 *  - clamping to the last valid page, so deleting the final row of the final
 *    page doesn't leave an empty table on a now out-of-range page
 *
 * `fetchPage(page, limit)` must resolve to `{ items, pagination }`, where
 * `pagination` is the block returned by the backend.
 *
 * `deps` re-runs the fetch when filters change (search, role, tab...) and
 * resets to page 1, since the result set itself changed.
 */
export default function usePagedList(fetchPage, deps = [], { initialLimit = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [reloadKey, setReloadKey] = useState(0);

  const requestId = useRef(0);
  // Held in a ref so a new inline arrow function each render doesn't retrigger
  // the effect, while still calling the latest closure.
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const setLimit = useCallback((next) => {
    setLimitState(next);
    setPage(1);
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const resetPage = useCallback(() => setPage(1), []);

  useEffect(() => {
    const id = ++requestId.current;
    const isCurrent = () => id === requestId.current;

    (async () => {
      setLoading(true);
      try {
        const { items: rows, pagination: meta } = await fetchRef.current(page, limit);
        if (!isCurrent()) return;
        setItems(rows);
        if (meta) {
          setPagination(meta);
          if (meta.totalPages >= 1 && page > meta.totalPages) {
            setPage(meta.totalPages);
          }
        }
      } catch (err) {
        if (isCurrent()) console.error(err);
      } finally {
        if (isCurrent()) setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey, ...deps]);

  return { items, pagination, loading, page, limit, setPage, setLimit, reload, resetPage };
}