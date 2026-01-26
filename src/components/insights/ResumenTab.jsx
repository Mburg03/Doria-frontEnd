import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import AnalyticsSummaryGrid from './AnalyticsSummaryGrid';
import DailySpendChart from './DailySpendChart';
import AnnulledTable from './AnnulledTable';
import CreditNotesTable from './CreditNotesTable';
import { formatCurrency } from '../../utils/formatters';

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

const ResumenTab = ({
  totals,
  statsLoading,
  series,
  pieData,
  creditNotesItems,
  creditNotesTotal,
  creditNotesPage,
  creditNotesPages,
  creditNotesLoading,
  onCreditNotesPageChange,
  annulledItems,
  annulledTotal,
  annulledPage,
  annulledPages,
  annulledLoading,
  onAnnulledPageChange,
  onDownloadOriginalPdf
}) => {
  return (
    <div className="space-y-6">
      <AnalyticsSummaryGrid
        totals={totals}
        loading={statsLoading}
        creditNotesTotal={creditNotesTotal}
      />

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

      <CreditNotesTable
        items={creditNotesItems}
        total={creditNotesTotal}
        page={creditNotesPage}
        pages={creditNotesPages}
        loading={creditNotesLoading}
        onPageChange={onCreditNotesPageChange}
        onDownloadOriginalPdf={onDownloadOriginalPdf}
      />

      <AnnulledTable
        items={annulledItems}
        total={annulledTotal}
        page={annulledPage}
        pages={annulledPages}
        loading={annulledLoading}
        onPageChange={onAnnulledPageChange}
        onDownloadOriginalPdf={onDownloadOriginalPdf}
      />
    </div>
  );
};

export default ResumenTab;
