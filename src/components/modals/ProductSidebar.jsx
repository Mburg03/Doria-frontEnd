import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Box, Tag, Download, History, FileText, LayoutDashboard, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchProductDetail, downloadOriginalPdf } from '../../services/insightsService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import clsx from 'clsx';

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

const ProductSidebar = ({ product, dateRange, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!product) return;
    let isActive = true;
    const loadDetail = async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetchProductDetail({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          descripcion: product.descripcion,
          codigo: product.codigo || ''
        });
        if (!isActive) return;
        setSummary(res.product || null);
        setHistory(res.history || []);
      } catch (err) {
        if (!isActive) return;
        setError(err?.message || 'No se pudo cargar el detalle del producto.');
      } finally {
        if (!isActive) return;
        setLoading(false);
      }
    };
    loadDetail();
    return () => {
      isActive = false;
    };
  }, [product, dateRange.startDate, dateRange.endDate]);

  if (!product) return null;

  const priceTrendClass = getPriceTrendClass(
    summary?.priceMin || 0,
    summary?.priceMax || 0,
    summary?.firstPrice ?? null,
    summary?.lastPrice ?? null
  );
  const unitPrice = summary?.lastPrice ?? summary?.priceMax ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Overlay with blur */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl h-full shadow-2xl flex flex-col border-l border-white/20 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Box size={24} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-gray-900 leading-tight truncate">
                {product.descripcion || 'Producto'}
              </h3>
              {product.codigo && (
                <p className="text-xs font-mono text-gray-400 mt-0.5 uppercase tracking-wider">REF: {product.codigo}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 text-sm text-red-700 flex items-center gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                <X size={16} />
              </div>
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Calculando métricas...</p>
            </div>
          ) : !summary ? (
            <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-sm italic">No se encontraron datos para este producto.</p>
            </div>
          ) : (
            <>
              {/* Highlight Stats */}
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Box size={80} />
                  </div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Inversión Neta Total</p>
                  <p className="text-3xl font-black">{formatCurrency(summary.total || 0)}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-bold text-gray-400">
                    <span className="flex items-center gap-1"><History size={14} /> {formatNumber(summary.quantity || 0)} und</span>
                    <span className="flex items-center gap-1"><FileText size={14} /> {summary.documents} dte</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">IVA Estimado</p>
                    <p className="text-lg font-black text-gray-900">{formatCurrency(summary.ivaEstimated || 0)}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Precio actual</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-gray-900">{formatCurrency(unitPrice)}</p>
                      {summary.variationFromLast !== null && (
                        <div className={clsx(
                          "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-lg",
                          summary.variationFromLast > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {summary.variationFromLast > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {Math.abs(summary.variationFromLast * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Range Section */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] uppercase font-black text-blue-600 tracking-widest">Rango de Precios</h4>
                  <Tag size={14} className="text-blue-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Mínimo</p>
                    <p className="text-sm font-black text-gray-900">{formatCurrency(summary.priceMin || 0)}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="h-1.5 bg-blue-100 rounded-full relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm"></div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Máximo</p>
                    <p className="text-sm font-black text-gray-900">{formatCurrency(summary.priceMax || 0)}</p>
                  </div>
                </div>
              </div>

              {/* History */}
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <History size={16} className="text-gray-400" />
                  Historial de compras
                </h4>

                {history.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Sin facturas encontradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.codigoGeneracion} className="group overflow-hidden bg-white border border-gray-100 rounded-2xl transition-all hover:bg-gray-50/50">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                {item.numeroControl || item.codigoGeneracion}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.fechaEmision} · {item.proveedorNombre || '—'}</p>
                            </div>

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
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Descargar PDF Original"
                              >
                                <Download size={16} />
                              </button>
                            ) : (
                              <div
                                className="p-2 bg-gray-50 text-gray-300 rounded-xl cursor-help"
                                title="PDF original no disponible (formato link o histórico)."
                              >
                                <FileText size={16} />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Precio Unit.</p>
                              <span className="text-xs font-black text-blue-600">{formatCurrency(item.unitPrice || 0)}</span>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Importe Neto</p>
                              <span className="text-xs font-bold text-gray-900">{formatCurrency(item.total)}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">IVA Est.</p>
                              <span className="text-[11px] font-medium text-gray-500">{formatCurrency(item.ivaEstimated)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSidebar;
