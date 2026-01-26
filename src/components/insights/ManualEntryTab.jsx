import { AlertTriangle, CheckCircle2, PlusCircle, Receipt, RefreshCw, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

const ManualEntryTab = ({
  manualProviders,
  manualProvidersLoading,
  manualProviderMode,
  setManualProviderMode,
  manualProviderId,
  setManualProviderId,
  manualProviderName,
  setManualProviderName,
  manualProviderNit,
  setManualProviderNit,
  manualProviderCommercialName,
  setManualProviderCommercialName,
  manualProviderEmail,
  setManualProviderEmail,
  manualDocumentType,
  manualControlNumber,
  setManualControlNumber,
  manualIssueDate,
  setManualIssueDate,
  manualSubTotal,
  setManualSubTotal,
  manualIva,
  setManualIva,
  manualTotal,
  setManualTotal,
  manualCurrency,
  setManualCurrency,
  manualNotes,
  setManualNotes,
  manualItems,
  addManualItem,
  updateManualItem,
  removeManualItem,
  manualProviderProductsLoading,
  manualProductQuery,
  setManualProductQuery,
  manualSubmitting,
  manualFeedback,
  handleManualSubmit,
  resetManualForm,
  filteredManualProviderProducts
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 font-black">Factura Fisica</p>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Carga Manual de Facturas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Registra facturas sin JSON para que entren a Insights y al historial de proveedores.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Receipt size={18} className="text-slate-500" />
            <span className="text-[11px] uppercase tracking-widest font-black text-slate-500">
              Entrada Manual
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleManualSubmit} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Proveedor</h3>
              <p className="text-xs text-slate-500 mt-1">Selecciona uno existente o crea un nuevo registro.</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setManualProviderMode('existing');
                  setManualProviderName('');
                  setManualProviderNit('');
                  setManualProviderCommercialName('');
                  setManualProviderEmail('');
                }}
                className={clsx(
                  'px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all',
                  manualProviderMode === 'existing'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Existente
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualProviderMode('new');
                  setManualProviderId('');
                }}
                className={clsx(
                  'px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all',
                  manualProviderMode === 'new'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Nuevo
              </button>
            </div>
          </div>

          {manualProviderMode === 'existing' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Proveedor</label>
                <select
                  value={manualProviderId}
                  onChange={(e) => setManualProviderId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                  disabled={manualProvidersLoading}
                >
                  <option value="">Selecciona un proveedor</option>
                  {manualProviders.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} {provider.nit ? `• ${provider.nit}` : ''}
                    </option>
                  ))}
                </select>
                {manualProvidersLoading && (
                  <p className="text-[10px] text-slate-400 mt-1">Cargando proveedores...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Nombre legal</label>
                <input
                  type="text"
                  value={manualProviderName}
                  onChange={(e) => setManualProviderName(e.target.value)}
                  placeholder="Proveedor S.A. de C.V."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">NIT</label>
                <input
                  type="text"
                  value={manualProviderNit}
                  onChange={(e) => setManualProviderNit(e.target.value)}
                  placeholder="0614-160610-104-7"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Nombre comercial</label>
                <input
                  type="text"
                  value={manualProviderCommercialName}
                  onChange={(e) => setManualProviderCommercialName(e.target.value)}
                  placeholder="Marca o fantasia"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Email contacto</label>
                <input
                  type="email"
                  value={manualProviderEmail}
                  onChange={(e) => setManualProviderEmail(e.target.value)}
                  placeholder="proveedor@email.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle size={16} className="text-slate-500" />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Factura</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Fecha de emision</label>
                <input
                  type="date"
                  value={manualIssueDate}
                  onChange={(e) => setManualIssueDate(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Numero de control</label>
                <input
                  type="text"
                  value={manualControlNumber}
                  onChange={(e) => setManualControlNumber(e.target.value)}
                  placeholder="Opcional"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Tipo de documento</label>
                <input
                  type="text"
                  value={manualDocumentType}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Subtotal</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualSubTotal}
                  onChange={(e) => setManualSubTotal(e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">IVA</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualIva}
                  onChange={(e) => setManualIva(e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Total</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualTotal}
                  onChange={(e) => setManualTotal(e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Moneda</label>
              <input
                type="text"
                value={manualCurrency}
                onChange={(e) => setManualCurrency(e.target.value)}
                placeholder="USD (opcional)"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
              />
            </div>
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Productos</h4>
                  <p className="text-xs text-slate-500 mt-1">Opcional, pero mejora el analisis por item.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addManualItem()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all"
                >
                  <PlusCircle size={14} />
                  Agregar item
                </button>
              </div>

              {manualProviderMode === 'existing' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Productos registrados</p>
                      <p className="text-xs text-slate-500 mt-1">Toca un producto para prellenar el item.</p>
                    </div>
                    <div className="w-full sm:w-56">
                      <input
                        type="text"
                        value={manualProductQuery}
                        onChange={(e) => setManualProductQuery(e.target.value)}
                        placeholder="Buscar producto"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    {manualProviderProductsLoading ? (
                      <div className="text-xs text-slate-400">Cargando productos...</div>
                    ) : filteredManualProviderProducts.length === 0 ? (
                      <div className="text-xs text-slate-400">Sin productos registrados para este proveedor.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {filteredManualProviderProducts.slice(0, 12).map((product) => (
                          <button
                            key={`${product.codigo}-${product.descripcion}`}
                            type="button"
                            onClick={() => addManualItem(product)}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50 transition-all"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{product.descripcion || 'Sin descripcion'}</p>
                              <p className="text-[10px] text-slate-400 truncate">{product.codigo || 'Sin codigo'}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase text-blue-600">Agregar</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {manualItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                  No hay productos agregados.
                </div>
              ) : (
                <div className="space-y-3">
                  {manualItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">Codigo</label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => updateManualItem(item.id, 'code', e.target.value)}
                          placeholder="SKU"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500">Descripcion</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateManualItem(item.id, 'description', e.target.value)}
                          placeholder={`Producto ${index + 1}`}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">Cantidad</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateManualItem(item.id, 'quantity', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">Precio unitario</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateManualItem(item.id, 'unitPrice', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-500">Total</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.total}
                            onChange={(e) => updateManualItem(item.id, 'total', e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeManualItem(item.id)}
                          className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Notas</label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Referencia interna, comentario o detalle adicional."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-0 min-h-[110px]"
              />
            </div>
          </div>

          {manualFeedback && (
            <div className={clsx(
              'rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2',
              manualFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            )}>
              {manualFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{manualFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={manualSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-60"
            >
              {manualSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Guardar factura
            </button>
            <button
              type="button"
              onClick={resetManualForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-xs font-black uppercase tracking-wider hover:border-slate-300 hover:text-slate-700 transition-all"
            >
              Limpiar
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Checklist</h4>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                <p>Usa la fecha real del documento para no distorsionar los reportes.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-sky-400" />
                <p>Agrega el numero de control si existe para deduplicacion.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-400" />
                <p>El NIT ayuda a unir facturas manuales con futuras facturas DTE.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg shadow-slate-900/10">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
              <ShieldAlert size={14} />
              Seguridad
            </div>
            <p className="text-sm mt-3 text-slate-200">
              Los datos manuales se guardan con trazabilidad. Podras verlos en Resumen, Proveedores y Productos.
            </p>
            <p className="text-xs mt-4 text-slate-400">
              Si el proveedor empieza a enviar JSON luego, Doria unificara por NIT automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryTab;
