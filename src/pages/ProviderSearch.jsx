import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, CheckCircle, Download, Search, X, ShieldAlert, History, Mail } from 'lucide-react';
import { getDefaultRange } from '../utils/dateRange';
import { useGmailAuth } from '../hooks/useGmailAuth';

const ProviderSearch = () => {
  const { user } = useAuth();
  const {
    gmailStatus,
    activeAccount,
    error: gmailError,
    refreshStatus
  } = useGmailAuth();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [providerInput, setProviderInput] = useState('');
  const [providerEmails, setProviderEmails] = useState([]);
  const [recentProviders, setRecentProviders] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const recentKey = user?._id ? `doria.providers.recent.${user._id}` : 'doria.providers.recent';
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const maxProviders = 10;

  useEffect(() => {
    setSelectedAccount(activeAccount?.id || activeAccount?._id || '');
  }, [activeAccount]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(recentKey);
      if (stored) {
        setRecentProviders(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [recentKey]);

  const persistRecent = (items) => {
    setRecentProviders(items);
    try {
      localStorage.setItem(recentKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const clearRecent = () => {
    persistRecent([]);
  };

  const addProvidersFromInput = () => {
    const raw = providerInput.split(',');
    const cleaned = raw.map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (!cleaned.length) return;
    const invalid = cleaned.filter((email) => !emailPattern.test(email));
    const valid = cleaned.filter((email) => emailPattern.test(email));
    if (invalid.length) {
      setError(`Correos inválidos: ${invalid.join(', ')}`);
    }
    if (!valid.length) {
      setProviderInput('');
      return;
    }
    setProviderEmails((prev) => {
      const merged = Array.from(new Set([...prev, ...valid]));
      if (merged.length > maxProviders) {
        setError(`Máximo ${maxProviders} proveedores por búsqueda.`);
        return merged.slice(0, maxProviders);
      }
      return merged;
    });
    const nextRecent = Array.from(new Set([...valid, ...recentProviders])).slice(0, maxProviders);
    persistRecent(nextRecent);
    setProviderInput('');
  };

  const handleProviderKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addProvidersFromInput();
    }
  };

  const removeProvider = (email) => {
    setProviderEmails((prev) => prev.filter((item) => item !== email));
  };

  const handleUseRecent = (email) => {
    setProviderEmails((prev) => {
      if (prev.includes(email)) return prev;
      if (prev.length >= maxProviders) {
        setError(`Máximo ${maxProviders} proveedores por búsqueda.`);
        return prev;
      }
      return [...prev, email];
    });
  };

  const handleSearch = async () => {
    setError(null);
    setResults(null);
    if (!gmailStatus.connected) {
      setError('Necesitas una cuenta Gmail activa para buscar.');
      return;
    }
    if (!providerEmails.length) {
      setError('Ingresa al menos un correo de proveedor.');
      return;
    }
    if (providerEmails.length > maxProviders) {
      setError(`Máximo ${maxProviders} proveedores por búsqueda.`);
      return;
    }
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Selecciona fecha inicio y fin.');
      return;
    }
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      setError('Máximo 31 días por búsqueda.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.post('/packages/generate', {
        startDate: dateRange.startDate.replaceAll('-', '/'),
        endDate: dateRange.endDate.replaceAll('-', '/'),
        accountId: selectedAccount || undefined,
        includeSpam: true,
        exhaustive: true,
        senderEmails: providerEmails
      });
      setResults(res.data);
      if (providerEmails.length) {
        const nextRecent = Array.from(new Set([...providerEmails, ...recentProviders])).slice(0, maxProviders);
        persistRecent(nextRecent);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.msg || err.message;
      setError(message);
      await refreshStatus();
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadPackage = async (packageId) => {
    if (!packageId) return;
    try {
      const res = await api.get(`/packages/download/${packageId}?urlOnly=1`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError('No se pudo descargar el ZIP. Reintenta.');
      }
    } catch {
      setError('No se pudo descargar el ZIP. Reintenta.');
    }
  };

  const handleDownloadMaster = (url) => {
    if (url) {
      window.location.href = url;
    }
  };

  const displayError = error || gmailError;

  if (user?.role === 'viewer') {
    return (
      <>
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Búsqueda específica</h1>
          <p className="text-gray-600 mb-4">
            Tu cuenta es de solo visualización. Solicita acceso básico para generar paquetes.
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-1 w-5 bg-blue-600 rounded-full"></div>
          <span className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">Búsqueda específica</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Búsqueda <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Específica</span>
        </h1>
        <p className="text-gray-500 mt-1.5 text-base font-medium">Busca facturas de emisores específicos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="space-y-6 lg:col-span-8">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-50/20 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-8 relative">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Configuración de Filtro</h2>
                  <p className="text-sm text-gray-500 font-medium">Indica los correos de tus proveedores.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 relative">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Correos de proveedor</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {providerEmails.map((email) => (
                    <span key={email} className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full animate-in zoom-in duration-300">
                      {email}
                      <button type="button" onClick={() => removeProvider(email)} className="text-blue-400 hover:text-blue-700 transition-colors">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                  {providerEmails.length === 0 && (
                    <span className="text-[11px] text-gray-400 italic py-1">Aún no has agregado proveedores...</span>
                  )}
                </div>
                <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    value={providerInput}
                    onChange={(e) => setProviderInput(e.target.value)}
                    onKeyDown={handleProviderKey}
                    onBlur={addProvidersFromInput}
                    placeholder="Escribe un correo y presiona Enter..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-0 outline-none text-xs font-bold text-gray-900 transition-all shadow-sm"
                  />
                </div>
                <p className="mt-2.5 text-[10px] text-gray-400 font-medium flex items-center gap-2">
                  <ShieldAlert size={12} /> Máximo 10 proveedores por búsqueda separada por comas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Fecha inicio</label>
                  <div className="relative group">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="date"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-0 outline-none text-xs font-bold text-gray-900 transition-all shadow-sm"
                      value={dateRange.startDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Fecha fin</label>
                  <div className="relative group">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="date"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-0 outline-none text-xs font-bold text-gray-900 transition-all shadow-sm"
                      value={dateRange.endDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-400">Búsqueda exhaustiva activada (incluye carpeta Spam)</span>
                </div>

                <div className="w-full md:w-48">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !providerEmails.length || !gmailStatus.connected}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                    style={{ height: '48px' }}
                  >
                    {isSearching ? <History className="animate-spin" size={20} /> : <Search size={18} />}
                    {isSearching ? 'BUSCANDO...' : 'BUSCAR FACTURAS'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {displayError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-300">
              <ShieldAlert size={18} className="shrink-0" />
              {displayError}
            </div>
          )}

          {results && (
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50/30">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Extracción Lista</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-sm font-medium text-gray-500">
                      <span className="font-bold text-blue-600">{results.summary?.filesSaved ?? results.filesSaved ?? 0}</span> Facturas encontradas
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                      <span>PDF: {results.summary?.pdfCount ?? results.pdfCount ?? 0}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>JSON: {results.summary?.jsonCount ?? results.jsonCount ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0">
                  {results.master?.url ? (
                    <button
                      onClick={() => handleDownloadMaster(results.master.url)}
                      className="w-full md:w-auto px-6 py-2.5 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95"
                    >
                      <Download size={18} />
                      DESCARGAR TODO
                    </button>
                  ) : results.packages?.length === 1 && (
                    <button
                      onClick={() => handleDownloadPackage(results.packages[0].id)}
                      className="w-full md:w-auto px-6 py-2.5 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95"
                    >
                      <Download size={18} />
                      DESCARGAR ZIP
                    </button>
                  )}
                </div>
              </div>

              {results.packages?.length > 1 && !results.master?.url ? (
                <div className="divide-y divide-gray-50">
                  {results.packages.map((pkg) => (
                    <div key={pkg.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">
                          Rango: {pkg.startDate} a {pkg.endDate}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">
                          PDFs: {pkg.pdfCount || 0} · JSON: {pkg.jsonCount || 0}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadPackage(pkg.id)}
                        className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Download size={14} />
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="inline-flex justify-center items-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-50">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-xl font-extrabold text-gray-900">Proceso Completado</h4>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto font-medium">Todos los documentos solicitados han sido procesados y están listos para tu descarga.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-6 lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History size={18} className="text-blue-600" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Proveedores recientes</h3>
              </div>
              {recentProviders.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            {recentProviders.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Historial de correos utilizados últimamente. Toca uno para añadirlo al filtro actual.
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentProviders.map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => handleUseRecent(email)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-gray-100 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-all active:scale-95"
                    >
                      {email}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 px-4 py-8 text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-300 mx-auto mb-3 shadow-sm">
                  <Mail size={24} />
                </div>
                <p className="text-sm font-bold text-gray-900">Sin historial aún</p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  Aquí verás los proveedores que busques con frecuencia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderSearch;
