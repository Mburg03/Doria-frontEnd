import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import { RefreshCw, Loader2, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis } from 'recharts';

const formatDate = (iso) => new Date(iso).toLocaleString();

const Accounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, usageRes] = await Promise.all([
        api.get('/gmail/status'),
        api.get('/packages/usage')
      ]);
      setAccounts(statusRes.data.accounts || []);
      setUsage(usageRes.data);
    } catch (err) {
      setError('No se pudieron cargar las cuentas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReplace = async (id, isReauth = false) => {
    if (!window.confirm(isReauth ? '¿Reautenticar esta cuenta? No consumirá cambios.' : '¿Reemplazar esta cuenta por otra? Se consumirá un cambio disponible.')) return;
    setReplacingId(id);
    setError(null);
    try {
      const res = await api.post('/gmail/replace', { targetAccountId: id });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'No se pudo iniciar el reemplazo.');
    } finally {
      setReplacingId(null);
    }
  };

  const handleConnect = async () => {
    const planLimits = { personal: 1, negocio: 2, pro: 4 };
    const activeCount = accounts.filter((a) => a.status === 'active').length;
    const allowed = planLimits[user?.plan] || 1;
    if (activeCount >= allowed) {
      setError(`Tu plan permite hasta ${allowed} cuentas activas. Reemplaza una para continuar.`);
      return;
    }
    try {
      const res = await api.get('/gmail/auth');
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setError('No se pudo iniciar la conexión con Gmail. Revisa tu sesión o cupo.');
    }
  };

  const handleSetPrimary = async (id) => {
    setActivatingId(id);
    setError(null);
    try {
      await api.patch(`/gmail/${id}/activate`);
      await loadData();
    } catch {
      setError('No se pudo marcar como activa.');
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestionar cuentas</h1>
          <p className="text-gray-500">Conecta o desconecta tus cuentas de Gmail.</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refrescar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Destacado: cuenta con más DTE */}
      {!loading && accounts.length > 0 && (
        <TopAccountHighlight accounts={accounts} />
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cuentas conectadas</h2>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
              <path fill="#EA4335" d="M24 9.5c3.23 0 5.44 1.4 6.68 2.57l4.87-4.78C32.67 4.2 28.78 2.5 24 2.5 14.82 2.5 7.09 8.73 4.66 17.1l5.96 4.63C11.77 14.86 17.25 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.47-.13-2.89-.38-4.25H24v8.05h12.65c-.55 2.95-2.19 5.46-4.67 7.15l7.36 5.7C43.72 36.93 46.5 31.23 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.62 28.23A14.8 14.8 0 0 1 9.5 24c0-1.47.25-2.9.69-4.23l-5.96-4.63A21.95 21.95 0 0 0 2 24c0 3.53.84 6.87 2.33 9.86l6.29-5.63z"/>
              <path fill="#34A853" d="M24 46.5c5.94 0 10.93-1.95 14.58-5.3l-7.36-5.7c-2.06 1.39-4.69 2.2-7.22 2.2-6.75 0-12.46-4.56-14.5-10.87l-6.29 5.63C7.09 39.27 14.82 46.5 24 46.5z"/>
              <path fill="none" d="M2 2h44v44H2z"/>
            </svg>
            Añadir cuenta de Gmail
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500 flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" size={18} /> Cargando...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">Aún no tienes cuentas conectadas.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map((acc) => (
              <div key={acc.id || acc._id} className="px-4 py-3 grid grid-cols-6 gap-3 items-center text-sm text-gray-700">
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{acc.email}</p>
                    {acc.authState === 'expired' ? (
                      <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100">
                        Requiere reconexión
                      </span>
                    ) : acc.status === 'disabled' ? (
                      <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-100">
                        Deshabilitada
                      </span>
                    ) : acc.primary ? (
                      <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-100 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Activa
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Conectada: {formatDate(acc.connectedAt)}</p>
                  {acc.stats?.lastPackageAt && (
                    <p className="text-xs text-gray-500">Último paquete: {formatDate(acc.stats.lastPackageAt)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Paquetes</p>
                  <p className="font-semibold">{acc.stats?.totalPackages ?? 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">JSON</p>
                  <p className="font-semibold">{acc.stats?.totalJson ?? 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">PDF</p>
                  <p className="font-semibold">{acc.stats?.totalPdf ?? 0}</p>
                </div>
                <div className="text-right flex items-center justify-end gap-2">
                  {acc.authState === 'expired' ? (
                    <button
                      onClick={() => handleReplace(acc.id || acc._id, true)}
                      disabled={!!replacingId || acc.status === 'disabled'}
                      className="p-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      title="Reautenticar cuenta"
                    >
                      <RefreshCcw size={16} className={replacingId === (acc.id || acc._id) ? 'animate-spin' : ''} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReplace(acc.id || acc._id)}
                      disabled={!!replacingId || acc.status === 'disabled'}
                      className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      title="Reemplazar cuenta"
                    >
                      <RefreshCcw size={16} className={replacingId === (acc.id || acc._id) ? 'animate-spin' : ''} />
                    </button>
                  )}
                  <button
                    onClick={() => handleSetPrimary(acc.id || acc._id)}
                    disabled={!!activatingId || acc.status === 'disabled' || acc.primary || acc.authState === 'expired'}
                    className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    title="Usar esta cuenta"
                  >
                    <CheckCircle2 size={16} className={activatingId === (acc.id || acc._id) ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Accounts;

// Muestra la cuenta con más DTE (jsonCount) de forma simple
const TopAccountHighlight = ({ accounts }) => {
  const top = accounts
    .filter((a) => a.status !== 'disabled')
    .map((a) => ({
      email: a.email,
      total: a.stats?.totalJson || 0,
      pdf: a.stats?.totalPdf || 0,
      pkg: a.stats?.totalPackages || 0
    }))
    .sort((a, b) => b.total - a.total)[0];

  if (!top) return null;

  const pct = Math.min((top.total / Math.max(top.total || 1, 1)) * 100, 100);

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-gray-500 font-semibold">Distribución de DTE por cuenta</p>
        <span className="text-xs text-gray-400">DTEs (JSON)</span>
      </div>
      <AccountDteChart accounts={accounts} />
      <div className="text-xs text-gray-500">
        <p className="font-semibold text-gray-800">Top: {top.email}</p>
        <p>Paquetes: {top.pkg} · JSON: {top.total} · PDF: {top.pdf}</p>
      </div>
    </div>
  );
};

const AccountDteChart = ({ accounts }) => {
  const data = accounts.map((a) => ({
    name: a.email,
    dtes: a.stats?.totalJson || 0
  }));
  const maxValue = Math.max(...data.map((d) => d.dtes), 1);

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={0} textAnchor="middle" height={40} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, maxValue]} />
          <Tooltip formatter={(value) => [`${value} DTE`, 'DTEs']} />
          <Bar dataKey="dtes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
