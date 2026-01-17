import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchProviderBundle } from '../../services/insightsService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

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
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose}></div>
      <div className="w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{provider.nombre}</h3>
            <p className="text-xs text-gray-500">NIT: {provider.nit}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500">Gasto total (Incluyendo IVA)</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(provider.total)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {provider.documents} DTE en el período
          </p>
        </div>

        <h4 className="text-sm font-semibold text-gray-900 mb-2">Lista de productos</h4>
        {productsLoading ? (
          <p className="text-sm text-gray-500 mb-4">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">Sin productos en el rango.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {products.slice(0, 5).map((item) => (
              <div key={`${item.codigo}-${item.descripcion}`} className="border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[260px]">
                  {item.descripcion || 'Sin descripción'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{formatNumber(item.quantity || 0)} unidades</span>
                  <span>Gasto sin IVA: {formatCurrency(item.totalNet ?? item.totalNet ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <h4 className="text-sm font-semibold text-gray-900 mb-2">Facturas en el rango de fecha</h4>
        {detailsLoading ? (
          <p className="text-sm text-gray-500">Cargando facturas...</p>
        ) : details.length === 0 ? (
          <p className="text-sm text-gray-500">No se encontraron facturas.</p>
        ) : (
          <div className="space-y-3">
            {details.map((item) => (
              <div key={item.codigoGeneracion} className="border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{item.numeroControl || item.codigoGeneracion}</p>
                <p className="text-xs text-gray-500">Fecha emisión: {item.fechaEmision}</p>
                <p className="text-xs text-gray-500">Total (incluyendo IVA): {formatCurrency(item.total)}</p>
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
  );
};

export default ProviderSidebar;
