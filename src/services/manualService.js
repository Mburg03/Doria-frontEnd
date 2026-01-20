import api from './api';

const normalizeError = (error, fallbackMessage, code = 'FETCH_ERROR') => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    fallbackMessage;
  return { message, code, original: error };
};

export const fetchManualProviders = async () => {
  try {
    const res = await api.get('/manual/providers');
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudieron cargar los proveedores.', 'MANUAL_PROVIDERS');
  }
};

export const createManualTransaction = async (payload) => {
  try {
    const res = await api.post('/manual/transactions', payload);
    return res.data;
  } catch (error) {
    throw normalizeError(error, 'No se pudo guardar la factura manual.', 'MANUAL_CREATE');
  }
};
