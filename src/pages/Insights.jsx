import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import {
  fetchAnnulled,
  fetchInsightsStats,
  fetchProducts,
  fetchProviders
} from '../services/insightsService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { getDefaultRange } from '../utils/dateRange';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import AnalyticsSummaryGrid from '../components/insights/AnalyticsSummaryGrid';
import DailySpendChart from '../components/insights/DailySpendChart';
import ProviderSidebar from '../components/modals/ProviderSidebar';
import ProductSidebar from '../components/modals/ProductSidebar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ProviderTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item?.name || item?.payload?.name || 'Proveedor';
  const value = item?.value ?? 0;
  return (
    <div className="max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-900 truncate">{name}</p>
      <p className="text-gray-600 mt-1">Total: {formatCurrency(value)}</p>
    </div>
  );
};

const Insights = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [annulledData, setAnnulledData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [annulledPage, setAnnulledPage] = useState(1);
  const [annulledLoading, setAnnulledLoading] = useState(false);
  const [providerQuery, setProviderQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const debouncedProviderQuery = useDebouncedValue(providerQuery);
  const debouncedProductQuery = useDebouncedValue(productQuery);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadStats = async (startDate, endDate) => {
    setStatsLoading(true);
    try {
      const data = await fetchInsightsStats({ startDate, endDate });
      setStats(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el resumen de insights.');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadProviders = async (startDate, endDate) => {
    setProvidersLoading(true);
    try {
      const data = await fetchProviders({ startDate, endDate });
      setProviders(data.items || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de proveedores.');
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadProducts = async (startDate, endDate) => {
    setProductsLoading(true);
    try {
      const data = await fetchProducts({ startDate, endDate });
      setProducts(data.items || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de productos.');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadAnnulled = async (startDate, endDate, page) => {
    setAnnulledLoading(true);
    try {
      const data = await fetchAnnulled({
        startDate,
        endDate,
        page,
        limit: 20
      });
      setAnnulledData(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de anulados.');
    } finally {
      setAnnulledLoading(false);
    }
  };

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    setError(null);
    setAnnulledPage(1);
    loadStats(dateRange.startDate, dateRange.endDate);
    loadProviders(dateRange.startDate, dateRange.endDate);
    loadProducts(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    loadAnnulled(dateRange.startDate, dateRange.endDate, annulledPage);
  }, [dateRange.startDate, dateRange.endDate, annulledPage]);

  const pieData = useMemo(() => {
    if (!providers.length) return [];
    return providers.slice(0, 5).map((item) => ({
      name: item.nombre || 'Proveedor',
      value: item.total || 0
    }));
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const term = debouncedProviderQuery.trim().toLowerCase();
    if (!term) return providers;
    return providers.filter((provider) => {
      const nameMatch = provider.nombre?.toLowerCase().includes(term);
      const nitMatch = provider.nit?.toLowerCase().includes(term);
      return nameMatch || nitMatch;
    });
  }, [providers, debouncedProviderQuery]);

  const filteredProducts = useMemo(() => {
    const term = debouncedProductQuery.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const descriptionMatch = product.descripcion?.toLowerCase().includes(term);
      const codeMatch = product.codigo?.toLowerCase().includes(term);
      return descriptionMatch || codeMatch;
    });
  }, [products, debouncedProductQuery]);

  const getPriceTrendClass = (minPrice, maxPrice, firstPrice, lastPrice) => {
    if (firstPrice !== null && lastPrice !== null) {
      if (lastPrice > firstPrice) return 'text-red-600';
      if (lastPrice < firstPrice) return 'text-emerald-600';
      return 'text-gray-600';
    }
    if (maxPrice > minPrice) return 'text-red-600';
    if (maxPrice < minPrice) return 'text-emerald-600';
    return 'text-gray-600';
  };

  const totals = stats?.totals || { subTotal: 0, iva: 0, total: 0, documents: 0, anulados: 0 };
  const series = stats?.series || [];
  const topByAmount = providers[0] || null;
  const topByDocs = useMemo(() => {
    if (!providers.length) return null;
    return [...providers].sort((a, b) => (b.documents || 0) - (a.documents || 0))[0];
  }, [providers]);
  const topByIva = useMemo(() => {
    if (!providers.length) return null;
    return [...providers].sort((a, b) => (b.iva || 0) - (a.iva || 0))[0];
  }, [providers]);
  const annulledItems = annulledData.items || [];
  const annulledTotal = annulledData.total || 0;
  const annulledLimit = annulledData.limit || 20;
  const annulledPages = Math.max(Math.ceil(annulledTotal / annulledLimit), 1);

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inteligencia de Datos</h1>
          <p className="text-gray-500">Análisis de gastos e IVA por rango de fechas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Calendar size={18} className="text-gray-400" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="text-sm border-none focus:ring-0"
            />
            <span className="text-gray-300">—</span>
            <input
              type="date"
              value={dateRange.endDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="text-sm border-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { id: 'resumen', label: 'Resumen general' },
          { id: 'proveedores', label: 'Mis proveedores' },
          { id: 'productos', label: 'Productos' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <AnalyticsSummaryGrid totals={totals} loading={statsLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DailySpendChart series={series} />

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por proveedor</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`slice-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ProviderTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {!pieData.length && (
                <p className="text-xs text-gray-500">Sin datos para mostrar.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Documentos anulados</h3>
                <p className="text-sm text-gray-500">
                  Total en el rango: {formatNumber(annulledTotal)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnnulledPage((prev) => Math.max(prev - 1, 1))}
                  disabled={annulledPage === 1 || annulledLoading}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  {annulledPage} / {annulledPages}
                </span>
                <button
                  type="button"
                  onClick={() => setAnnulledPage((prev) => Math.min(prev + 1, annulledPages))}
                  disabled={annulledPage >= annulledPages || annulledLoading}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-fixed text-sm">
                <thead className="text-xs uppercase text-gray-500 border-b">
                  <tr>
                    <th className="py-2 px-3 text-center w-36">Fecha emisión</th>
                    <th className="py-2 px-3 text-center w-[360px]">Proveedor</th>
                    <th className="py-2 px-3 text-center w-28">IVA</th>
                    <th className="py-2 px-3 text-center w-32">Total</th>
                    <th className="py-2 px-3 text-center w-36">Fecha anulación</th>
                    <th className="py-2 px-3 text-center">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {annulledLoading && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        Cargando anulados...
                      </td>
                    </tr>
                  )}
                  {!annulledLoading && annulledItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No hay documentos anulados en este rango.
                      </td>
                    </tr>
                  )}
                  {!annulledLoading &&
                    annulledItems.map((item, index) => (
                      <tr key={`${item.numeroControl}-${index}`} className="text-gray-700">
                        <td className="py-2 px-3 text-center whitespace-nowrap">{item.fechaEmision || '—'}</td>
                        <td className="py-2 px-3 text-center break-words">{item.emisorNombre || '—'}</td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">{formatCurrency(item.iva)}</td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">{formatCurrency(item.total)}</td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">{item.anulacionFecha || '—'}</td>
                        <td className="py-2 px-3 text-center break-words">{item.anulacionMotivo || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proveedores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Mayor proveedor por monto</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                {topByAmount?.nombre || '—'}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {topByAmount ? formatCurrency(topByAmount.total) : '—'}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Mayor proveedor por IVA</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                {topByIva?.nombre || '—'}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {topByIva ? formatCurrency(topByIva.iva) : '—'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Mayor proveedor por frecuencia</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                {topByDocs?.nombre || '—'}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {topByDocs ? `${topByDocs.documents} DTE` : '—'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Proveedores</h3>
                <p className="text-sm text-gray-500">Ordenados por gasto total.</p>
              </div>
              <SearchInput
                value={providerQuery}
                onChange={setProviderQuery}
                placeholder="Buscar proveedor"
              />
            </div>

            {providersLoading ? (
              <div className="p-6 text-gray-500">Cargando proveedores...</div>
            ) : providers.length === 0 ? (
              <div className="p-6 text-gray-500">No hay proveedores en el rango seleccionado.</div>
            ) : filteredProviders.length === 0 ? (
              <div className="p-6 text-gray-500">No hay proveedores que coincidan.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProviders.map((provider) => (
                  <button
                    key={`${provider.nit}-${provider.nombre}`}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedProvider(provider);
                    }}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_140px] md:items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{provider.nombre}</p>
                        <p className="text-xs text-gray-500">NIT: {provider.nit || '—'}</p>
                      </div>
                      <div className="text-sm text-gray-600 text-center">{provider.documents} DTE</div>
                      <div className="text-sm text-center font-semibold text-gray-900">
                        {formatCurrency(provider.total)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'productos' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
              <p className="text-sm text-gray-500">
                Top productos por monto con variación de precio unitario.
              </p>
            </div>
            <SearchInput
              value={productQuery}
              onChange={setProductQuery}
              placeholder="Buscar producto"
            />
          </div>

          {productsLoading ? (
            <div className="p-6 text-gray-500">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="p-6 text-gray-500">No hay productos en el rango seleccionado.</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-6 text-gray-500">No hay productos que coincidan.</div>
          ) : (
            <div className="p-6 overflow-x-auto">
              <table className="min-w-full table-fixed text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left pb-3 px-3 w-[360px]">Producto</th>
                    <th className="text-center pb-3 px-3 w-28">Cantidad</th>
                    <th className="text-center pb-3 px-3 w-32">Total</th>
                    <th className="text-center pb-3 px-3 w-40">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={`${product.codigo}-${product.descripcion}`}
                      className="text-gray-700 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedProvider(null);
                        setSelectedProduct(product);
                      }}
                    >
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900 truncate">
                          {product.descripcion || 'Sin descripción'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">{formatNumber(product.quantity || 0)}</td>
                      <td
                        className={`py-3 px-3 text-center font-semibold ${
                          (product.totalNet ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(product.totalNet ?? 0)}
                      </td>
                      <td
                        className={`py-3 px-3 text-center ${getPriceTrendClass(
                          product.priceMin || 0,
                          product.priceMax || 0,
                          product.firstPrice ?? null,
                          product.lastPrice ?? null
                        )}`}
                      >
                        {formatCurrency(product.priceMin)} – {formatCurrency(product.priceMax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ProviderSidebar
        provider={selectedProvider}
        dateRange={dateRange}
        onClose={() => setSelectedProvider(null)}
      />
      <ProductSidebar
        product={selectedProduct}
        dateRange={dateRange}
        onClose={() => setSelectedProduct(null)}
      />
    </Layout>
  );
};

export default Insights;
