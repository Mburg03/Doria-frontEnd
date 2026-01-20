import api from './api';

const normalizeError = (error, fallbackMessage, code = 'FETCH_ERROR') => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    fallbackMessage;
  return { message, code, original: error };
};

export const fetchCategories = async () => {
  try {
    const res = await api.get('/categories');
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudieron cargar las categorias.', 'CATEGORIES_LIST');
  }
};

export const createCategory = async (payload) => {
  try {
    const res = await api.post('/categories', payload);
    return res.data;
  } catch (error) {
    throw normalizeError(error, 'No se pudo crear la categoria.', 'CATEGORIES_CREATE');
  }
};

export const updateCategory = async (categoryId, payload) => {
  try {
    const res = await api.patch(`/categories/${categoryId}`, payload);
    return res.data;
  } catch (error) {
    throw normalizeError(error, 'No se pudo actualizar la categoria.', 'CATEGORIES_UPDATE');
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const res = await api.delete(`/categories/${categoryId}`);
    return res.data;
  } catch (error) {
    throw normalizeError(error, 'No se pudo eliminar la categoria.', 'CATEGORIES_DELETE');
  }
};

export const fetchCategoryProviders = async (categoryId) => {
  try {
    const res = await api.get(`/categories/${categoryId}/providers`);
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudieron cargar proveedores de categoria.', 'CATEGORY_PROVIDERS');
  }
};

export const fetchCategoryProducts = async (categoryId) => {
  try {
    const res = await api.get(`/categories/${categoryId}/products`);
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudieron cargar productos de categoria.', 'CATEGORY_PRODUCTS');
  }
};

export const addCategoryAssignments = async (categoryId, payload) => {
  try {
    const res = await api.post(`/categories/${categoryId}/assignments`, payload);
    return res.data;
  } catch (error) {
    throw normalizeError(error, 'No se pudo asignar elementos.', 'CATEGORY_ASSIGN');
  }
};

export const removeCategoryAssignment = async (categoryId, payload) => {
  try {
    const res = await api.delete(`/categories/${categoryId}/assignments`, { data: payload });
    return res.data;
  } catch (error) {
    throw normalizeError(error, 'No se pudo quitar la asignacion.', 'CATEGORY_REMOVE');
  }
};

export const fetchCategorySummary = async (categoryId, params) => {
  try {
    const res = await api.get(`/categories/${categoryId}/summary`, { params });
    return res.data?.totals || {};
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar el resumen.', 'CATEGORY_SUMMARY');
  }
};

export const fetchCategorySeries = async (categoryId, params) => {
  try {
    const res = await api.get(`/categories/${categoryId}/series`, { params });
    return res.data?.series || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar la serie.', 'CATEGORY_SERIES');
  }
};

export const fetchCategoryTopProviders = async (categoryId, params) => {
  try {
    const res = await api.get(`/categories/${categoryId}/top-providers`, { params });
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar top proveedores.', 'CATEGORY_TOP_PROVIDERS');
  }
};

export const fetchCategoryTopProducts = async (categoryId, params) => {
  try {
    const res = await api.get(`/categories/${categoryId}/top-products`, { params });
    return res.data?.items || [];
  } catch (error) {
    throw normalizeError(error, 'No se pudo cargar top productos.', 'CATEGORY_TOP_PRODUCTS');
  }
};
