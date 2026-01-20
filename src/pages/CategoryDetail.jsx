import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addCategoryAssignments,
  fetchCategories,
  fetchCategoryProducts,
  fetchCategoryProviders,
  fetchCategorySeries,
  fetchCategorySummary,
  fetchCategoryTopProducts,
  fetchCategoryTopProviders,
  removeCategoryAssignment
} from '../services/categoriesService';
import { fetchCatalogProducts } from '../services/catalogService';
import { fetchManualProviders } from '../services/manualService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { getDefaultRange } from '../utils/dateRange';
import DailySpendChart from '../components/insights/DailySpendChart';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ArrowLeft, Package, PlusCircle, RefreshCw, Tag, Trash2, Users, ChevronRight, Search, X, TrendingUp, Calendar } from 'lucide-react';
import ProductHistoryModal from '../components/insights/ProductHistoryModal';
import Toast from '../components/Toast';
import CategoryKPICard from '../components/insights/CategoryKPICard';

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryError, setCategoryError] = useState(null);

  const [providersDirectory, setProvidersDirectory] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providerToAdd, setProviderToAdd] = useState('');
  const [activeProviderForProducts, setActiveProviderForProducts] = useState('');

  const [productQuery, setProductQuery] = useState('');
  const debouncedProductQuery = useDebouncedValue(productQuery);
  const [productResults, setProductResults] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const [categoryProviders, setCategoryProviders] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categorySummary, setCategorySummary] = useState({ documents: 0, subTotal: 0, iva: 0, total: 0 });
  const [categorySeries, setCategorySeries] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState(null);

  // Estados para feedback visual
  const [assigningProvider, setAssigningProvider] = useState(false);
  const [assigningProducts, setAssigningProducts] = useState(false);
  const [removingProvider, setRemovingProvider] = useState(null);
  const [removingProduct, setRemovingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const loadCategory = async () => {
    setCategoryError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
      const found = data.find((category) => category.id === id);
      setSelectedCategory(found || null);
      if (!found && data.length) {
        navigate('/categories');
      }
    } catch (err) {
      setCategoryError(err?.message || 'No se pudo cargar la categoria.');
    }
  };

  const loadProvidersDirectory = async () => {
    setProvidersLoading(true);
    try {
      const data = await fetchManualProviders();
      setProvidersDirectory(data);
    } catch (err) {
      // silent
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadCategoryDetail = async () => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      const [providers, products, summary, series, topProv, topProd] = await Promise.all([
        fetchCategoryProviders(id),
        fetchCategoryProducts(id),
        fetchCategorySummary(id, params),
        fetchCategorySeries(id, params),
        fetchCategoryTopProviders(id, params),
        fetchCategoryTopProducts(id, params)
      ]);
      setCategoryProviders(providers);
      setCategoryProducts(products);
      setCategorySummary(summary);
      setCategorySeries(series);
      setTopProviders(topProv);
      setTopProducts(topProd);
    } catch (err) {
      // silent
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadCategory();
    loadProvidersDirectory();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadCategoryDetail();
  }, [id, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const hasQuery = debouncedProductQuery.trim().length > 0;
    if (!activeProviderForProducts) {
      setProductResults([]);
      return;
    }

    const fetchProducts = async () => {
      setProductLoading(true);
      try {
        const params = {
          limit: 20,
          providerId: activeProviderForProducts
        };
        if (hasQuery) {
          params.query = debouncedProductQuery;
        }
        const items = await fetchCatalogProducts(params);
        setProductResults(items);
      } catch (err) {
        setProductResults([]);
      } finally {
        setProductLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedProductQuery, activeProviderForProducts]);

  const handleAddProvider = async () => {
    if (!providerToAdd || !id) return;
    setAssigningProvider(true);
    try {
      await addCategoryAssignments(id, { providerIds: [providerToAdd] });
      setToast({ message: 'Proveedor agregado exitosamente', type: 'success' });
      setActiveProviderForProducts(providerToAdd);
      setSelectedProductIds([]);
      loadCategoryDetail();
      loadCategory();
    } catch (err) {
      setToast({ message: err?.message || 'No se pudo asignar el proveedor.', type: 'error' });
    } finally {
      setAssigningProvider(false);
    }
  };

  const handleRemoveProvider = async (providerId) => {
    if (!id) return;
    setRemovingProvider(providerId);
    try {
      await removeCategoryAssignment(id, { providerId });
      setToast({ message: 'Proveedor eliminado exitosamente', type: 'success' });
      loadCategoryDetail();
      loadCategory();
    } catch (err) {
      setToast({ message: err?.message || 'No se pudo eliminar el proveedor.', type: 'error' });
    } finally {
      setRemovingProvider(null);
      setConfirmDelete(null);
    }
  };

  const handleAddProducts = async () => {
    if (!selectedProductIds.length || !id) return;
    setAssigningProducts(true);
    try {
      await addCategoryAssignments(id, { productIds: selectedProductIds });
      setToast({ message: `${selectedProductIds.length} producto(s) agregado(s) exitosamente`, type: 'success' });
      setSelectedProductIds([]);
      loadCategoryDetail();
      loadCategory();
    } catch (err) {
      setToast({ message: err?.message || 'No se pudieron agregar los productos.', type: 'error' });
    } finally {
      setAssigningProducts(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!id) return;
    setRemovingProduct(productId);
    try {
      await removeCategoryAssignment(id, { productId });
      setToast({ message: 'Producto eliminado exitosamente', type: 'success' });
      loadCategoryDetail();
      loadCategory();
    } catch (err) {
      setToast({ message: err?.message || 'No se pudo eliminar el producto.', type: 'error' });
    } finally {
      setRemovingProduct(null);
      setConfirmDelete(null);
    }
  };

  const totals = useMemo(() => ({
    documents: categorySummary.documents || 0,
    subTotal: categorySummary.subTotal || 0,
    iva: categorySummary.iva || 0,
    total: categorySummary.total || 0
  }), [categorySummary]);

  if (categoryError) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-red-600 text-sm">
        {categoryError}
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-500 text-sm">
        Cargando categoria...
      </div>
    );
  }

  return (
    <>
      {/* Header con gradiente */}
      <div className="relative overflow-hidden mb-6 -mx-6 -mt-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50" />
        <div className="relative px-6 py-8">
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Volver a categorías
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform"
                style={{ backgroundColor: selectedCategory.color }}
              >
                <Tag size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{selectedCategory.name}</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  {selectedCategory.description || 'Analiza el rendimiento de esta categoría.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={dateRange.startDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="text-xs border-none focus:ring-0 p-0 font-bold text-gray-700 bg-transparent"
              />
              <span className="text-gray-300 font-bold">—</span>
              <input
                type="date"
                value={dateRange.endDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="text-xs border-none focus:ring-0 p-0 font-bold text-gray-700 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-8 border-b border-gray-50 pb-px">
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'productos', label: 'Productos' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-bold transition-all relative ${activeTab === tab.id
              ? 'text-gray-900'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPIs con glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <CategoryKPICard
              label="Documentos"
              value={formatNumber(totals.documents)}
              icon={Tag}
              loading={detailLoading}
            />
            <CategoryKPICard
              label="Subtotal"
              value={formatCurrency(totals.subTotal)}
              icon={Package}
              loading={detailLoading}
            />
            <CategoryKPICard
              label="IVA"
              value={formatCurrency(totals.iva)}
              icon={Package}
              loading={detailLoading}
            />
            <CategoryKPICard
              label="Total"
              value={formatCurrency(totals.total)}
              icon={Users}
              loading={detailLoading}
            />
          </div>

          {/* Gráfico mejorado con estadísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    Tendencia de Gasto
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Evolución diaria en el rango seleccionado
                  </p>
                </div>
                {detailLoading && <RefreshCw size={16} className="animate-spin text-blue-500" />}
              </div>
              <DailySpendChart series={categorySeries} />
              {categorySeries.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-gray-400 font-black">Promedio</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {formatCurrency(categorySeries.reduce((sum, s) => sum + s.total, 0) / categorySeries.length)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-gray-400 font-black">Pico</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      {formatCurrency(Math.max(...categorySeries.map(s => s.total)))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-gray-400 font-black">Mínimo</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">
                      {formatCurrency(Math.min(...categorySeries.map(s => s.total)))}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Proveedores</p>
                {categoryProviders.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-3">Sin proveedores asignados.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {categoryProviders.map((provider) => (
                      <div key={provider.providerId} className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-gray-800">{provider.name}</p>
                          <p className="text-[10px] text-gray-400">{provider.nit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Productos</p>
                {categoryProducts.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-3">Sin productos asignados.</p>
                ) : (
                  <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {categoryProducts.map((product) => (
                      <div key={product.productId} className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-gray-800">{product.description}</p>
                          <p className="text-[10px] text-gray-400">{product.code || 'Sin codigo'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Asignar proveedor + productos</p>
                  <p className="text-xs text-gray-500 mt-1">Selecciona proveedor y agrega productos desde su catalogo.</p>
                </div>
                <Users size={16} className="text-gray-400" />
              </div>

              <div className="flex flex-col gap-3">
                <select
                  value={providerToAdd}
                  onChange={(e) => setProviderToAdd(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                >
                  <option value="">Selecciona proveedor</option>
                  {providersDirectory.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} {provider.nit ? `· ${provider.nit}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddProvider}
                  disabled={!providerToAdd || assigningProvider}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {assigningProvider ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={14} />
                        Agregar proveedor
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Búsqueda de productos mejorada */}
              <div className="space-y-3">
                {activeProviderForProducts && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                      {providersDirectory.find(p => p.id === activeProviderForProducts)?.name.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-blue-900">
                      Buscando en: {providersDirectory.find(p => p.id === activeProviderForProducts)?.name}
                    </p>
                  </div>
                )}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Buscar producto..."
                    disabled={!activeProviderForProducts}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:bg-white focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {productLoading && (
                    <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddProducts}
                  disabled={!selectedProductIds.length || assigningProducts}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-tight px-3 py-2.5"
                >
                  {assigningProducts ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Package size={14} />
                      Agregar selección ({selectedProductIds.length})
                    </>
                  )}
                </button>
              </div>

              {productLoading ? (
                <p className="text-xs text-gray-400">Buscando productos...</p>
              ) : productResults.length === 0 ? (
                <p className="text-xs text-gray-500">
                  {!providerToAdd
                    ? 'Selecciona un proveedor para ver sus productos.'
                    : 'Sin resultados para este proveedor.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {productResults.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-xs">
                      <label className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={(e) => {
                            setSelectedProductIds((prev) => {
                              if (e.target.checked) return [...prev, product.id];
                              return prev.filter((idValue) => idValue !== product.id);
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-0"
                        />
                        <p className="font-semibold text-gray-800">{product.description}</p>
                        <p className="text-[10px] text-gray-400">{product.code || 'Sin codigo'}</p>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Asignaciones actuales</p>
                  <p className="text-xs text-gray-500 mt-1">Proveedores y productos ya vinculados.</p>
                </div>
                <Tag size={16} className="text-gray-400" />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Proveedores</p>
                  {providersLoading ? (
                    <p className="text-xs text-gray-400">Cargando proveedores...</p>
                  ) : categoryProviders.length === 0 ? (
                    <p className="text-xs text-gray-500">Sin proveedores asignados.</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryProviders.map((provider) => (
                        <div key={provider.providerId} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{provider.name}</p>
                            <p className="text-[10px] text-gray-400">{provider.nit}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ type: 'provider', id: provider.providerId, name: provider.name })}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Productos</p>
                  {categoryProducts.length === 0 ? (
                    <p className="text-xs text-gray-500">Sin productos asignados.</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryProducts.map((product) => (
                        <div key={product.productId} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{product.description}</p>
                            <p className="text-[10px] text-gray-400">{product.code || 'Sin codigo'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ type: 'product', id: product.productId, name: product.description })}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'productos' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Productos con variacion</p>
              <p className="text-xs text-gray-500 mt-1">Basado en el catalogo del proveedor.</p>
            </div>
          </div>

          {categoryProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Sin productos asignados a esta categoria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-3 px-6 text-left text-[10px] uppercase tracking-wider font-bold text-gray-400">Producto</th>
                    <th className="py-3 px-6 text-right text-[10px] uppercase tracking-wider font-bold text-gray-400">Precio Min</th>
                    <th className="py-3 px-6 text-right text-[10px] uppercase tracking-wider font-bold text-gray-400">Precio Max</th>
                    <th className="py-3 px-6 text-right text-[10px] uppercase tracking-wider font-bold text-gray-400">Ultimo Precio</th>
                    <th className="py-3 px-6 text-center text-[10px] uppercase tracking-wider font-bold text-gray-400">Historial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryProducts.map((product) => {
                    const minPrice = product.stats?.priceMin ?? 0;
                    const maxPrice = product.stats?.priceMax ?? 0;
                    return (
                      <tr key={product.productId} className="text-gray-700 hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-6">
                          <div className="font-bold text-gray-900 line-clamp-1 text-xs">{product.description}</div>
                          <div className="text-[10px] text-gray-400">{product.code || 'Sin codigo'}</div>
                        </td>
                        <td className="py-2.5 px-6 text-right whitespace-nowrap font-mono text-xs">{formatCurrency(minPrice)}</td>
                        <td className="py-2.5 px-6 text-right whitespace-nowrap font-mono text-xs">{formatCurrency(maxPrice)}</td>
                        <td className="py-2.5 px-6 text-right whitespace-nowrap font-bold text-gray-900 font-mono text-xs">
                          {formatCurrency(product.lastUnitPrice || 0)}
                        </td>
                        <td className="py-2.5 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryProduct(product)}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors text-[10px] font-black uppercase"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ProductHistoryModal
        isOpen={!!selectedHistoryProduct}
        product={selectedHistoryProduct ? { description: selectedHistoryProduct.description } : null}
        providerId={selectedHistoryProduct?.providerId || null}
        onClose={() => setSelectedHistoryProduct(null)}
      />

      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              ¿Estás seguro de eliminar <span className="font-bold">{confirmDelete.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (confirmDelete.type === 'provider') {
                    await handleRemoveProvider(confirmDelete.id);
                  } else {
                    await handleRemoveProduct(confirmDelete.id);
                  }
                }}
                disabled={removingProvider || removingProduct}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {(removingProvider || removingProduct) ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default CategoryDetail;
