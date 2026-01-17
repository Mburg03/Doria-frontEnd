import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchProductDetail } from '../../services/insightsService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

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
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose}></div>
      <div className="w-full max-w-md bg-white h-full shadow-xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {product.descripcion || 'Producto'}
            </h3>
            {product.codigo ? (
              <p className="text-xs text-gray-500">Codigo: {product.codigo}</p>
            ) : null}
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

        {loading ? (
          <p className="text-sm text-gray-500">Cargando detalle...</p>
        ) : !summary ? (
          <p className="text-sm text-gray-500">No se encontraron facturas.</p>
        ) : (
          <>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500">Gasto neto (sin IVA)</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.total || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {formatNumber(summary.quantity || 0)} unidades · {summary.documents || 0} documentos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500">IVA estimado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(summary.ivaEstimated || 0)}
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500">Variación precio</p>
                <p className={`text-sm font-semibold ${priceTrendClass}`}>
                  {formatCurrency(summary.priceMin || 0)} – {formatCurrency(summary.priceMax || 0)}
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500">Precio unitario</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(unitPrice)}
                </p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900 mb-2">Historial de facturas</h4>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No se encontraron facturas.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.codigoGeneracion} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {item.numeroControl || item.codigoGeneracion}
                    </p>
                    <p className="text-xs text-gray-500">Fecha: {item.fechaEmision}</p>
                    <p className="text-xs text-gray-500">
                      Proveedor: {item.proveedorNombre || '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total (sin IVA): {formatCurrency(item.total)} · IVA est.: {formatCurrency(item.ivaEstimated)} 
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductSidebar;
