import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { TrendingUp, Calendar, X, Search } from 'lucide-react';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value || 0);
const formatNumber = (value = 0) => new Intl.NumberFormat('es-SV').format(value || 0);

const formatShortDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit' });
};

const getDefaultRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10)
  };
};

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

const TableSearch = ({ value, onChange, placeholder }) => (
  <div className="relative w-full max-w-sm">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      aria-label={placeholder}
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
        aria-label="Limpiar búsqueda"
      >
        <X className="h-4 w-4" />
      </button>
    ) : null}
  </div>
);

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

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerDetails, setProviderDetails] = useState([]);
  const [providerDetailsLoading, setProviderDetailsLoading] = useState(false);
  const [providerProducts, setProviderProducts] = useState([]);
  const [providerProductsLoading, setProviderProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSummary, setProductSummary] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [productLoading, setProductLoading] = useState(false);

  const fetchStats = async (startDate, endDate) => {
    setStatsLoading(true);
    try {
      const res = await api.get('/insights/stats', { params: { startDate, endDate } });
      setStats(res.data);
    } catch {
      setError('No se pudo cargar el resumen de insights.');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProviders = async (startDate, endDate) => {
    setProvidersLoading(true);
    try {
      const res = await api.get('/insights/providers', { params: { startDate, endDate } });
      setProviders(res.data.items || []);
    } catch {
      setError('No se pudo cargar el listado de proveedores.');
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchProducts = async (startDate, endDate) => {
    setProductsLoading(true);
    try {
      const res = await api.get('/insights/products', { params: { startDate, endDate } });
      setProducts(res.data.items || []);
    } catch {
      setError('No se pudo cargar el listado de productos.');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAnnulled = async (startDate, endDate, page) => {
    setAnnulledLoading(true);
    try {
      const res = await api.get('/insights/annulled', {
        params: { startDate, endDate, page, limit: 20 }
      });
      setAnnulledData(res.data);
    } catch {
      setError('No se pudo cargar el listado de anulados.');
    } finally {
      setAnnulledLoading(false);
    }
  };

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    setError(null);
    setAnnulledPage(1);
    fetchStats(dateRange.startDate, dateRange.endDate);
    fetchProviders(dateRange.startDate, dateRange.endDate);
    fetchProducts(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    fetchAnnulled(dateRange.startDate, dateRange.endDate, annulledPage);
  }, [dateRange.startDate, dateRange.endDate, annulledPage]);

  const pieData = useMemo(() => {
    if (!providers.length) return [];
    return providers.slice(0, 5).map((item) => ({
      name: item.nombre || 'Proveedor',
      value: item.total || 0
    }));
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const term = providerQuery.trim().toLowerCase();
    if (!term) return providers;
    return providers.filter((provider) => {
      const nameMatch = provider.nombre?.toLowerCase().includes(term);
      const nitMatch = provider.nit?.toLowerCase().includes(term);
      return nameMatch || nitMatch;
    });
  }, [providers, providerQuery]);

  const filteredProducts = useMemo(() => {
    const term = productQuery.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const descriptionMatch = product.descripcion?.toLowerCase().includes(term);
      const codeMatch = product.codigo?.toLowerCase().includes(term);
      return descriptionMatch || codeMatch;
    });
  }, [products, productQuery]);

  const handleProviderOpen = async (provider) => {
    if (!provider) return;
    setSelectedProduct(null);
    setSelectedProvider(provider);
    setProviderDetails([]);
    setProviderProducts([]);
    setProviderDetailsLoading(true);
    setProviderProductsLoading(true);
    try {
      const [detailsRes, productsRes] = await Promise.all([
        api.get('/insights/provider', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            nit: provider.nit
          }
        }),
        api.get('/insights/products/provider', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            nit: provider.nit
          }
        })
      ]);
      setProviderDetails(detailsRes.data.items || []);
      setProviderProducts(productsRes.data.items || []);
    } catch {
      setError('No se pudieron cargar las facturas del proveedor.');
    } finally {
      setProviderDetailsLoading(false);
      setProviderProductsLoading(false);
    }
  };

  const handleProductOpen = async (product) => {
    if (!product) return;
    setSelectedProvider(null);
    setSelectedProduct(product);
    setProductSummary(null);
    setProductHistory([]);
    setProductLoading(true);
    try {
      const res = await api.get('/insights/product', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          descripcion: product.descripcion,
          codigo: product.codigo || ''
        }
      });
      setProductSummary(res.data.product || null);
      setProductHistory(res.data.history || []);
    } catch {
      setError('No se pudo cargar el detalle del producto.');
    } finally {
      setProductLoading(false);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Gasto neto</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statsLoading ? '—' : formatCurrency(totals.subTotal)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">IVA total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statsLoading ? '—' : formatCurrency(totals.iva)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Gasto total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statsLoading ? '—' : formatCurrency(totals.total)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">DTE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statsLoading ? '—' : totals.documents}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs uppercase text-gray-500">Anulados</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statsLoading ? '—' : totals.anulados}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Gasto diario
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="date" tickFormatter={formatShortDate} fontSize={12} />
                    <YAxis tickFormatter={(value) => `$${Math.round(value)}`} fontSize={12} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Area type="monotone" dataKey="total" stroke="#2563EB" fill="#BFDBFE" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

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
                    <th className="py-2 px-3 text-left w-36">Fecha emisión</th>
                    <th className="py-2 px-3 text-left w-[360px]">Proveedor</th>
                    <th className="py-2 px-3 text-right w-28">IVA</th>
                    <th className="py-2 px-3 text-right w-32">Total</th>
                    <th className="py-2 px-3 text-left w-36">Fecha anulación</th>
                    <th className="py-2 px-3 text-left">Motivo</th>
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
                        <td className="py-2 px-3 whitespace-nowrap">{item.fechaEmision || '—'}</td>
                        <td className="py-2 px-3 break-words">{item.emisorNombre || '—'}</td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">{formatCurrency(item.iva)}</td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">{formatCurrency(item.total)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{item.anulacionFecha || '—'}</td>
                        <td className="py-2 px-3 break-words">{item.anulacionMotivo || '—'}</td>
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
              <TableSearch
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
                    onClick={() => handleProviderOpen(provider)}
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
            <TableSearch
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
                      onClick={() => handleProductOpen(product)}
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

      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedProvider(null)}></div>
          <div className="w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedProvider.nombre}</h3>
                <p className="text-xs text-gray-500">NIT: {selectedProvider.nit}</p>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500">Gasto total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(selectedProvider.total)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {selectedProvider.documents} DTE en el período
              </p>
            </div>

            <h4 className="text-sm font-semibold text-gray-900 mb-2">Top productos</h4>
            {providerProductsLoading ? (
              <p className="text-sm text-gray-500 mb-4">Cargando productos...</p>
            ) : providerProducts.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">Sin productos en el rango.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {providerProducts.slice(0, 5).map((item) => (
                    <div key={`${item.codigo}-${item.descripcion}`} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[260px]">
                        {item.descripcion || 'Sin descripción'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>{formatNumber(item.quantity || 0)} unidades</span>
                        <span>{formatCurrency(item.totalNet ?? item.totalNet ?? 0)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <h4 className="text-sm font-semibold text-gray-900 mb-2">Facturas en el rango de fecha</h4>
            {providerDetailsLoading ? (
              <p className="text-sm text-gray-500">Cargando facturas...</p>
            ) : providerDetails.length === 0 ? (
              <p className="text-sm text-gray-500">No se encontraron facturas.</p>
            ) : (
              <div className="space-y-3">
                {providerDetails.map((item) => (
                  <div key={item.codigoGeneracion} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{item.numeroControl || item.codigoGeneracion}</p>
                    <p className="text-xs text-gray-500">Fecha: {item.fechaEmision}</p>
                    <p className="text-xs text-gray-500">Total: {formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled
              className="mt-4 w-full py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-400"
            >
              Ver todos los PDF (próximamente)
            </button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedProduct(null)}></div>
          <div className="w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedProduct.descripcion || 'Producto'}
                </h3>
                {selectedProduct.codigo ? (
                  <p className="text-xs text-gray-500">Código: {selectedProduct.codigo}</p>
                ) : null}
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {productLoading ? (
              <p className="text-sm text-gray-500">Cargando detalle...</p>
            ) : (
              <>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-500">Gasto neto (sin IVA)</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(productSummary?.total || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatNumber(productSummary?.quantity || 0)} unidades ·{' '}
                    {productSummary?.documents || 0} documentos
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">IVA estimado</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(productSummary?.ivaEstimated || 0)}
                    </p>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Variación precio</p>
                    <p
                      className={`text-sm font-semibold ${getPriceTrendClass(
                        productSummary?.priceMin || 0,
                        productSummary?.priceMax || 0,
                        productSummary?.firstPrice ?? null,
                        productSummary?.lastPrice ?? null
                      )}`}
                    >
                      {formatCurrency(productSummary?.priceMin || 0)} –{' '}
                      {formatCurrency(productSummary?.priceMax || 0)}
                    </p>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Precio unitario</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(productSummary?.lastPrice ?? (productSummary?.priceMax || 0))}
                    </p>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Historial de facturas
                </h4>
                {productHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No se encontraron facturas.</p>
                ) : (
                  <div className="space-y-3">
                    {productHistory.map((item) => (
                      <div key={item.codigoGeneracion} className="border border-gray-100 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">
                          {item.numeroControl || item.codigoGeneracion}
                        </p>
                        <p className="text-xs text-gray-500">Fecha: {item.fechaEmision}</p>
                        <p className="text-xs text-gray-500">
                          Proveedor: {item.proveedorNombre || '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: {formatCurrency(item.total)} · IVA est.: {formatCurrency(item.ivaEstimated)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Insights;
