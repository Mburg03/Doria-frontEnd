import api from './api';

const normalizeError = (error, fallbackMessage, code = 'FETCH_ERROR') => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    fallbackMessage;
  return { message, code, original: error };
};

export const fetchCatalogProducts = async (params = {}) => {
  try {
    const res = await api.get('/catalog/products', { params });
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el catalogo de productos.', 'CATALOG_PRODUCTS');
  }
};
