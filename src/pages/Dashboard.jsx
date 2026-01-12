import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Mail, RefreshCw, CheckCircle, Download, Calendar, Search, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [gmailStatus, setGmailStatus] = useState({ connected: false, checking: true, accounts: [] });
    const [selectedAccount, setSelectedAccount] = useState('');

    // Search State
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [customKeywords, setCustomKeywords] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState(null);
    const [latestPackage, setLatestPackage] = useState(null);
    const [error, setError] = useState(null);
    const [usageInfo, setUsageInfo] = useState(null); // {limit, remaining, usedAfter, plan}
    const [includeSpam, setIncludeSpam] = useState(false);
    const [exhaustiveSearch, setExhaustiveSearch] = useState(null);

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

    // Initial Status Check & usage
    useEffect(() => {
        fetchStatus();
        const fetchUsage = async () => {
            try {
                const res = await api.get('/packages/usage');
                setUsageInfo({
                    plan: res.data.plan,
                    limit: res.data.limit,
                    usedAfter: res.data.used,
                    remaining: res.data.remaining,
                    zipLimitBytes: res.data.zipLimitBytes
                });
            } catch {
                // ignore
            }
        };
        fetchUsage();
    }, []);

    useEffect(() => {
        if (exhaustiveSearch !== null) return;
        if (!usageInfo?.plan) return;
        const defaultExhaustive = ['negocio', 'pro'].includes(usageInfo.plan);
        setExhaustiveSearch(defaultExhaustive);
    }, [usageInfo, exhaustiveSearch]);

    // Load keywords
    useEffect(() => {
        const loadKeywords = async () => {
            try {
                const res = await api.get('/keywords');
                setCustomKeywords(res.data.custom || []);
            } catch (err) {
                setError('No se pudieron cargar las keywords.');
            }
        };
        loadKeywords();
    }, []);

    // Load latest package
    useEffect(() => {
        const loadLatest = async () => {
            try {
                const res = await api.get('/packages/latest');
                setLatestPackage(res.data);
            } catch (err) {
                // silencioso
            }
        };
        loadLatest();
    }, []);

    const defaultExhaustive = ['negocio', 'pro'].includes(usageInfo?.plan || '');
    const effectiveExhaustive = exhaustiveSearch ?? defaultExhaustive;

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
                startDate: dateRange.startDate.replaceAll('-', '/'),
                endDate: dateRange.endDate.replaceAll('-', '/'),
                accountId: selectedAccount || undefined,
                includeSpam,
                exhaustive: effectiveExhaustive
            });
            setResults(res.data);
            if (res.data?.limitInfo) {
                setUsageInfo(res.data.limitInfo);
            }
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.msg || err.message;
            if (err.response?.status === 401 && message?.toLowerCase().includes('reconecta')) {
                setError('Tu cuenta de Google expiró. Reconecta presionando el botón.');
                await fetchStatus();
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

    const handleConnectGmail = async () => {
        // Si ya hay cuentas activas, lleva a gestionar cuentas
        if (gmailStatus.connected) {
            navigate('/accounts');
            return;
        }
        try {
            const res = await api.get('/gmail/auth');
            if (res.data?.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            setError('No se pudo iniciar la conexión con Gmail. Revisa tu sesión.');
        }
    };

    const handleDisconnectGmail = async () => {
        if (!selectedAccount && gmailStatus.accounts.length > 1) {
            setError('Selecciona una cuenta para desconectar.');
            return;
        }
        try {
            const activeAccounts = gmailStatus.accounts || [];
            const target = activeAccounts.find((a) => a.primary) || activeAccounts[0];
            const targetId = target ? target._id || target.id : null;
            if (!targetId) {
                setError('No tienes cuentas activas para desconectar.');
                return;
            }
            await api.delete(`/gmail/${targetId}`);
            await fetchStatus();
            setSelectedAccount('');
        } catch (err) {
            setError('No se pudo desconectar Gmail. Intenta de nuevo.');
        }
    };

    // Vista para usuarios viewer (sin permisos)
    if (user?.role === 'viewer') {
        return (
            <Layout>
                <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel</h1>
                    <p className="text-gray-600 mb-4">
                        Tu cuenta es de solo visualización. Solicita acceso básico para generar paquetes y conectar Gmail.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
                        <p>Si necesitas permisos, contacta a un administrador o soporte.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
                <p className="text-gray-500">Gestiona tus descargas de facturas y conexiones.</p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Search Tools */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Search Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Search size={20} className="text-blue-600" />
                                Buscar facturas
                            </h2>
                            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">
                                KEYWORDS ACTIVAS
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Date Range */}
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

                    {/* Selector de cuenta Gmail (si hay varias) */}
                    {/* Selector removido: usaremos siempre la cuenta primaria */}

                            {/* Keywords removidas del dashboard (se gestionan en Ajustes) */}
                            {/* Action Button */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    id="includeSpam"
                                    type="checkbox"
                                    checked={includeSpam}
                                    onChange={(e) => setIncludeSpam(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <label htmlFor="includeSpam">Incluir correos en Spam</label>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <input
                                    id="exhaustiveSearch"
                                    type="checkbox"
                                    checked={effectiveExhaustive}
                                    onChange={(e) => setExhaustiveSearch(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <label htmlFor="exhaustiveSearch">
                                    Búsqueda exhaustiva (más lenta, encuentra correos sin keywords)
                                </label>
                            </div>

                            <button
                                onClick={handleSearch}
                                disabled={
                                    isSearching ||
                                    !dateRange.startDate ||
                                    !dateRange.endDate ||
                                    !gmailStatus.connected
                                }
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSearching ? <RefreshCw className="animate-spin" /> : <Search size={20} />}
                                {isSearching ? 'Buscando...' : 'Buscar facturas'}
                            </button>

                            {!gmailStatus.connected && (
                                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                                    <ShieldAlert size={16} />
                                    <span>Conecta tu cuenta de Gmail para poder buscar facturas.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Area */}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100 text-sm">
                        <p>Máximo 31 días por búsqueda para asegurar la descarga.</p>
                        {usageInfo?.zipLimitBytes ? (
                            <p className="mt-1">
                                Límite por paquete: {(usageInfo.zipLimitBytes / (1024 * 1024)).toFixed(0)} MB.
                            </p>
                        ) : null}
                    </div>


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
                                        adjuntos válidos.
                                        {' '}PDF: <span className="font-bold text-gray-900">
                                            {results.summary?.pdfCount ?? results.pdfCount ?? 0}
                                        </span>{' '}
                                        · JSON:{' '}
                                        <span className="font-bold text-gray-900">
                                            {results.summary?.jsonCount ?? results.jsonCount ?? 0}
                                        </span>
                                    </p>
                                    {results.searchMode === 'exhaustive' && (
                                        <p className="mt-1 text-xs text-blue-700">
                                            Búsqueda exhaustiva activada.
                                        </p>
                                    )}
                                    {results.limitInfo?.limitReached && results.limitInfo?.message && (
                                        <p className="mt-1 text-xs text-amber-700">{results.limitInfo.message}</p>
                                    )}
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
                                    <div className="text-sm text-gray-600">
                                        <p>
                                            Correos: <span className="font-semibold">{results.summary?.messagesFound ?? results.messagesFound ?? 0}</span> · Archivos: <span className="font-semibold">{results.summary?.filesSaved ?? results.filesSaved ?? 0}</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Right Column: Status & History */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Mail size={100} />
                        </div>
                        <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Estado de conexión</h3>

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-full ${gmailStatus.connected ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                <Mail size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">
                                    {gmailStatus.needsReconnect ? 'Requiere reconexión' : gmailStatus.connected ? 'Conectado' : 'Desconectado'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {gmailStatus.accounts?.length
                                        ? (
                                            <>
                                                <span className="font-semibold text-gray-900">Activa:</span>{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {gmailStatus.accounts.find((a) => a.primary)?.email ||
                                                        gmailStatus.accounts[0].email}
                                                </span>
                                            </>
                                        )
                                        : 'Cuenta Gmail'}
                                </p>
                                {gmailStatus.accounts?.length > 1 && (
                                    <p className="text-[11px] text-gray-400">
                                        Otras: {gmailStatus.accounts.filter((a) => !a.primary).map((a) => a.email).join(' · ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleConnectGmail}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
                        >
                            <span className="inline-flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
                                    <path fill="#EA4335" d="M24 9.5c3.23 0 5.44 1.4 6.68 2.57l4.87-4.78C32.67 4.2 28.78 2.5 24 2.5 14.82 2.5 7.09 8.73 4.66 17.1l5.96 4.63C11.77 14.86 17.25 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.5 24.5c0-1.47-.13-2.89-.38-4.25H24v8.05h12.65c-.55 2.95-2.19 5.46-4.67 7.15l7.36 5.7C43.72 36.93 46.5 31.23 46.5 24.5z"/>
                                    <path fill="#FBBC05" d="M10.62 28.23A14.8 14.8 0 0 1 9.5 24c0-1.47.25-2.9.69-4.23l-5.96-4.63A21.95 21.95 0 0 0 2 24c0 3.53.84 6.87 2.33 9.86l6.29-5.63z"/>
                                    <path fill="#34A853" d="M24 46.5c5.94 0 10.93-1.95 14.58-5.3l-7.36-5.7c-2.06 1.39-4.69 2.2-7.22 2.2-6.75 0-12.46-4.56-14.5-10.87l-6.29 5.63C7.09 39.27 14.82 46.5 24 46.5z"/>
                                    <path fill="none" d="M2 2h44v44H2z"/>
                                </svg>
                                {gmailStatus.needsReconnect
                                    ? 'Reconectar Gmail'
                                    : gmailStatus.connected
                                    ? 'Gestionar cuentas'
                                    : 'Conectar Gmail'}
                            </span>
                        </button>
                        {gmailStatus.needsReconnect && (
                            <p className="mt-2 text-xs text-amber-700">
                                Tu cuenta de Google expiró. Reconecta presionando el botón.
                            </p>
                        )}
                    </div>

                    {/* Estado de cuenta (uso y último paquete) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Estado de cuenta</h3>
                            {usageInfo?.plan && (
                                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                    Plan: {usageInfo.plan}
                                </span>
                            )}
                        </div>
                        {usageInfo && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-gray-700">
                                    <span>Uso mensual de DTE</span>
                                    <span>{usageInfo.usedAfter} / {usageInfo.limit}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${usageInfo.remaining <= 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min((usageInfo.usedAfter / usageInfo.limit) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                {usageInfo.remaining <= 0 ? (
                                    <p className="text-xs text-red-600">
                                        Has alcanzado tu límite de DTEs este mes. Considera actualizar tu plan.
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-600">
                                        Te quedan {usageInfo.remaining} DTEs en tu plan actual este mes.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Se removió la tarjeta de último paquete para simplificar la vista */}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
