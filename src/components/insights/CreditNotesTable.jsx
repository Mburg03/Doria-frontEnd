import { ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CreditNotesTable = ({
  items,
  total,
  page,
  pages,
  loading,
  onPageChange,
  onDownloadOriginalPdf
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white">
        <div>
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-1.5">
            Notas de crédito
          </h3>
          <p className="text-sm text-gray-500">
            Total en el rango: <span className="font-semibold text-gray-900">{formatNumber(total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page === 1 || loading}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <span className="text-xs font-bold text-gray-600 px-2 min-w-[60px] text-center">
            {page} / {pages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(page + 1, pages))}
            disabled={page >= pages || loading}
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
              <th className="py-3 px-6 text-left text-[10px] uppercase tracking-wider font-bold text-gray-400">Documento</th>
              <th className="py-3 px-6 text-center text-[10px] uppercase tracking-wider font-bold text-gray-400">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                  <p>Cargando notas de crédito...</p>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <p>No hay notas de crédito en este rango.</p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={`${item.numeroControl}-${index}`} className="text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 px-6 whitespace-nowrap font-medium text-xs">{item.fechaEmision || '—'}</td>
                  <td className="py-2.5 px-6 max-w-[200px]">
                    <div className="font-bold text-gray-900 line-clamp-1 text-xs">{item.emisorNombre || '—'}</div>
                  </td>
                  <td className="py-2.5 px-6 text-right whitespace-nowrap font-mono text-xs">{formatCurrency(item.iva)}</td>
                  <td className="py-2.5 px-6 text-right whitespace-nowrap font-bold text-gray-900 font-mono text-xs">{formatCurrency(item.total)}</td>
                  <td className="py-2.5 px-6 whitespace-nowrap text-gray-500 text-xs">{item.numeroControl || '—'}</td>
                  <td className="py-2.5 px-6 text-center">
                    {item.originalAvailable ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await onDownloadOriginalPdf(item.codigoGeneracion);
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
  );
};

export default CreditNotesTable;
