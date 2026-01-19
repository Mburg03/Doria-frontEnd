import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, RefreshCw, CheckCircle, Download, Calendar, Search, ShieldAlert, Package, X, History } from 'lucide-react';
import clsx from 'clsx';
import api from '../services/api';
import { getDefaultRange } from '../utils/dateRange';
import { useGmailAuth } from '../hooks/useGmailAuth';
import { useUsageLimits } from '../hooks/useUsageLimits';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        gmailStatus,
        activeAccount,
        error: gmailError,
        refreshStatus,
        handleConnectGmail
    } = useGmailAuth();
    const {
        usageInfo,
        error: usageError,
        refreshUsage
    } = useUsageLimits();
    const [selectedAccount, setSelectedAccount] = useState('');

    // Search State
    const [dateRange, setDateRange] = useState(getDefaultRange());
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [providerEmails, setProviderEmails] = useState([]);
    const [providerInput, setProviderInput] = useState('');
    const [recentProviders, setRecentProviders] = useState([]);
    const [searchMode, setSearchMode] = useState('all'); // 'all' or 'providers'

    const recentKey = user?._id ? `doria.providers.recent.${user._id}` : 'doria.providers.recent';
    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const maxProviders = 10;
    useEffect(() => {
        setSelectedAccount(activeAccount?.id || activeAccount?._id || '');
    }, [activeAccount]);

    const activeAccounts = useMemo(
        () => (gmailStatus.accounts || []).filter((account) => account.status !== 'disabled'),
        [gmailStatus.accounts]
    );

    useEffect(() => {
        try {
            const stored = localStorage.getItem(recentKey);
            if (stored) {
                setRecentProviders(JSON.parse(stored));
            }
        } catch { /* ignore */ }
    }, [recentKey]);

    const persistRecent = (items) => {
        setRecentProviders(items);
        try {
            localStorage.setItem(recentKey, JSON.stringify(items));
        } catch { /* ignore */ }
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
                setError(`Máximo ${maxProviders} proveedores.`);
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
                setError(`Máximo ${maxProviders} proveedores.`);
                return prev;
            }
            return [...prev, email];
        });
    };

    // Load latest package


    const handleSearch = async () => {
        setIsSearching(true);
        setResults(null);
        setError(null);
        // Validar rango máximo 31 días
        if (!dateRange.startDate || !dateRange.endDate) {
            setError('Selecciona fecha inicio y fin.');
            setIsSearching(false);
            return;
        }
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > 31) {
            setError('Máximo 31 días por búsqueda.');
            setIsSearching(false);
            return;
        }
        try {
            // Genera paquete y devuelve summary + packageId
            const res = await api.post('/packages/generate', {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                accountId: selectedAccount || undefined,
                includeSpam: true,
                exhaustive: true,
                senderEmails: searchMode === 'providers' && providerEmails.length ? providerEmails : undefined
            });
            setResults(res.data);
            if (res.data?.limitInfo) {
                refreshUsage();
            }
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.msg || err.message;
            if (err.response?.status === 401 && message?.toLowerCase().includes('reconecta')) {
                setError('Tu cuenta de Google expiró. Reconecta presionando el botón.');
                await refreshStatus();
            } else {
                setError(message);
            }
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
        } catch (err) {
            setError('No se pudo descargar el ZIP. Reintenta.');
        }
    };

    const handleDownloadMaster = (url) => {
        if (url) {
            window.location.href = url;
        }
    };

    const handleConnectClick = async () => {
        if (gmailStatus.connected) {
            navigate('/accounts');
            return;
        }
        await handleConnectGmail();
    };

    const handleDisconnectGmail = async () => {
        if (!selectedAccount && activeAccounts.length > 1) {
            setError('Selecciona una cuenta para desconectar.');
            return;
        }
        try {
            const target = activeAccounts.find((a) => a.primary) || activeAccounts[0];
            const targetId = target ? target._id || target.id : null;
            if (!targetId) {
                setError('No tienes cuentas activas para desconectar.');
                return;
            }
            await api.delete(`/gmail/${targetId}`);
            await refreshStatus();
            setSelectedAccount('');
        } catch (err) {
            setError('No se pudo desconectar Gmail. Intenta de nuevo.');
        }
    };

    const displayError = error || gmailError || usageError;

    // Vista para usuarios viewer (sin permisos)
    if (user?.role === 'viewer') {
        return (
            <>
                <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel</h1>
                    <p className="text-gray-600 mb-4">
                        Tu cuenta es de solo visualización. Solicita acceso básico para generar paquetes y conectar Gmail.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
                        <p>Si necesitas permisos, contacta a un administrador o soporte.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* dynamic Header */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-3 mb-1">
                    <div className="h-1 w-5 bg-blue-600 rounded-full"></div>
                    <span className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">Dashboard</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Hola, <span className="text-blue-600 font-bold">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm font-medium">Gestiona tus descargas de facturas y conexiones.</p>
            </div>

            {/* Top Stats Grid - Horizontal for better space usage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Connection Card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                            gmailStatus.connected ? "text-green-500" : "text-amber-500"
                        )}>
                            <Mail size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Gmail</p>
                            <p className="text-lg font-black text-gray-900 leading-tight">
                                {gmailStatus.needsReconnect ? 'Reconexión' : gmailStatus.connected ? 'Conectado' : 'Desconectado'}
                            </p>
                            {activeAccount && (
                                <p className="text-[11px] text-blue-500 font-bold mt-0.5 truncate max-w-[150px]">
                                    {activeAccount.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleConnectClick}
                        className="px-4 py-2 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
                    >
                        {gmailStatus.connected ? 'Gestionar' : 'Conectar'}
                    </button>
                </div>

                {/* Usage Card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm group hover:border-blue-100 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl text-blue-500 flex items-center justify-center transition-all duration-300">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Uso del Plan</p>
                                <p className="text-lg font-bold text-gray-900 leading-tight">
                                    {usageInfo?.used || 0} <span className="text-xs font-medium text-gray-400">/ {usageInfo?.limit || 0} DTEs</span>
                                </p>
                            </div>
                        </div>
                        {usageInfo?.plan && (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-black uppercase border border-blue-100">
                                {usageInfo.plan}
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                            <div
                                className={clsx(
                                    "h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)",
                                    usageInfo?.remaining <= 0 ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                                )}
                                style={{ width: `${Math.min(((usageInfo?.used || 0) / (usageInfo?.limit || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            <span>Progreso mensual</span>
                            <span className="text-blue-600">{usageInfo?.remaining || 0} Disponibles</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Tool - "Slim" and Modern */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/40 border border-gray-50 p-7 mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-50/10 rounded-full blur-3xl text-blue-500"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filtro de Extracción</h2>
                        <p className="text-xs text-gray-400 font-medium">Localiza y organiza tus facturas desde Gmail.</p>
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                        <button
                            onClick={() => setSearchMode('all')}
                            className={clsx(
                                "px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                                searchMode === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setSearchMode('providers')}
                            className={clsx(
                                "px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                                searchMode === 'providers' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Por Proveedor
                        </button>
                    </div>
                </div>

                {/* Provider Section - Conditional */}
                {searchMode === 'providers' && (
                    <div className="mb-8 relative group animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Correos de proveedores</label>
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px] items-center">
                            {providerEmails.map((email) => (
                                <span key={email} className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-full animate-in zoom-in duration-300">
                                    {email}
                                    <button type="button" onClick={() => removeProvider(email)} className="text-blue-400 hover:text-blue-700 transition-colors">
                                        <X size={12} strokeWidth={3} />
                                    </button>
                                </span>
                            ))}
                            {providerEmails.length === 0 && (
                                <span className="text-[11px] text-gray-300 italic py-1 leading-none">Agrega al menos un correo para filtrar...</span>
                            )}
                        </div>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                value={providerInput}
                                onChange={(e) => setProviderInput(e.target.value)}
                                onKeyDown={handleProviderKey}
                                onBlur={addProvidersFromInput}
                                placeholder="Escribe el correo y presiona Enter..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-0 outline-none text-xs font-bold text-gray-900 transition-all shadow-sm"
                            />
                        </div>

                        {recentProviders.length > 0 && providerEmails.length < maxProviders && (
                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Sugerencias:</span>
                                {recentProviders.filter(r => !providerEmails.includes(r)).slice(0, 5).map(email => (
                                    <button
                                        key={email}
                                        type="button"
                                        onClick={() => handleUseRecent(email)}
                                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-gray-100 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-all"
                                    >
                                        {email}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative">
                    <div className="md:col-span-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Fecha inicio</label>
                        <div className="relative group">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="date"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-0 outline-none text-xs font-bold text-gray-900 transition-all shadow-sm"
                                value={dateRange.startDate}
                                max={new Date().toLocaleDateString('en-CA')}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5 ml-1">Fecha fin</label>
                        <div className="relative group">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="date"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-0 outline-none text-xs font-bold text-gray-900 transition-all shadow-sm"
                                value={dateRange.endDate}
                                max={new Date().toLocaleDateString('en-CA')}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-4">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !dateRange.startDate || !dateRange.endDate || !gmailStatus.connected}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                            style={{ height: '48px' }}
                        >
                            {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={18} />}
                            {isSearching ? 'PROCESANDO...' : 'BUSCAR'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <CheckCircle size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-500">Búsqueda exhaustiva activada (incluye carpeta Spam)</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                        <ShieldAlert size={14} className="text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Máximo 31 días por búsqueda</span>
                    </div>
                </div>

                {!gmailStatus.connected && (
                    <div className="mt-6 flex items-center gap-4 text-amber-600 bg-amber-50 p-5 rounded-3xl border border-amber-100 text-sm font-bold animate-in zoom-in duration-300">
                        <ShieldAlert size={20} />
                        <span>Es necesario conectar una cuenta de Gmail para realizar búsquedas.</span>
                    </div>
                )}
            </div>

            {/* Error and Results */}
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                {displayError && (
                    <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        {displayError}
                    </div>
                )}

                {results && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
                        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gradient-to-br from-gray-50/50 via-white to-white">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-200"></div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Extracción Exitosa</h3>
                                </div>
                                <p className="text-gray-500 font-medium max-w-xl leading-relaxed">
                                    Hemos analizado <span className="text-blue-600 font-black">{results.summary?.messagesFound ?? results.messagesFound ?? 0} correos</span>,
                                    detectando <span className="text-gray-900 font-black">{results.summary?.filesSaved ?? results.filesSaved ?? 0} documentos</span> DTE para procesar.
                                </p>
                                <div className="flex gap-4 mt-5">
                                    <span className="px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        PDF: <span className="text-gray-900">{results.summary?.pdfCount ?? results.pdfCount ?? 0}</span>
                                    </span>
                                    <span className="px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        JSON: <span className="text-gray-900">{results.summary?.jsonCount ?? results.jsonCount ?? 0}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="shrink-0">
                                {results.master?.url ? (
                                    <button
                                        onClick={() => handleDownloadMaster(results.master.url)}
                                        className="px-10 py-5 bg-green-600 text-white text-base font-black rounded-2xl hover:bg-green-700 transition-all flex items-center gap-4 shadow-xl shadow-green-100 group active:scale-95"
                                    >
                                        <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                                        DESCARGAR TODO (.ZIP)
                                    </button>
                                ) : results.packages?.length === 1 && (
                                    <button
                                        onClick={() => handleDownloadPackage(results.packages[0].id)}
                                        className="px-10 py-5 bg-green-600 text-white text-base font-black rounded-2xl hover:bg-green-700 transition-all flex items-center gap-4 shadow-xl shadow-green-100 group active:scale-95"
                                    >
                                        <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                                        DESCARGAR ZIP
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-10 bg-white">
                            {results.packages?.length > 1 && !results.master?.url ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {results.packages.map((pkg) => (
                                        <div key={pkg.id} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all duration-500">
                                            <div className="flex gap-6 items-center">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Download size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-lg">
                                                        Periodo: {pkg.startDate} — {pkg.endDate}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-1">
                                                        {pkg.accountEmail} · {pkg.pdfCount} PDFs · {pkg.jsonCount} JSONs
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadPackage(pkg.id)}
                                                className="w-14 h-14 bg-white text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-gray-100 flex items-center justify-center active:scale-90"
                                            >
                                                <Download size={24} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20 duration-[2000ms]"></div>
                                        <div className="relative w-28 h-28 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-green-100">
                                            <CheckCircle size={56} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <h4 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">¡Extracción Lista!</h4>
                                    <p className="text-gray-500 font-medium max-w-xs text-lg">
                                        Hemos organizado tus archivos perfectamente para descargar.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
