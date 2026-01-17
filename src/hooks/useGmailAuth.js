import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_STATUS = {
  connected: false,
  checking: true,
  accounts: [],
  needsReconnect: false
};

export const useGmailAuth = ({ auto = true } = {}) => {
  const [gmailStatus, setGmailStatus] = useState(DEFAULT_STATUS);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/gmail/status');
      const accounts = res.data.accounts || [];
      const activeAccounts = accounts.filter((account) => account.status !== 'disabled');
      const primary = activeAccounts.find((account) => account.primary) || activeAccounts[0] || null;
      const primaryExpired = primary?.authState === 'expired';

      setGmailStatus({
        connected: activeAccounts.length > 0 && !primaryExpired,
        checking: false,
        accounts,
        needsReconnect: primaryExpired
      });
      if (primary) {
        setActiveAccount({ ...primary, id: primary.id || primary._id });
      } else {
        setActiveAccount(null);
      }
    } catch (err) {
      setGmailStatus({ ...DEFAULT_STATUS, checking: false });
      setActiveAccount(null);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          'No se pudo cargar el estado de Gmail.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnectGmail = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/gmail/auth');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          'No se pudo iniciar la conexión con Gmail.'
      );
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (auto) {
      refreshStatus();
    }
  }, [auto, refreshStatus]);

  return {
    gmailStatus,
    activeAccount,
    loading,
    error,
    refreshStatus,
    handleConnectGmail,
    clearError
  };
};
