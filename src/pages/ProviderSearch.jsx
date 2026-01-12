import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, CheckCircle, Download, Search, X } from 'lucide-react';

const ProviderSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gmailStatus, setGmailStatus] = useState({ connected: false, checking: true, accounts: [] });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [providerInput, setProviderInput] = useState('');
  const [providerEmails, setProviderEmails] = useState([]);
  const [recentProviders, setRecentProviders] = useState([]);
  const [includeSpam, setIncludeSpam] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [error, setError] = useState(null);

  const recentKey = user?._id ? `doria.providers.recent.${user._id}` : 'doria.providers.recent';
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const maxProviders = 10;

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await api.get('/packages/usage');
        setUsageInfo(res.data);
      } catch {
        // ignore
      }
    };
    fetchUsage();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/gmail/status');
      const accounts = res.data.accounts || [];
      const activeAccounts = accounts.filter((a) => a.status !== 'disabled');
      const primary = activeAccounts.find((a) => a.primary) || activeAccounts[0];
      const primaryExpired = primary?.authState === 'expired';
      setGmailStatus({
        connected: activeAccounts.length > 0 && !primaryExpired,
        checking: false,
        accounts: activeAccounts,
        needsReconnect: primaryExpired
      });
      setSelectedAccount(primary ? primary.id || primary._id || '' : '');
    } catch {
      setGmailStatus({ connected: false, checking: false, accounts: [], needsReconnect: false });
      setSelectedAccount('');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

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
        includeSpam,
        exhaustive: true,
        senderEmails: providerEmails
      });
      setResults(res.data);
      if (providerEmails.length) {
        const nextRecent = Array.from(new Set([...providerEmails, ...recentProviders])).slice(0, maxProviders);
        persistRecent(nextRecent);
      }
      if (res.data?.limitInfo) {
        setUsageInfo((prev) => ({ ...prev, ...res.data.limitInfo }));
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.msg || err.message;
      setError(message);
      await fetchStatus();
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

  const handleConnectGmail = async () => {
    if (gmailStatus.connected) {
      navigate('/accounts');
      return;
    }
    try {
      const res = await api.get('/gmail/auth');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setError('No se pudo iniciar la conexión con Gmail. Revisa tu sesión.');
    }
  };

  if (user?.role === 'viewer') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Búsqueda específica</h1>
          <p className="text-gray-600 mb-4">
            Tu cuenta es de solo visualización. Solicita acceso básico para generar paquetes.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Búsqueda específica</h1>
        <p className="text-gray-500">Filtra DTEs por proveedores y rango de fechas.</p>
      </div>

      <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search size={20} className="text-blue-600" />
                Buscar por proveedor
              </h2>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">
                EXHAUSTIVO
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correos de proveedor</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {providerEmails.map((email) => (
                    <span key={email} className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-full">
                      {email}
                      <button type="button" onClick={() => removeProvider(email)} className="text-gray-500 hover:text-gray-700">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={providerInput}
                  onChange={(e) => setProviderInput(e.target.value)}
                  onKeyDown={handleProviderKey}
                  onBlur={addProvidersFromInput}
                  placeholder="proveedor@dominio.com, otro@dominio.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Presiona Enter o coma para agregar. Máximo 10 proveedores.</p>
                {recentProviders.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recientes</p>
                    <div className="flex flex-wrap gap-2">
                      {recentProviders.map((email) => (
                        <button
                          key={email}
                          type="button"
                          onClick={() => handleUseRecent(email)}
                          className="px-2 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          {email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      value={dateRange.startDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      value={dateRange.endDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={includeSpam}
                  onChange={(e) => setIncludeSpam(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                Incluir correos en Spam
              </label>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearching ? 'Buscando...' : 'Buscar facturas'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

       

          {results && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resultados</h3>
                  <p className="text-sm text-gray-500">
                    Encontrados{' '}
                    <span className="font-bold text-gray-900">
                      {results.summary?.messagesFound ?? results.messagesFound ?? 0}
                    </span>{' '}
                    correos con{' '}
                    <span className="font-bold text-gray-900">
                      {results.summary?.filesSaved ?? results.filesSaved ?? 0}
                    </span>{' '}
                    adjuntos válidos. PDF:{' '}
                    <span className="font-bold text-gray-900">
                      {results.summary?.pdfCount ?? results.pdfCount ?? 0}
                    </span>{' '}
                    · JSON:{' '}
                    <span className="font-bold text-gray-900">
                      {results.summary?.jsonCount ?? results.jsonCount ?? 0}
                    </span>
                  </p>
                </div>
                {results.packages?.length === 1 && (
                  <button
                    onClick={() => handleDownloadPackage(results.packages[0].id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm shadow-green-200"
                  >
                    <Download size={16} />
                    Descargar ZIP
                  </button>
                )}
              </div>

              {results.packages?.length > 1 ? (
                <div className="divide-y divide-gray-100">
                  {results.packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">
                          Rango: {pkg.startDate} a {pkg.endDate}
                        </p>
                        <p className="text-xs text-gray-500">
                          Cuenta: {pkg.accountEmail || '—'} · PDFs: {pkg.pdfCount || 0} · JSON: {pkg.jsonCount || 0}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadPackage(pkg.id)}
                        className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm shadow-green-200"
                      >
                        <Download size={14} />
                        Descargar ZIP
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <div className="inline-flex justify-center items-center w-16 h-16 bg-green-50 text-green-600 rounded-full mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-gray-900 font-medium">Listo para descargar</h4>
                  <p className="text-gray-500 text-sm">Tu paquete se generó correctamente.</p>
                </div>
              )}
            </div>
          )}
      </div>
      
    </Layout>
  );
};

export default ProviderSearch;
