import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useEvents(filters = {}) {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counter, setCounter] = useState(0);

  const refetch = useCallback(() => setCounter((c) => c + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );

    api
      .get('/api/events', { params, signal: controller.signal })
      .then((res) => {
        setEvents(res.data.events ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setError('No se pudieron cargar los eventos. Inténtalo más tarde.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), counter]);

  return { events, total, loading, error, refetch };
}
