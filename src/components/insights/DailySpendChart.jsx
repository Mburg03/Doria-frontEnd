import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, formatShortDate } from '../../utils/formatters';

const DailySpendChart = ({ series }) => (
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
          <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Fecha: ${label}`} />
          <Area type="monotone" dataKey="total" stroke="#2563EB" fill="#BFDBFE" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default DailySpendChart;
