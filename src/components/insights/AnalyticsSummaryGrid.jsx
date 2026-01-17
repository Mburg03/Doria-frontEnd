import { formatCurrency } from '../../utils/formatters';

const AnalyticsSummaryGrid = ({ totals, loading }) => {
  const safeTotals = totals || { subTotal: 0, iva: 0, total: 0, documents: 0, anulados: 0 };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs uppercase text-gray-500">Gasto neto</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {loading ? '—' : formatCurrency(safeTotals.subTotal)}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs uppercase text-gray-500">IVA total</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {loading ? '—' : formatCurrency(safeTotals.iva)}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs uppercase text-gray-500">Gasto total</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {loading ? '—' : formatCurrency(safeTotals.total)}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs uppercase text-gray-500">DTE</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {loading ? '—' : safeTotals.documents}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs uppercase text-gray-500">Anulados</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {loading ? '—' : safeTotals.anulados}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsSummaryGrid;
