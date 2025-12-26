import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { X, RefreshCw, Info } from 'lucide-react';

const Settings = () => {
  const [baseKeywords, setBaseKeywords] = useState([]);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadKeywords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/keywords');
      setBaseKeywords(res.data.base || []);
      setCustomKeywords(res.data.custom || []);
    } catch (err) {
      setError('No se pudieron cargar las keywords.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeywords();
  }, []);

  const handleDelete = async (kw) => {
    try {
      const res = await api.delete(`/keywords/${encodeURIComponent(kw)}`);
      setCustomKeywords(res.data.custom || []);
    } catch {
      setError('No se pudo eliminar la keyword.');
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
          <p className="text-gray-500">Gestiona tus keywords y soporte.</p>
        </div>
        <button
          onClick={loadKeywords}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Keywords base</h2>
          <p className="text-sm text-gray-500 mb-4">Estas no se pueden eliminar.</p>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {baseKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm border border-gray-200"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Tus keywords</h2>
          <p className="text-sm text-gray-500 mb-4">Elimina las que ya no necesites.</p>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : customKeywords.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no tienes keywords personalizadas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm border border-indigo-100 inline-flex items-center gap-2"
                >
                  {kw}
                  <button onClick={() => handleDelete(kw)} className="hover:text-indigo-900">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
          <Info size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Soporte</h3>
          <p className="text-sm text-gray-600">
            Para ayuda o soporte, escríbenos a{' '}
            <a href="mailto:mburgosgit003@gmail.com" className="text-blue-600 underline">
              mburgosgit003@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
