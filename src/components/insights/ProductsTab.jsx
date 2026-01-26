import { Box, ChevronRight, Download, History, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import SearchInput from '../SearchInput';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const ProductsTab = ({
  productsLoading,
  products,
  filteredProducts,
  productQuery,
  onProductQueryChange,
  selectedProviderFilter,
  onProviderFilterChange,
  providers,
  onExportProducts,
  onSelectProduct,
  getPriceTrendClass
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
          <p className="text-sm text-gray-500">
            Por monto con variación de precio unitario.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={onExportProducts}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={14} />
            Exportar CSV
          </button>
          <div className="relative min-w-[200px] w-full sm:w-auto">
            <select
              value={selectedProviderFilter}
              onChange={(e) => onProviderFilterChange(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl pr-10 pl-4 py-2.5 focus:bg-white focus:border-blue-600 focus:ring-0 outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="all">Todos los proveedores</option>
              {providers.map((provider) => (
                <option key={provider.nit} value={provider.nit}>{provider.nombre}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
          <SearchInput
            value={productQuery}
            onChange={onProductQueryChange}
            placeholder="Buscar producto"
          />
        </div>
      </div>

      {productsLoading ? (
        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
          <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
          <p>Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Box size={48} className="mx-auto text-gray-300 mb-4" />
          <p>No hay productos en el rango seleccionado.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <p>No hay productos que coincidan con "{productQuery}".</p>
        </div>
      ) : (
        <div className="p-6 space-y-4 bg-gray-50/30">
          {filteredProducts.map((product) => (
            <button
              key={`${product.codigo}-${product.descripcion}`}
              type="button"
              onClick={() => onSelectProduct(product)}
              className="w-full group bg-white border border-gray-100 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3 hover:border-blue-400 hover:shadow-lg transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                    <Box size={18} />
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate text-sm">
                    {product.descripcion || 'Sin descripción'}
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 ml-10 font-medium">
                  <span className="flex items-center gap-1 uppercase tracking-tight">
                    <History size={12} /> {formatNumber(product.quantity || 0)} und
                  </span>
                  {product.codigo && (
                    <span className="shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100/50 uppercase">
                      REF: {product.codigo}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 md:ml-auto">
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-black mb-0.5">Rango Precio</p>
                  <div className={clsx(
                    "flex items-center gap-1.5 font-bold text-xs",
                    getPriceTrendClass(
                      product.priceMin || 0,
                      product.priceMax || 0,
                      product.firstPrice ?? null,
                      product.lastPrice ?? null
                    )
                  )}>
                    {product.priceMin === product.priceMax ? (
                      <span>{formatCurrency(product.priceMin)}</span>
                    ) : (
                      <>
                        <span>{formatCurrency(product.priceMin)}</span>
                        <span className="text-gray-200">—</span>
                        <span>{formatCurrency(product.priceMax)}</span>
                      </>
                    )}
                    {product.lastPrice > product.firstPrice ? (
                      <TrendingUp size={14} className="text-red-500" />
                    ) : product.lastPrice < product.firstPrice ? (
                      <TrendingDown size={14} className="text-emerald-500" />
                    ) : null}
                  </div>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Inversión Total</p>
                  <p className={clsx(
                    "text-lg font-extrabold",
                    (product.totalNet ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {formatCurrency(product.totalNet ?? 0)}
                  </p>
                </div>

                <div className="hidden md:block text-gray-300 group-hover:text-blue-400 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
