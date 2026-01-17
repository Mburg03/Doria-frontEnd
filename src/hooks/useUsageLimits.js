import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export const useUsageLimits = ({ auto = true } = {}) => {
  const [usageInfo, setUsageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/packages/usage');
      setUsageInfo(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          'No se pudo cargar los límites de uso.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (auto) {
      refreshUsage();
    }
  }, [auto, refreshUsage]);

  return { usageInfo, loading, error, refreshUsage, clearError };
};
