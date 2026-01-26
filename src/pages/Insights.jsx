import { downloadOriginalPdf } from '../services/insightsService';
import { Calendar } from 'lucide-react';
import ProviderSidebar from '../components/modals/ProviderSidebar';
import ProductSidebar from '../components/modals/ProductSidebar';
import useInsightsData from '../hooks/useInsightsData';
import ResumenTab from '../components/insights/ResumenTab';
import ProvidersTab from '../components/insights/ProvidersTab';
import ProductsTab from '../components/insights/ProductsTab';
import ManualEntryTab from '../components/insights/ManualEntryTab';

const Insights = () => {
  const {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    statsLoading,
    providers,
    providersLoading,
    products,
    productsLoading,
    error,
    pieData,
    filteredProviders,
    filteredProducts,
    handleExportProviders,
    handleExportProducts,
    getPriceTrendClass,
    totals,
    series,
    topByAmount,
    topByDocs,
    topByIva,
    annulledItems,
    annulledTotal,
    annulledPage,
    setAnnulledPage,
    annulledPages,
    annulledLoading,
    creditNotesItems,
    creditNotesTotal,
    creditNotesPage,
    setCreditNotesPage,
    creditNotesPages,
    creditNotesLoading,
    providerQuery,
    setProviderQuery,
    productQuery,
    setProductQuery,
    selectedProviderFilter,
    setSelectedProviderFilter,
    selectedProvider,
    setSelectedProvider,
    selectedProduct,
    setSelectedProduct,
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
    manualCurrency,
    setManualCurrency,
    manualSubTotal,
    setManualSubTotal,
    manualIva,
    setManualIva,
    manualTotal,
    setManualTotal,
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
  } = useInsightsData();

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-1 w-5 bg-blue-600 rounded-full"></div>
            <span className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">Insights</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Inteligencia de Datos</h1>
          <p className="text-gray-400 mt-1 text-sm font-medium">Análisis de gastos e IVA por rango de fechas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 shadow-sm">
          <Calendar size={16} className="text-gray-400" />
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateRange.startDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="text-xs border-none focus:ring-0 p-0 font-bold text-gray-700 bg-transparent"
            />
            <span className="text-gray-300 font-bold">—</span>
            <input
              type="date"
              value={dateRange.endDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="text-xs border-none focus:ring-0 p-0 font-bold text-gray-700 bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-8 border-b border-gray-50 pb-px">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'proveedores', label: 'Proveedores' },
          { id: 'productos', label: 'Productos' },
          { id: 'manual', label: 'Carga manual' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-bold transition-all relative ${activeTab === tab.id
              ? 'text-gray-900'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {activeTab === 'resumen' && (
        <ResumenTab
          totals={totals}
          statsLoading={statsLoading}
          series={series}
          pieData={pieData}
          creditNotesItems={creditNotesItems}
          creditNotesTotal={creditNotesTotal}
          creditNotesPage={creditNotesPage}
          creditNotesPages={creditNotesPages}
          creditNotesLoading={creditNotesLoading}
          onCreditNotesPageChange={setCreditNotesPage}
          annulledItems={annulledItems}
          annulledTotal={annulledTotal}
          annulledPage={annulledPage}
          annulledPages={annulledPages}
          annulledLoading={annulledLoading}
          onAnnulledPageChange={setAnnulledPage}
          onDownloadOriginalPdf={downloadOriginalPdf}
        />
      )}

      {activeTab === 'proveedores' && (
        <ProvidersTab
          topByAmount={topByAmount}
          topByIva={topByIva}
          topByDocs={topByDocs}
          providersLoading={providersLoading}
          providers={providers}
          filteredProviders={filteredProviders}
          providerQuery={providerQuery}
          onProviderQueryChange={setProviderQuery}
          onExportProviders={handleExportProviders}
          onSelectProvider={(provider) => {
            setSelectedProduct(null);
            setSelectedProvider(provider);
          }}
        />
      )}

      {activeTab === 'productos' && (
        <ProductsTab
          productsLoading={productsLoading}
          products={products}
          filteredProducts={filteredProducts}
          productQuery={productQuery}
          onProductQueryChange={setProductQuery}
          selectedProviderFilter={selectedProviderFilter}
          onProviderFilterChange={setSelectedProviderFilter}
          providers={providers}
          onExportProducts={handleExportProducts}
          getPriceTrendClass={getPriceTrendClass}
          onSelectProduct={(product) => {
            setSelectedProvider(null);
            setSelectedProduct(product);
          }}
        />
      )}

      {activeTab === 'manual' && (
        <ManualEntryTab
          manualProviders={manualProviders}
          manualProvidersLoading={manualProvidersLoading}
          manualProviderMode={manualProviderMode}
          setManualProviderMode={setManualProviderMode}
          manualProviderId={manualProviderId}
          setManualProviderId={setManualProviderId}
          manualProviderName={manualProviderName}
          setManualProviderName={setManualProviderName}
          manualProviderNit={manualProviderNit}
          setManualProviderNit={setManualProviderNit}
          manualProviderCommercialName={manualProviderCommercialName}
          setManualProviderCommercialName={setManualProviderCommercialName}
          manualProviderEmail={manualProviderEmail}
          setManualProviderEmail={setManualProviderEmail}
          manualDocumentType={manualDocumentType}
          manualControlNumber={manualControlNumber}
          setManualControlNumber={setManualControlNumber}
          manualIssueDate={manualIssueDate}
          setManualIssueDate={setManualIssueDate}
          manualSubTotal={manualSubTotal}
          setManualSubTotal={setManualSubTotal}
          manualIva={manualIva}
          setManualIva={setManualIva}
          manualTotal={manualTotal}
          setManualTotal={setManualTotal}
          manualCurrency={manualCurrency}
          setManualCurrency={setManualCurrency}
          manualNotes={manualNotes}
          setManualNotes={setManualNotes}
          manualItems={manualItems}
          addManualItem={addManualItem}
          updateManualItem={updateManualItem}
          removeManualItem={removeManualItem}
          manualProviderProductsLoading={manualProviderProductsLoading}
          manualProductQuery={manualProductQuery}
          setManualProductQuery={setManualProductQuery}
          manualSubmitting={manualSubmitting}
          manualFeedback={manualFeedback}
          handleManualSubmit={handleManualSubmit}
          resetManualForm={resetManualForm}
          filteredManualProviderProducts={filteredManualProviderProducts}
        />
      )}

      <ProviderSidebar
        provider={selectedProvider}
        dateRange={dateRange}
        onClose={() => setSelectedProvider(null)}
      />
      <ProductSidebar
        product={selectedProduct}
        dateRange={dateRange}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
};

export default Insights;
