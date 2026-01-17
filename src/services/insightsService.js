import api from './api';

const normalizeError = (error, fallbackMessage, code = 'FETCH_ERROR') => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    fallbackMessage;
  return { message, code, original: error };
};

export const fetchInsightsStats = async (params) => {
  try {
    const res = await api.get('/insights/stats', { params });
    return {
      range: res.data?.range || {},
      totals: res.data?.totals || {},
      series: res.data?.series || []
    };
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el resumen de insights.', 'INSIGHTS_STATS');
  }
};

export const fetchProviders = async (params) => {
  try {
    const res = await api.get('/insights/providers', { params });
    return {
      range: res.data?.range || {},
      items: res.data?.items || []
    };
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el listado de proveedores.', 'INSIGHTS_PROVIDERS');
  }
};

export const fetchProducts = async (params) => {
  try {
    const res = await api.get('/insights/products', { params });
    return {
      range: res.data?.range || {},
      items: res.data?.items || []
    };
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el listado de productos.', 'INSIGHTS_PRODUCTS');
  }
};

export const fetchAnnulled = async (params) => {
  try {
    const res = await api.get('/insights/annulled', { params });
    return {
      page: res.data?.page || 1,
      limit: res.data?.limit || 20,
      total: res.data?.total || 0,
      items: res.data?.items || []
    };
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el listado de anulados.', 'INSIGHTS_ANNULLED');
  }
};

export const fetchProviderBundle = async (params) => {
  try {
    const [detailsRes, productsRes] = await Promise.all([
      api.get('/insights/provider', { params }),
      api.get('/insights/products/provider', { params })
    ]);
    return {
      details: detailsRes.data?.items || [],
      products: productsRes.data?.items || []
    };
  } catch (error) {
    throw normalizeError(error, 'No se pudieron cargar las facturas del proveedor.', 'PROVIDER_BUNDLE');
  }
};

export const fetchProductDetail = async (params) => {
  try {
    const res = await api.get('/insights/product', { params });
    return {
      product: res.data?.product || null,
      history: res.data?.history || []
    };
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el detalle del producto.', 'PRODUCT_DETAIL');
  }
};
