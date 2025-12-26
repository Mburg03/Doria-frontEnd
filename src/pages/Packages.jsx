import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Download, Clock, FileText, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, ReferenceLine, YAxis } from 'recharts';

const formatDate = (iso) => new Date(iso).toLocaleString();
const formatSize = (bytes = 0) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const RETENTION_DAYS = 30;

const getExpiryMeta = (createdAt) => {
  if (!createdAt) return { daysLeft: null, expired: false };
  const exp = new Date(createdAt);
  exp.setDate(exp.getDate() + RETENTION_DAYS);
  const msLeft = exp.getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return { daysLeft, expired: daysLeft <= 0, expiresAt: exp };
};

const Packages = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [usage, setUsage] = useState(null); // {used, remaining, limit}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgRes, usageRes] = await Promise.all([
        api.get('/packages?limit=50&page=1'),
        api.get('/packages/usage').catch(() => null)
      ]);
      setItems(pkgRes.data.items || []);
      if (usageRes?.data) setUsage(usageRes.data);
    } catch (err) {
      setError('No se pudieron cargar los paquetes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDownload = async (id) => {
    try {
      const res = await api.get(`/packages/download/${id}?urlOnly=1`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setError('No se pudo descargar el paquete. Intenta de nuevo.');
    }
  };

  if (user?.role === 'viewer') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paquetes</h1>
          <p className="text-gray-600">Tu cuenta es de solo visualización. Solicita acceso básico para ver y descargar paquetes.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paquetes</h1>
          <p className="text-gray-500">Historial de paquetes generados.</p>
        </div>
        <button
          onClick={fetchPackages}
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

      {/* Resumen y gráfico */}
      {!loading && items.length > 0 && (
        <SummarySection items={items} usage={usage} />
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-500">
          Cargando...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-500">
          Aún no hay paquetes generados.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Desktop */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1.6fr_1.8fr_1.6fr_0.8fr_0.8fr_0.9fr_1.1fr] text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 px-4 py-3">
              <span>Fecha</span>
              <span>Rango</span>
              <span>Cuenta</span>
              <span className="text-right">JSON</span>
              <span className="text-right">PDF</span>
              <span className="text-right">Tamaño</span>
              <span className="text-right">Acción</span>
            </div>
            {items.map((pkg) => (
              <div key={pkg._id} className="grid grid-cols-[1.6fr_1.8fr_1.6fr_0.8fr_0.8fr_0.9fr_1.1fr] items-center px-4 py-3 border-b border-gray-50 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span>{formatDate(pkg.createdAt)}</span>
                    {(() => {
                      const { daysLeft, expired } = getExpiryMeta(pkg.createdAt);
                      if (daysLeft === null) return null;
                      if (expired) {
                        return <span className="text-xs text-red-600">Expirado</span>;
                      }
                      const warn = daysLeft <= 3;
                      return (
                        <span className={`text-xs ${warn ? 'text-amber-600' : 'text-gray-500'}`}>
                          Expira en {daysLeft} día{daysLeft === 1 ? '' : 's'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <span className="truncate">
                  {pkg.startDate && pkg.endDate ? `${pkg.startDate} a ${pkg.endDate}` : '—'}
                </span>
                <span className="truncate">{pkg.accountEmail || '—'}</span>
                <span className="text-right">{pkg.jsonCount ?? 0}</span>
                <span className="text-right">{pkg.pdfCount ?? 0}</span>
                <span className="text-right">{formatSize(pkg.sizeBytes)}</span>
                <div className="text-right">
                  {(() => {
                    const { expired } = getExpiryMeta(pkg.createdAt);
                    const canDownload = pkg.status === 'available' && !expired;
                    return canDownload ? (
                      <button
                        onClick={() => handleDownload(pkg._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <Download size={14} />
                        Descargar
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Expirado</span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-gray-100">
            {items.map((pkg) => (
              <div key={pkg._id} className="p-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span>{formatDate(pkg.createdAt)}</span>
                    {(() => {
                      const { daysLeft, expired } = getExpiryMeta(pkg.createdAt);
                      if (daysLeft === null) return null;
                      if (expired) return <span className="text-xs text-red-600">Expirado</span>;
                      const warn = daysLeft <= 3;
                      return (
                        <span className={`text-xs ${warn ? 'text-amber-600' : 'text-gray-500'}`}>
                          Expira en {daysLeft} día{daysLeft === 1 ? '' : 's'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Rango</p>
                  <p className="font-medium">{pkg.startDate && pkg.endDate ? `${pkg.startDate} a ${pkg.endDate}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Cuenta</p>
                  <p className="truncate font-medium">{pkg.accountEmail || '—'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>
                    <p className="uppercase">JSON</p>
                    <p className="text-gray-800 font-semibold">{pkg.jsonCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="uppercase">PDF</p>
                    <p className="text-gray-800 font-semibold">{pkg.pdfCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="uppercase">Tamaño</p>
                    <p className="text-gray-800 font-semibold">{formatSize(pkg.sizeBytes)}</p>
                  </div>
                </div>
                <div className="pt-1">
                  {(() => {
                    const { expired } = getExpiryMeta(pkg.createdAt);
                    const canDownload = pkg.status === 'available' && !expired;
                    return canDownload ? (
                      <button
                        onClick={() => handleDownload(pkg._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <Download size={14} />
                        Descargar
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Expirado</span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Packages;

// ---------- Componentes auxiliares ----------

const SummarySection = ({ items, usage }) => {
  const planLimit = usage?.limit || null;

  const stats = useMemo(() => {
    const totalJson = items.reduce((acc, cur) => acc + (cur.jsonCount || 0), 0);
    const totalPdf = items.reduce((acc, cur) => acc + (cur.pdfCount || 0), 0);
    const totalSizeBytes = items.reduce((acc, cur) => acc + (cur.sizeBytes || 0), 0);

    const chartData = items
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((p) => ({
        createdAtLabel: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/D',
        rangeLabel: p.startDate && p.endDate
          ? `${p.startDate} a ${p.endDate}`
          : 'N/D',
        batch: p.batchLabel,
        dtes: p.jsonCount || 0,
        mb: +(p.sizeBytes || 0) / (1024 * 1024),
        email: p.accountEmail || 'N/D'
      }))
      .slice(-10); // últimos 10 paquetes para el gráfico

    return {
      totalJson,
      totalPdf,
      totalSizeBytes,
      chartData
    };
  }, [items]);

  const used = usage?.used ?? stats.totalJson;
  const limit = planLimit ?? Math.max(stats.totalJson, 1);
  const remaining = usage?.remaining ?? Math.max(limit - used, 0);
  const pct = Math.min((used / limit) * 100, 100);

  return (
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle cx="32" cy="32" r="28" className="stroke-gray-100" strokeWidth="8" fill="none" />
            <circle
              cx="32"
              cy="32"
              r="28"
              className={remaining <= 0 ? 'stroke-red-500' : 'stroke-blue-500'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-900 text-center">
              {used}<br />/{limit}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Uso mensual de DTE</p>
          <p className="text-xs text-gray-600">
            {remaining <= 0 ? 'Límite alcanzado.' : `Te quedan ${remaining} DTEs en tu plan este mes.`}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <FileText size={16} className="text-indigo-500" /> Totales
        </p>
        <p className="text-lg font-semibold text-gray-900">{stats.totalJson} JSON · {stats.totalPdf} PDF</p>
        <p className="text-sm text-gray-500">Generados en {items.length} paquetes.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-1">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <BarChart2 size={16} className="text-green-600" /> Almacenamiento
        </p>
        <p className="text-lg font-semibold text-gray-900">{formatSize(stats.totalSizeBytes)}</p>
        <p className="text-sm text-gray-500">Acumulado en tus paquetes.</p>
      </div>

      <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Uso por paquete</h3>
          <span className="text-xs text-gray-500">Últimos {stats.chartData.length} paquetes</span>
        </div>
        {stats.chartData.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay suficientes datos para graficar.</p>
        ) : (
          <SimpleBarChart data={stats.chartData} planLimit={planLimit} />
        )}
      </div>
    </div>
  );
};

const SimpleBarChart = ({ data, planLimit }) => {
  const reference = planLimit || Math.max(...data.map((d) => d.dtes), 1);
  const chartData = data.map((d) => ({
    name: d.createdAtLabel || 'N/D',
    dtes: d.dtes,
    label: d.rangeLabel,
    batch: d.batch,
    email: d.email
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, reference]} />
          <Tooltip
            formatter={(value) => [`${value} DTE`, 'DTEs']}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              const parts = [];
              if (item?.label) parts.push(`Rango: ${item.label}`);
              if (item?.email) parts.push(`Cuenta: ${item.email}`);
              return parts.join(' · ') || `Fecha: ${label}`;
            }}  
          />
          {planLimit && <ReferenceLine y={planLimit} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Límite ${planLimit}`, position: 'insideTopRight', fontSize: 11 }} />}
          <Bar dataKey="dtes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
