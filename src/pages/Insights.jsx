import { useEffect, useMemo, useState } from 'react';
import {
  fetchAnnulled,
  fetchInsightsStats,
  fetchProducts,
  fetchProviders,
  downloadOriginalPdf
} from '../services/insightsService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { getDefaultRange } from '../utils/dateRange';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, Building2, ChevronRight, TrendingUp, TrendingDown, Box, History, FileText, PieChart as PieChartIcon, ShieldAlert, RefreshCw, Search, Download } from 'lucide-react';
import clsx from 'clsx';
import SearchInput from '../components/SearchInput';
import { exportToCSV } from '../utils/csvExport';
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
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('all');
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

  const loadProducts = async (startDate, endDate, nit = 'all') => {
    setProductsLoading(true);
    try {
      const params = { startDate, endDate };
      if (nit !== 'all') params.nit = nit;

      const data = await fetchProducts(params);
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
    // Note: loadProducts is now handled by its own useEffect to avoid redundant calls
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    loadProducts(dateRange.startDate, dateRange.endDate, selectedProviderFilter);
  }, [dateRange.startDate, dateRange.endDate, selectedProviderFilter]);

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

  const handleExportProviders = () => {
    const headers = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'nit', label: 'NIT' },
      { key: 'documents', label: 'Documentos' },
      { key: 'total', label: 'Inversion Total' }
    ];
    exportToCSV(filteredProviders, `doria_proveedores_${dateRange.startDate}_a_${dateRange.endDate}`, headers);
  };

  const handleExportProducts = () => {
    const headers = [
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'codigo', label: 'Codigo' },
      { key: 'quantity', label: 'Cantidad' },
      { key: 'priceMin', label: 'Precio Min' },
      { key: 'priceMax', label: 'Precio Max' },
      { key: 'totalNet', label: 'Inversion Total' }
    ];
    exportToCSV(filteredProducts, `doria_productos_${dateRange.startDate}_a_${dateRange.endDate}`, headers);
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
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inteligencia de Datos</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Análisis de gastos e IVA por rango de fechas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 shadow-sm">
          <Calendar size={16} className="text-gray-400" />
          <div className="flex items-center gap-1.5">
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

      <div className="mb-8 flex flex-wrap gap-8 border-b border-gray-50 pb-px">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'proveedores', label: 'Proveedores' },
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

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">
                Distribución por proveedor
              </h3>
              <div className="flex-1 min-h-[256px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`slice-${entry.name}`}
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ProviderTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {!pieData.length && (
                <div className="text-center py-12 text-gray-400 italic text-sm">
                  Sin datos suficientes para graficar.
                </div>
              )}
              {pieData.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-[10px] text-gray-600">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-1.5">
                  Documentos anulados
                </h3>
                <p className="text-sm text-gray-500">
                  Total en el rango: <span className="font-semibold text-gray-900">{formatNumber(annulledTotal)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setAnnulledPage((prev) => Math.max(prev - 1, 1))}
                  disabled={annulledPage === 1 || annulledLoading}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <span className="text-xs font-bold text-gray-600 px-2 min-w-[60px] text-center">
                  {annulledPage} / {annulledPages}
                </span>
                <button
                  type="button"
                  onClick={() => setAnnulledPage((prev) => Math.min(prev + 1, annulledPages))}
                  disabled={annulledPage >= annulledPages || annulledLoading}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-3 px-6 text-left text-[10px] uppercase tracking-wider font-bold text-gray-400">Emisión</th>
                    <th className="py-3 px-6 text-left text-[10px] uppercase tracking-wider font-bold text-gray-400">Proveedor</th>
                    <th className="py-3 px-6 text-right text-[10px] uppercase tracking-wider font-bold text-gray-400">IVA</th>
                    <th className="py-3 px-6 text-right text-[10px] uppercase tracking-wider font-bold text-gray-400">Total</th>
                    <th className="py-3 px-6 text-left text-[10px] uppercase tracking-wider font-bold text-gray-400">Anulación</th>
                    <th className="py-3 px-6 text-left text-[10px] uppercase tracking-wider font-bold text-gray-400">Motivo</th>
                    <th className="py-3 px-6 text-center text-[10px] uppercase tracking-wider font-bold text-gray-400">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {annulledLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                        <p>Cargando documentos anulados...</p>
                      </td>
                    </tr>
                  ) : annulledItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <p>No hay documentos anulados en este rango.</p>
                      </td>
                    </tr>
                  ) : (
                    annulledItems.map((item, index) => (
                      <tr key={`${item.numeroControl}-${index}`} className="text-gray-700 hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-6 whitespace-nowrap font-medium text-xs">{item.fechaEmision || '—'}</td>
                        <td className="py-2.5 px-6 max-w-[200px]">
                          <div className="font-bold text-gray-900 line-clamp-1 text-xs">{item.emisorNombre || '—'}</div>
                        </td>
                        <td className="py-2.5 px-6 text-right whitespace-nowrap font-mono text-xs">{formatCurrency(item.iva)}</td>
                        <td className="py-2.5 px-6 text-right whitespace-nowrap font-bold text-gray-900 font-mono text-xs">{formatCurrency(item.total)}</td>
                        <td className="py-2.5 px-6 whitespace-nowrap text-red-600 font-medium text-xs">{item.anulacionFecha || '—'}</td>
                        <td className="py-2.5 px-6">
                          <p className="text-[10px] text-gray-500 line-clamp-1 italic">{item.anulacionMotivo || '—'}</p>
                        </td>
                        <td className="py-2.5 px-6 text-center">
                          {item.originalAvailable ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await downloadOriginalPdf(item.codigoGeneracion);
                                } catch (err) {
                                  alert(err.message);
                                }
                              }}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Ver PDF"
                            >
                              <FileText size={16} />
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proveedores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Mayor proveedor por monto</p>
              <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">
                {topByAmount?.nombre || '—'}
              </h4>
              <p className="text-lg font-extrabold text-blue-600">
                {topByAmount ? formatCurrency(topByAmount.total) : '—'}
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Mayor proveedor por IVA</p>
              <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">
                {topByIva?.nombre || '—'}
              </h4>
              <p className="text-lg font-extrabold text-indigo-600">
                {topByIva ? formatCurrency(topByIva.iva) : '—'}
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Mayor frecuencia</p>
              <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">
                {topByDocs?.nombre || '—'}
              </h4>
              <p className="text-lg font-extrabold text-emerald-600">
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
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <button
                  onClick={handleExportProviders}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Download size={14} />
                  Exportar CSV
                </button>
                <SearchInput
                  value={providerQuery}
                  onChange={setProviderQuery}
                  placeholder="Buscar proveedor"
                />
              </div>
            </div>

            {providersLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
                <p>Cargando proveedores...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No hay proveedores en el rango seleccionado.</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No hay proveedores que coincidan con "{providerQuery}".</p>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 bg-gray-50/20">
                {filteredProviders.map((provider) => (
                  <button
                    key={`${provider.nit}-${provider.nombre}`}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedProvider(provider);
                    }}
                    className="group bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="relative z-10">

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate text-sm">
                            {provider.nombre}
                          </h4>
                          <span className="shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100/50 uppercase">
                            {provider.documents} DTE
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium mb-4">
                          NIT: {provider.nit || '—'}
                        </p>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Inversión Total</p>
                            <p className="text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {formatCurrency(provider.total)}
                            </p>
                          </div>
                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 transform translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <ChevronRight size={14} />
                          </div>
                        </div>
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
                Por monto con variación de precio unitario.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={handleExportProducts}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                <Download size={14} />
                Exportar CSV
              </button>
              <div className="relative min-w-[200px] w-full sm:w-auto">
                <select
                  value={selectedProviderFilter}
                  onChange={(e) => setSelectedProviderFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl pr-10 pl-4 py-2.5 focus:bg-white focus:border-blue-600 focus:ring-0 outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="all">Todos los proveedores</option>
                  {providers.map(p => (
                    <option key={p.nit} value={p.nit}>{p.nombre}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
              <SearchInput
                value={productQuery}
                onChange={setProductQuery}
                placeholder="Buscar producto"
              />
            </div>
          </div>

          {productsLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
              <p>Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Box size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No hay productos en el rango seleccionado.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No hay productos que coincidan con "{productQuery}".</p>
            </div>
          ) : (
            <div className="p-6 space-y-4 bg-gray-50/30">
              {filteredProducts.map((product) => (
                <button
                  key={`${product.codigo}-${product.descripcion}`}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(null);
                    setSelectedProduct(product);
                  }}
                  className="w-full group bg-white border border-gray-100 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3 hover:border-blue-400 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                        <Box size={18} />
                      </div>
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate text-sm">
                        {product.descripcion || 'Sin descripción'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 ml-10 font-medium">
                      <span className="flex items-center gap-1 uppercase tracking-tight">
                        <History size={12} /> {formatNumber(product.quantity || 0)} und
                      </span>
                      {product.codigo && (
                        <span className="shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100/50 uppercase">
                          REF: {product.codigo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:ml-auto">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-black mb-0.5">Rango Precio</p>
                      <div className={clsx(
                        "flex items-center gap-1.5 font-bold text-xs",
                        getPriceTrendClass(
                          product.priceMin || 0,
                          product.priceMax || 0,
                          product.firstPrice ?? null,
                          product.lastPrice ?? null
                        )
                      )}>
                        {product.priceMin === product.priceMax ? (
                          <span>{formatCurrency(product.priceMin)}</span>
                        ) : (
                          <>
                            <span>{formatCurrency(product.priceMin)}</span>
                            <span className="text-gray-200">—</span>
                            <span>{formatCurrency(product.priceMax)}</span>
                          </>
                        )}
                        {product.lastPrice > product.firstPrice ? (
                          <TrendingUp size={14} className="text-red-500" />
                        ) : product.lastPrice < product.firstPrice ? (
                          <TrendingDown size={14} className="text-emerald-500" />
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Inversión Total</p>
                      <p className={clsx(
                        "text-lg font-extrabold",
                        (product.totalNet ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'
                      )}>
                        {formatCurrency(product.totalNet ?? 0)}
                      </p>
                    </div>

                    <div className="hidden md:block text-gray-300 group-hover:text-blue-400 transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </button>
              ))}
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
    </>
  );
};

export default Insights;
