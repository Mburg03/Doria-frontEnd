import { useEffect, useState } from 'react';
import { X, Building2, FileText, Download, Box, History, LayoutDashboard } from 'lucide-react';
import { fetchProviderBundle, downloadOriginalPdf } from '../../services/insightsService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import clsx from 'clsx';

const ProviderSidebar = ({ provider, dateRange, onClose }) => {
  const [details, setDetails] = useState([]);
  const [products, setProducts] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!provider) return;
    let isActive = true;
    const loadDetails = async () => {
      setError(null);
      setDetailsLoading(true);
      setProductsLoading(true);
      try {
        const bundle = await fetchProviderBundle({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          nit: provider.nit
        });
        if (!isActive) return;
        setDetails(bundle.details || []);
        setProducts(bundle.products || []);
      } catch (err) {
        if (!isActive) return;
        setError(err?.message || 'No se pudieron cargar las facturas del proveedor.');
      } finally {
        if (!isActive) return;
        setDetailsLoading(false);
        setProductsLoading(false);
      }
    };
    loadDetails();
    return () => {
      isActive = false;
    };
  }, [provider, dateRange.startDate, dateRange.endDate]);

  if (!provider) return null;

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
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 leading-tight">{provider.nombre}</h3>
              <p className="text-xs font-mono text-gray-400 mt-0.5 uppercase tracking-wider">NIT: {provider.nit}</p>
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

          {/* Stats Highlight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Inversión Período</p>
              <p className="text-2xl font-black text-gray-900">{formatCurrency(provider.total)}</p>
            </div>
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Documentos</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-gray-900">{provider.documents}</p>
                <p className="text-xs font-bold text-gray-400 uppercase">DTEs</p>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Box size={16} className="text-gray-400" />
                Mis Compras
              </h4>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">Top 5</span>
            </div>

            {productsLoading ? (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <History size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Analizando catálogo...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Sin productos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 5).map((item) => (
                  <div key={`${item.codigo}-${item.descripcion}`} className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-all">
                    <p className="text-sm font-bold text-gray-900 leading-snug mb-2 group-hover:text-blue-700 transition-colors">
                      {item.descripcion || 'Sin descripción'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase">
                          {formatNumber(item.quantity || 0)} und
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-700">
                        {formatCurrency(item.totalNet ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices List */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gray-400" />
              Cronología de Facturas
            </h4>

            {detailsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <LayoutDashboard size={32} className="animate-pulse mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Escaneando archivos...</p>
              </div>
            ) : details.length === 0 ? (
              <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-sm italic">No se encontraron facturas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {details.map((item) => (
                  <div key={item.codigoGeneracion} className="group overflow-hidden bg-white border border-gray-100 rounded-2xl transition-all hover:bg-gray-50/50">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                            {item.numeroControl || item.codigoGeneracion}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.fechaEmision}</p>
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Importe Total</span>
                        <span className="text-sm font-black text-gray-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderSidebar;
