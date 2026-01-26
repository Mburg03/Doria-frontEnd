import { Building2, ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import SearchInput from '../SearchInput';
import { formatCurrency } from '../../utils/formatters';

const ProvidersTab = ({
  topByAmount,
  topByIva,
  topByDocs,
  providersLoading,
  providers,
  filteredProviders,
  providerQuery,
  onProviderQueryChange,
  onExportProviders,
  onSelectProvider
}) => {
  return (
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
              onClick={onExportProviders}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download size={14} />
              Exportar CSV
            </button>
            <SearchInput
              value={providerQuery}
              onChange={onProviderQueryChange}
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
                onClick={() => onSelectProvider(provider)}
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
  );
};

export default ProvidersTab;
