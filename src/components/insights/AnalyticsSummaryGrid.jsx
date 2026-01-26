import { formatCurrency } from '../../utils/formatters';

const AnalyticsSummaryGrid = ({ totals, loading, creditNotesTotal = 0 }) => {
  const safeTotals = totals || { subTotal: 0, iva: 0, total: 0, documents: 0, anulados: 0 };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-white border border-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <p className="text-[10px] uppercase text-gray-400 font-black tracking-wider">Gasto neto</p>
        <p className="text-xl font-black text-gray-900 mt-1">
          {loading ? '—' : formatCurrency(safeTotals.subTotal)}
        </p>
      </div>
      <div className="bg-white border border-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <p className="text-[10px] uppercase text-gray-400 font-black tracking-wider">IVA total</p>
        <p className="text-xl font-black text-gray-900 mt-1">
          {loading ? '—' : formatCurrency(safeTotals.iva)}
        </p>
      </div>
      <div className="bg-white border border-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <p className="text-[10px] uppercase text-gray-400 font-black tracking-wider">Gasto total</p>
        <p className="text-xl font-black text-gray-900 mt-1 text-blue-600">
          {loading ? '—' : formatCurrency(safeTotals.total)}
        </p>
      </div>
      <div className="bg-white border border-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <p className="text-[10px] uppercase text-gray-400 font-black tracking-wider">DTE</p>
        <p className="text-xl font-black text-gray-900 mt-1">
          {loading ? '—' : safeTotals.documents}
        </p>
      </div>
      <div className="bg-white border border-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <p className="text-[10px] uppercase text-gray-400 font-black tracking-wider">Notas de crédito</p>
        <p className="text-xl font-black text-gray-900 mt-1 text-amber-600">
          {loading ? '—' : creditNotesTotal}
        </p>
      </div>
      <div className="bg-white border border-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <p className="text-[10px] uppercase text-gray-400 font-black tracking-wider">Anulados</p>
        <p className="text-xl font-black text-gray-900 mt-1 text-red-500">
          {loading ? '—' : safeTotals.anulados}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsSummaryGrid;
