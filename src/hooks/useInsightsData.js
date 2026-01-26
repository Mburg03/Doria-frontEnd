import { useEffect, useMemo, useState } from 'react';
import {
  fetchAnnulled,
  fetchCreditNotes,
  fetchInsightsStats,
  fetchProducts,
  fetchProductsByProvider,
  fetchProviders
} from '../services/insightsService';
import { createManualTransaction, fetchManualProviders } from '../services/manualService';
import { getDefaultRange } from '../utils/dateRange';
import { exportToCSV } from '../utils/csvExport';
import { useDebouncedValue } from './useDebouncedValue';

const useInsightsData = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [annulledData, setAnnulledData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [annulledPage, setAnnulledPage] = useState(1);
  const [annulledLoading, setAnnulledLoading] = useState(false);
  const [creditNotesData, setCreditNotesData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [creditNotesPage, setCreditNotesPage] = useState(1);
  const [creditNotesLoading, setCreditNotesLoading] = useState(false);
  const [providerQuery, setProviderQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('all');
  const debouncedProviderQuery = useDebouncedValue(providerQuery);
  const debouncedProductQuery = useDebouncedValue(productQuery);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [manualProviders, setManualProviders] = useState([]);
  const [manualProvidersLoading, setManualProvidersLoading] = useState(false);
  const [manualProvidersLoaded, setManualProvidersLoaded] = useState(false);
  const [manualProviderMode, setManualProviderMode] = useState('existing');
  const [manualProviderId, setManualProviderId] = useState('');
  const [manualProviderName, setManualProviderName] = useState('');
  const [manualProviderNit, setManualProviderNit] = useState('');
  const [manualProviderCommercialName, setManualProviderCommercialName] = useState('');
  const [manualProviderEmail, setManualProviderEmail] = useState('');
  const [manualDocumentType, setManualDocumentType] = useState('Factura Física');
  const [manualControlNumber, setManualControlNumber] = useState('');
  const [manualIssueDate, setManualIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualCurrency, setManualCurrency] = useState('');
  const [manualSubTotal, setManualSubTotal] = useState('');
  const [manualIva, setManualIva] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualItems, setManualItems] = useState([]);
  const [manualProviderProducts, setManualProviderProducts] = useState([]);
  const [manualProviderProductsLoading, setManualProviderProductsLoading] = useState(false);
  const [manualProductQuery, setManualProductQuery] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualFeedback, setManualFeedback] = useState(null);

  const loadStats = async (startDate, endDate) => {
    setStatsLoading(true);
    try {
      const data = await fetchInsightsStats({ startDate, endDate });
      setStats(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el resumen de insights.');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadProviders = async (startDate, endDate) => {
    setProvidersLoading(true);
    try {
      const data = await fetchProviders({ startDate, endDate });
      setProviders(data.items || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de proveedores.');
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadProducts = async (startDate, endDate, nit = 'all') => {
    setProductsLoading(true);
    try {
      const params = { startDate, endDate };
      if (nit !== 'all') params.nit = nit;
      const data = await fetchProducts(params);
      setProducts(data.items || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de productos.');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadAnnulled = async (startDate, endDate, page) => {
    setAnnulledLoading(true);
    try {
      const data = await fetchAnnulled({
        startDate,
        endDate,
        page,
        limit: 20
      });
      setAnnulledData(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de anulados.');
    } finally {
      setAnnulledLoading(false);
    }
  };

  const loadCreditNotes = async (startDate, endDate, page) => {
    setCreditNotesLoading(true);
    try {
      const data = await fetchCreditNotes({
        startDate,
        endDate,
        page,
        limit: 20
      });
      setCreditNotesData(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el listado de notas de crédito.');
    } finally {
      setCreditNotesLoading(false);
    }
  };

  const loadManualProviders = async () => {
    setManualProvidersLoading(true);
    try {
      const data = await fetchManualProviders();
      setManualProviders(data);
    } catch (err) {
      setManualFeedback({
        type: 'error',
        message: err?.message || 'No se pudieron cargar los proveedores.'
      });
    } finally {
      setManualProvidersLoading(false);
      setManualProvidersLoaded(true);
    }
  };

  const loadManualProviderProducts = async (nit) => {
    if (!nit) {
      setManualProviderProducts([]);
      return;
    }
    setManualProviderProductsLoading(true);
    try {
      const data = await fetchProductsByProvider({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        nit
      });
      setManualProviderProducts(data.items || []);
    } catch {
      setManualProviderProducts([]);
    } finally {
      setManualProviderProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    setError(null);
    setAnnulledPage(1);
    setCreditNotesPage(1);
    loadStats(dateRange.startDate, dateRange.endDate);
    loadProviders(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    loadProducts(dateRange.startDate, dateRange.endDate, selectedProviderFilter);
  }, [dateRange.startDate, dateRange.endDate, selectedProviderFilter]);

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    loadAnnulled(dateRange.startDate, dateRange.endDate, annulledPage);
  }, [dateRange.startDate, dateRange.endDate, annulledPage]);

  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    loadCreditNotes(dateRange.startDate, dateRange.endDate, creditNotesPage);
  }, [dateRange.startDate, dateRange.endDate, creditNotesPage]);

  useEffect(() => {
    if (activeTab !== 'manual') return;
    if (manualProvidersLoaded || manualProvidersLoading) return;
    loadManualProviders();
  }, [activeTab, manualProvidersLoaded, manualProvidersLoading]);

  useEffect(() => {
    if (activeTab !== 'manual') return;
    if (manualProviderMode !== 'existing' || !manualProviderId) {
      setManualProviderProducts([]);
      setManualProductQuery('');
      return;
    }
    const selected = manualProviders.find((provider) => provider.id === manualProviderId);
    if (!selected?.nit) {
      setManualProviderProducts([]);
      return;
    }
    loadManualProviderProducts(selected.nit);
  }, [
    activeTab,
    manualProviderMode,
    manualProviderId,
    manualProviders,
    dateRange.startDate,
    dateRange.endDate
  ]);

  const pieData = useMemo(() => {
    if (!providers.length) return [];
    return providers.slice(0, 5).map((item) => ({
      name: item.nombre || 'Proveedor',
      value: item.total || 0
    }));
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const term = debouncedProviderQuery.trim().toLowerCase();
    if (!term) return providers;
    return providers.filter((provider) => {
      const nameMatch = provider.nombre?.toLowerCase().includes(term);
      const nitMatch = provider.nit?.toLowerCase().includes(term);
      return nameMatch || nitMatch;
    });
  }, [providers, debouncedProviderQuery]);

  const filteredProducts = useMemo(() => {
    const term = debouncedProductQuery.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const descriptionMatch = product.descripcion?.toLowerCase().includes(term);
      const codeMatch = product.codigo?.toLowerCase().includes(term);
      return descriptionMatch || codeMatch;
    });
  }, [products, debouncedProductQuery]);

  const handleExportProviders = () => {
    const headers = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'nit', label: 'NIT' },
      { key: 'documents', label: 'Documentos' },
      { key: 'total', label: 'Inversion Total' }
    ];
    exportToCSV(filteredProviders, `doria_proveedores_${dateRange.startDate}_a_${dateRange.endDate}`, headers);
  };

  const handleExportProducts = () => {
    const headers = [
      { key: 'descripcion', label: 'Descripcion' },
      { key: 'codigo', label: 'Codigo' },
      { key: 'quantity', label: 'Cantidad' },
      { key: 'priceMin', label: 'Precio Min' },
      { key: 'priceMax', label: 'Precio Max' },
      { key: 'totalNet', label: 'Inversion Total' }
    ];
    exportToCSV(filteredProducts, `doria_productos_${dateRange.startDate}_a_${dateRange.endDate}`, headers);
  };

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

  const totals = stats?.totals || { subTotal: 0, iva: 0, total: 0, documents: 0, anulados: 0 };
  const series = stats?.series || [];
  const topByAmount = providers[0] || null;
  const topByDocs = useMemo(() => {
    if (!providers.length) return null;
    return [...providers].sort((a, b) => (b.documents || 0) - (a.documents || 0))[0];
  }, [providers]);
  const topByIva = useMemo(() => {
    if (!providers.length) return null;
    return [...providers].sort((a, b) => (b.iva || 0) - (a.iva || 0))[0];
  }, [providers]);
  const annulledItems = annulledData.items || [];
  const annulledTotal = annulledData.total || 0;
  const annulledLimit = annulledData.limit || 20;
  const annulledPages = Math.max(Math.ceil(annulledTotal / annulledLimit), 1);
  const creditNotesItems = creditNotesData.items || [];
  const creditNotesTotal = creditNotesData.total || 0;
  const creditNotesLimit = creditNotesData.limit || 20;
  const creditNotesPages = Math.max(Math.ceil(creditNotesTotal / creditNotesLimit), 1);

  const addManualItem = (product) => {
    const unitPrice = Number(product?.lastPrice ?? product?.priceAvg ?? 0);
    setManualItems((items) => ([
      ...items,
      {
        id: `item-${Date.now()}-${items.length}`,
        code: product?.codigo || '',
        description: product?.descripcion || '',
        quantity: 1,
        unitPrice: unitPrice || 0,
        total: unitPrice ? Number(unitPrice.toFixed(2)) : 0
      }
    ]));
  };

  const updateManualItem = (itemId, field, value) => {
    setManualItems((items) => items.map((item) => {
      if (item.id !== itemId) return item;
      const next = { ...item, [field]: value };
      const quantity = Number(next.quantity) || 0;
      const unitPrice = Number(next.unitPrice) || 0;
      if (field === 'quantity' || field === 'unitPrice') {
        next.total = Number((quantity * unitPrice).toFixed(2));
      }
      return next;
    }));
  };

  const removeManualItem = (itemId) => {
    setManualItems((items) => items.filter((item) => item.id !== itemId));
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setManualFeedback(null);

    if (manualProviderMode === 'existing' && !manualProviderId) {
      setManualFeedback({ type: 'error', message: 'Selecciona un proveedor.' });
      return;
    }

    if (manualProviderMode === 'new') {
      if (!manualProviderName.trim()) {
        setManualFeedback({ type: 'error', message: 'Ingresa el nombre del proveedor.' });
        return;
      }
      if (!manualProviderNit.trim()) {
        setManualFeedback({ type: 'error', message: 'Ingresa el NIT del proveedor.' });
        return;
      }
    }

    if (!manualIssueDate) {
      setManualFeedback({ type: 'error', message: 'Selecciona la fecha de emisión.' });
      return;
    }

    if (!manualTotal || Number(manualTotal) <= 0) {
      setManualFeedback({ type: 'error', message: 'Ingresa el total de la factura.' });
      return;
    }

    const parseAmount = (value) => {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : 0;
    };

    const payload = {
      documentType: manualDocumentType,
      controlNumber: manualControlNumber || undefined,
      issueDate: manualIssueDate,
      totals: {
        subTotal: parseAmount(manualSubTotal),
        iva: parseAmount(manualIva),
        total: parseAmount(manualTotal)
      },
      notes: manualNotes || undefined,
      currency: manualCurrency || undefined,
      items: manualItems
        .filter((item) => item.description?.trim())
        .map((item) => ({
          code: item.code?.trim(),
          description: item.description.trim(),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: Number(item.total) || 0
        }))
    };

    if (manualProviderMode === 'existing') {
      payload.providerId = manualProviderId;
    } else {
      payload.providerName = manualProviderName.trim();
      payload.providerNit = manualProviderNit.trim();
      payload.providerCommercialName = manualProviderCommercialName.trim() || undefined;
      payload.providerEmail = manualProviderEmail.trim() || undefined;
    }

    setManualSubmitting(true);
    try {
      await createManualTransaction(payload);
      setManualFeedback({ type: 'success', message: 'Factura manual guardada.' });
      setManualControlNumber('');
      setManualSubTotal('');
      setManualIva('');
      setManualTotal('');
      setManualNotes('');
      setManualItems([]);
      if (manualProviderMode === 'new') {
        setManualProviderName('');
        setManualProviderNit('');
        setManualProviderCommercialName('');
        setManualProviderEmail('');
      }
      await loadManualProviders();
      loadStats(dateRange.startDate, dateRange.endDate);
      loadProviders(dateRange.startDate, dateRange.endDate);
      loadProducts(dateRange.startDate, dateRange.endDate, selectedProviderFilter);
    } catch (err) {
      setManualFeedback({ type: 'error', message: err?.message || 'No se pudo guardar la factura.' });
    } finally {
      setManualSubmitting(false);
    }
  };

  const resetManualForm = () => {
    setManualProviderMode('existing');
    setManualProviderId('');
    setManualProviderName('');
    setManualProviderNit('');
    setManualProviderCommercialName('');
    setManualProviderEmail('');
    setManualDocumentType('Factura Física');
    setManualControlNumber('');
    setManualIssueDate(new Date().toISOString().slice(0, 10));
    setManualCurrency('');
    setManualSubTotal('');
    setManualIva('');
    setManualTotal('');
    setManualNotes('');
    setManualItems([]);
    setManualFeedback(null);
  };

  const filteredManualProviderProducts = useMemo(() => {
    const term = manualProductQuery.trim().toLowerCase();
    if (!term) return manualProviderProducts;
    return manualProviderProducts.filter((item) => {
      const descMatch = item.descripcion?.toLowerCase().includes(term);
      const codeMatch = item.codigo?.toLowerCase().includes(term);
      return descMatch || codeMatch;
    });
  }, [manualProviderProducts, manualProductQuery]);

  return {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    stats,
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
    annulledData,
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
    setManualDocumentType,
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
    manualProviderProducts,
    manualProviderProductsLoading,
    manualProductQuery,
    setManualProductQuery,
    manualSubmitting,
    manualFeedback,
    handleManualSubmit,
    resetManualForm,
    filteredManualProviderProducts
  };
};

export default useInsightsData;
